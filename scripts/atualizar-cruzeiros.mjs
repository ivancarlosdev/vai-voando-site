import { readFile, writeFile, rename } from "node:fs/promises";
import { gunzipSync, gzipSync } from "node:zlib";

const origem = "https://mediumvioletred-peafowl-260122.hostingersite.com/dados-cruzeiros.js";
const arquivo = "docs/cruzeiros-v2.json.gz";
const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
const resposta = await fetch(origem, { signal: AbortSignal.timeout(30000), cache: "no-store" });
if (!resposta.ok) throw new Error("Fonte de cruzeiros respondeu HTTP " + resposta.status);

const texto = await resposta.text();
const bloco = /window\.CRUZEIROS\s*=\s*(\{[\s\S]*\})\s*;\s*$/.exec(texto);
if (!bloco) throw new Error("Catálogo de cruzeiros em formato inesperado");
const fonte = JSON.parse(bloco[1]);
const gerado = new Date(fonte.gerado);
if (!Number.isFinite(+gerado) || !Array.isArray(fonte.s) || !fonte.s.length ||
    !fonte.portos || !fonte.cias || !fonte.navios || !fonte.destinos ||
    !Array.isArray(fonte.it) || !Array.isArray(fonte.itp)) {
  throw new Error("Catálogo de cruzeiros incompleto");
}
const data = gerado.toISOString().slice(0, 10);
const anterior = JSON.parse(gunzipSync(await readFile(arquivo)));
if (data > hoje) throw new Error("Data da fonte está no futuro");
if (data < anterior.data || (data === anterior.data && (!anterior.gerado || +gerado <= Date.parse(anterior.gerado)))) {
  console.log("A fonte ainda não publicou uma base mais recente. Catálogo preservado (" + anterior.data + ").");
  process.exit(0);
}

const rotas = new Map();
for (const linha of fonte.s) {
  const [codigo, nomeOriginal, sigla, regiao, idPorto, ida, noites,
    interna, externa, varanda, suite, , imagem, idItinerario] = linha;
  const porto = fonte.portos[idPorto];
  const cia = fonte.cias[codigo];
  const navio = fonte.navios[codigo + "|" + sigla];
  const cabines = [interna, externa, varanda, suite].map((v) => Number.isFinite(v) && v > 0 ? v : null);
  const preco = Math.min(...cabines.filter((v) => v != null));
  if (!porto || !cia || !nomeOriginal || !Number.isFinite(preco) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(ida) || ida < hoje || !Number.isInteger(noites) || noites < 1) continue;

  const chave = JSON.stringify([codigo, nomeOriginal, sigla, idPorto, noites]);
  const itinerario = (fonte.it[idItinerario] || []).filter(([dia]) => dia > 0 && dia <= noites + 1);
  const dias = itinerario.map(([dia, indice, tipo, chegada, partida]) => [
    dia, tipo === 3 || indice === -1 ? "Navegação" : fonte.itp[indice] || "Escala", chegada || "", partida || "",
  ]);
  const saida = { ida, preco, cabines, dias };
  let rota = rotas.get(chave);
  if (!rota) {
    const prefixo = String(sigla || "") + " ";
    const nome = (sigla && nomeOriginal.startsWith(prefixo) ? nomeOriginal.slice(prefixo.length) : nomeOriginal)
      .replace(/\s+/g, " ").trim();
    const titulo = nome === nome.toUpperCase()
      ? nome.toLocaleLowerCase("pt-BR").replace(/(^|\s)\p{L}/gu, (letra) => letra.toUpperCase()) : nome;
    const brasil = porto.endsWith(", Brasil");
    const destino = brasil && /^(SAMER|SOUTH AMERICA)$/.test(regiao)
      ? "Brasil e América do Sul" : fonte.destinos[regiao] || regiao;
    const url = [navio?.img, imagem].find((valor) => typeof valor === "string" && /^https:\/\//i.test(valor));
    rota = { titulo, cia, codigo, navio: navio?.n || "", porto, destino, noites, url, brasil, saidas: new Map() };
    rotas.set(chave, rota);
  }
  const anterior = rota.saidas.get(ida);
  if (!anterior || preco < anterior.preco) rota.saidas.set(ida, saida);
}

const ofertas = Array.from(rotas.values(), (rota) => {
  const saidas = [...rota.saidas.values()].sort((a, b) => a.ida.localeCompare(b.ida));
  const escalas = [...new Set(saidas[0].dias.map(([, porto]) => porto)
    .filter((porto) => porto !== "Navegação" && porto !== "Escala"))].slice(0, 8);
  return { ...rota, saidas, escalas, ida: saidas[0].ida, preco: saidas[0].preco };
}).sort((a, b) => a.preco - b.preco);
const cotas = new Map();
const selecao = ofertas.filter((o) => {
  if (o.brasil) return true;
  const total = cotas.get(o.destino) || 0;
  cotas.set(o.destino, total + 1);
  return total < 8;
});
if (!selecao.length) throw new Error("A fonte não retornou saídas válidas. Catálogo preservado.");
await writeFile(arquivo + ".tmp", gzipSync(JSON.stringify({ data, gerado: gerado.toISOString(), ofertas: selecao }), { level: 9 }));
await rename(arquivo + ".tmp", arquivo);
console.log(selecao.length + " roteiros de cruzeiro da base de " + data + ".");
