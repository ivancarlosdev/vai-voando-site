import { writeFile, rename } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const portal = "https://viajandocomdesconto.com/promo-voo";
const arquivo = "docs/promo-voo.json.gz";
const iata = /^[A-Z]{3}$/;
const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());

async function baixar(url) {
  const resposta = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!resposta.ok) throw new Error(`Falha HTTP ${resposta.status} em ${url}`);
  return resposta.text();
}

function dataIso(ano, mes, dia) {
  const iso = `${ano}-${mes}-${dia}`;
  const instante = new Date(iso + "T00:00:00Z");
  return Number.isFinite(+instante) && instante.toISOString().slice(0, 10) === iso ? iso : "";
}

function dataVoo(valor) {
  const partes = /^(\d{2})(\d{2})(\d{2})$/.exec(valor);
  return partes ? dataIso("20" + partes[1], partes[2], partes[3]) : "";
}

async function lerFonte() {
  const html = await baixar(portal);
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)]
    .map(([, src]) => new URL(src.replaceAll("&amp;", "&"), portal))
    .filter((url) => url.origin === new URL(portal).origin && url.pathname.startsWith("/_s/"));
  const respostas = await Promise.allSettled(scripts.map(baixar));
  for (const resposta of respostas) {
    if (resposta.status !== "fulfilled") continue;
    const dados = /window\.__PVOO_PAYLOAD\s*=\s*(\{[^\r\n]+\});/.exec(resposta.value);
    if (dados) return JSON.parse(dados[1]);
  }
  throw new Error("O catálogo Promo Voo não foi encontrado nos scripts públicos da Cativa.");
}

function aeroporto(mapa, codigo, indice) {
  const cidade = mapa[codigo]?.[indice];
  return typeof cidade === "string" && cidade.trim() ? `${cidade.trim()} (${codigo})` : codigo;
}

function converter(dados) {
  const data = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dados.ger);
  const atualizadoEm = data ? dataIso(data[3], data[2], data[1]) : "";
  if (!atualizadoEm || typeof dados.blob !== "string" || !dados.mapa || !dados.blob.trim()) {
    throw new Error("A Cativa retornou um catálogo vazio ou em formato desconhecido.");
  }

  const voos = [];
  const vistos = new Set();
  for (const linha of dados.blob.split("\n")) {
    const [o, d, saida, retorno, , disponiveis, valor, moeda, prazo, , , , , taxa, nacional, cia] = linha.split("|");
    const ida = dataVoo(saida);
    const volta = dataVoo(retorno);
    const emitirAte = dataVoo(prazo);
    const lugares = Number(disponiveis);
    const cambio = moeda === "0" ? 1 : moeda === "1" && dados.usd > 1 ? Number(dados.usd) : NaN;
    const tarifa = Math.round(Number(valor) * cambio * 100) / 100;
    const taxas = nacional === "1" && Number.isFinite(Number(taxa)) && Number(taxa) > 0 ? Number(taxa) : null;
    if (!iata.test(o) || !iata.test(d) || !ida || ida < hoje || volta < ida ||
        (prazo && (!emitirAte || emitirAte < hoje)) || !Number.isInteger(lugares) || lugares <= 0 ||
        !Number.isFinite(tarifa) || tarifa <= 0 || !cia?.trim()) continue;
    const voo = {
      origem: aeroporto(dados.mapa, o, 0),
      destino: aeroporto(dados.mapa, d, 1),
      companhia: cia.trim(),
      ida, volta, tarifa, taxas, lugares,
      ...(emitirAte && { emitirAte }),
    };
    const chave = JSON.stringify(voo);
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    voos.push(voo);
  }
  if (!voos.length) throw new Error("Nenhuma tarifa válida na resposta. O último catálogo foi preservado.");
  return { atualizadoEm, voos };
}

const catalogo = converter(await lerFonte());
await writeFile(arquivo + ".tmp", gzipSync(JSON.stringify(catalogo), { level: 9 }));
await rename(arquivo + ".tmp", arquivo);
console.log(`${catalogo.voos.length} tarifas da Cativa, atualizadas em ${catalogo.atualizadoEm}.`);
