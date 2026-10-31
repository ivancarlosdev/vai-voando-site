// Lê as ofertas do portal Viajando com Desconto (Cativa Operadora) e grava docs/ofertas.json.
// Roda todo dia pelo GitHub Actions (veja .github/workflows/atualizar.yml).
// Uso do conteúdo autorizado pela Cativa Operadora.

import { chromium } from "playwright";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";

const PORTAL = "https://viajandocomdesconto.com/";
const PASTA = path.resolve("docs");
const ARQUIVO = path.join(PASTA, "ofertas.json");
const BAIXAR_IMAGENS = process.env.BAIXAR_IMAGENS !== "0";

// Esta função roda DENTRO da página do portal. Ela lê a lista de pacotes que o próprio portal monta
// e usa a função dele (vdSaidasDaOferta) para calcular as datas de saída, então as datas
// seguem exatamente a regra do portal. Não use variáveis de fora aqui.
function extrairNoNavegador() {
  const limpa = (v) => (v == null ? "" : String(v).trim());
  const dinheiro = (v) => {
    const m = /([\d.]+,\d{2})/.exec(limpa(v));
    return m ? Number(m[1].replace(/\./g, "").replace(",", ".")) : null;
  };
  const valorParcela = (v) => {
    const m = /(\d+)\s*x\s*de\s*R\$\s*([\d.]+)/i.exec(limpa(v));
    return m ? Number(m[2].replace(/\./g, "")) : null;
  };
  const p2 = (n) => String(n).padStart(2, "0");
  const dia = (d) => d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate());
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const lista = window.PACOTES;
  const saidasDe = window.vdSaidasDaOferta;
  if (!Array.isArray(lista) || typeof saidasDe !== "function") {
    throw new Error("O portal mudou: PACOTES ou vdSaidasDaOferta não foram encontrados");
  }

  const pacotes = [];
  for (const p of lista) {
    const origens = [];
    for (const o of p.origens || []) {
      const saidas = saidasDe(o)
        .filter((s) => s.ini >= hoje)
        .map((s) => [dia(s.ini), dia(s.fim), s.principal ? 1 : 0]);
      if (!saidas.length) continue;

      const hoteis = (o.hoteis || []).map((h) => ({
        nome: limpa(h.nome),
        regime: limpa(h.regime),
        preco: dinheiro(h.preco),
        taxas: dinheiro(h.taxas),
        promo: limpa(h.promo),
        parcela: limpa(h.parcela),
      }));

      let vp = valorParcela(o.min_parcela);
      if (vp == null) {
        const vs = hoteis.map((h) => valorParcela(h.parcela)).filter((v) => v != null);
        vp = vs.length ? Math.min(...vs) : null;
      }

      origens.push({
        iata: limpa(o.iata),
        cidade: limpa(o.cidade),
        uf: limpa(o.uf),
        parcela: limpa(o.min_parcela),
        valorParcela: vp,
        taxas: limpa(o.taxas),
        divulgacao: limpa(o.divulgacao),
        saidas,
        inclui: (o.inclui || []).map(limpa).filter(Boolean),
        hoteis,
      });
    }
    if (!origens.length) continue;

    // "O que inclui" costuma ser igual em todas as origens: guarda uma vez só no pacote.
    const base = JSON.stringify(origens[0].inclui);
    origens.forEach((o) => {
      if (JSON.stringify(o.inclui) === base) delete o.inclui;
    });

    pacotes.push({
      nome: limpa(p.nome),
      destino: limpa(p.destino),
      categoria: limpa(p.categoria),
      evento: !!p.evento,
      slug: limpa(p.slug),
      capa: limpa(p.capa),
      inclui: JSON.parse(base),
      origens,
    });
  }
  return { geradoEm: new Date().toISOString(), pacotes };
}

function contar(dados) {
  const pacotes = dados.pacotes.length;
  const origens = dados.pacotes.reduce((a, p) => a + p.origens.length, 0);
  const saidas = dados.pacotes.reduce((a, p) => a + p.origens.reduce((b, o) => b + o.saidas.length, 0), 0);
  return { pacotes, origens, saidas };
}

async function lerAnterior() {
  try {
    const antigo = JSON.parse(await readFile(ARQUIVO, "utf8"));
    return antigo.exemplo ? null : antigo;
  } catch {
    return null;
  }
}

async function existe(arquivo) {
  try {
    await access(arquivo);
    return true;
  } catch {
    return false;
  }
}

async function baixarImagens(context, dados) {
  const capas = [...new Set(dados.pacotes.map((p) => p.capa).filter(Boolean))];
  let baixadas = 0;
  let falhas = 0;
  const fila = [...capas];
  async function trabalhador() {
    while (fila.length) {
      const capa = fila.shift();
      const destino = path.join(PASTA, capa);
      if (!destino.startsWith(PASTA + path.sep)) continue; // segurança: só grava dentro de docs/
      if (await existe(destino)) continue;
      try {
        const resp = await context.request.get(new URL(capa, PORTAL).href, { timeout: 30_000 });
        if (!resp.ok()) throw new Error("HTTP " + resp.status());
        await mkdir(path.dirname(destino), { recursive: true });
        await writeFile(destino, await resp.body());
        baixadas++;
      } catch (e) {
        falhas++;
        console.warn("Imagem não baixada:", capa, e.message);
      }
    }
  }
  await Promise.all(Array.from({ length: 5 }, trabalhador));
  console.log(`Imagens: ${baixadas} novas, ${falhas} com falha, ${capas.length} no total`);
}

async function main() {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ locale: "pt-BR", timezoneId: "America/Sao_Paulo" });
    const page = await context.newPage();
    await page.goto(PORTAL, { waitUntil: "load", timeout: 90_000 });
    await page.waitForFunction(
      () => Array.isArray(window.PACOTES) && window.PACOTES.length > 0 && typeof window.vdSaidasDaOferta === "function",
      null,
      { timeout: 90_000 }
    );

    const dados = await page.evaluate(extrairNoNavegador);
    const n = contar(dados);
    console.log("Lido do portal:", n);

    // Trava de segurança: nunca troca a base boa por uma leitura vazia ou muito menor.
    if (n.pacotes < 100 || n.origens < 500) {
      throw new Error(`Leitura suspeita (${n.pacotes} pacotes, ${n.origens} origens). Base anterior mantida.`);
    }
    const anterior = await lerAnterior();
    if (anterior) {
      const a = contar(anterior);
      if (n.origens < a.origens * 0.5) {
        throw new Error(`Queda grande de ofertas (${a.origens} para ${n.origens}). Base anterior mantida.`);
      }
    }

    await mkdir(PASTA, { recursive: true });
    const saida = { geradoEm: dados.geradoEm, fonte: PORTAL, total: n, pacotes: dados.pacotes };
    await writeFile(ARQUIVO + ".tmp", JSON.stringify(saida));
    await writeFile(ARQUIVO, await readFile(ARQUIVO + ".tmp"));
    console.log("Gravado:", ARQUIVO);

    if (BAIXAR_IMAGENS) await baixarImagens(context, dados);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
