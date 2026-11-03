// Lê as corridas (turismo esportivo) de três parceiras e grava docs/corridas.json:
//   Sub4 (sub4.com.br), TravelRun (travelrun.com.br) e Travel Marathon (travelmarathon.com.br).
// Roda todo dia pelo GitHub Actions, junto com a atualização das ofertas (veja .github/workflows/atualizar.yml).
// Uso do conteúdo autorizado pelas três empresas.
// Se uma das fontes falhar, mantém as corridas anteriores dela e atualiza as outras.
//
// REGRA DO SITE (vale para corridas e pacotes): o que já passou da data não sobe. O que está esgotado sobe marcado
// como "Esgotado" (com lista de espera pelo WhatsApp), nunca como se estivesse à venda.

import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const PASTA = path.resolve("docs");
const ARQUIVO = path.join(PASTA, "corridas.json");
const UA = "Mozilla/5.0 (compatible; VaiVoandoMoradaDoSol/1.0; +https://www.vaivoandomoradadosol.com.br)";
const PAUSA = 400; // educação com os servidores das parceiras
// O site não mostra mais "o que está incluso" nas corridas. Para voltar a ler e mostrar, troque para true
// (e reative o bloco "Hotéis e o que está incluso" em docs/corridas.js).
const LER_INCLUSO = false;

// Trava de tempo: o GitHub cancela o trabalho inteiro depois de 20 minutos, e isso derrubaria também a atualização
// das ofertas. Por isso a leitura das corridas tem orçamento próprio: passou do limite, para de ler, mantém as
// corridas anteriores que ainda não foram relidas e segue. Quatro falhas seguidas numa fonte também a interrompem.
const LIMITE_MS = 11 * 60_000;
const t0 = Date.now();
const estourou = () => Date.now() - t0 > LIMITE_MS;
let parcial = false;
let seguidas = 0;

// Fotos escolhidas por nós: valem no lugar da imagem da parceira. Primeira regra que casar vence.
// O texto comparado é "nome país", sem acentos e em minúsculas.
const FOTOS = [
  [/meia.*berlim|berlin.*half/, "img/corridas/fixas/berlim-meia.webp"],
  [/berlin|berlim/, "img/corridas/fixas/berlim.webp"],
  [/new york|nova york|\bnyc\b/, "img/corridas/fixas/nova-york.webp"],
  [/maratona de sao paulo/, "img/corridas/fixas/sao-paulo.webp"],
  [/belgrad/, "img/corridas/fixas/belgrado.webp"],
  [/\bcali\b/, "img/corridas/fixas/cali.webp"],
  [/mendoza/, "img/corridas/fixas/mendoza.webp"],
  [/santiago/, "img/corridas/fixas/santiago.webp"],
];

const FONTES = {
  sub4: { nome: "Sub4 Turismo Esportivo", site: "https://www.sub4.com.br/" },
  travelrun: { nome: "TravelRun", site: "https://travelrun.com.br/" },
  travelmarathon: { nome: "Travel Marathon", site: "https://www.travelmarathon.com.br/corridas/" },
};

const MESES = { janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const limpa = (s) => String(s || "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const p2 = (n) => String(n).padStart(2, "0");
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// "01/11/2026", "04 de Abril 2027", "1 de novembro de 2026" -> "2026-11-01"
function paraData(txt) {
  const t = semAcento(txt);
  let m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t);
  if (m) return `${m[3]}-${p2(m[2])}-${p2(m[1])}`;
  m = /(\d{1,2})\s*(?:de)?\s*([a-z]+)\s*(?:de)?\s*(\d{4})/.exec(t);
  if (m && MESES[m[2]]) return `${m[3]}-${p2(MESES[m[2]])}-${p2(m[1])}`;
  return "";
}

// "42KM, 21KM, 10KM, 5KM" -> [5, 10, 21, 42]; usa o nome como reserva ("Maratona" = 42, "Meia" = 21)
function distancias(txt, nome) {
  const set = new Set();
  for (const m of semAcento(txt).matchAll(/(\d+(?:[.,]\d+)?)\s*k/g)) {
    const v = Number(m[1].replace(",", "."));
    if (v > 0 && v < 400) set.add(v);
  }
  if (!set.size) {
    const n = semAcento(nome);
    if (/meia/.test(n)) set.add(21);
    else if (/maratona|marathon/.test(n)) set.add(42);
  }
  return [...set].sort((a, b) => a - b);
}

// "TCS NEW YORK CITY MARATHON 2026-" -> "TCS New York City Marathon 2026"
function bonito(nome) {
  let n = limpa(nome).replace(/\s*[-–]+\s*$/, "");
  if (n === n.toUpperCase()) {
    n = n.toLowerCase().replace(/(^|[\s(\-/])([a-zà-ú])/g, (m, a, b) => a + b.toUpperCase())
      .replace(/\b(Tcs|Bmw|Wrrc|Wmm|Nyc|Ny|Uk|Usa|Abbott)\b/g, (x) => x.toUpperCase()).replace(/\bDe\b/g, "de").replace(/\bDo\b/g, "do").replace(/\bDa\b/g, "da");
  }
  return n;
}
const PAISES = { japan: "Japão", germany: "Alemanha", "united states": "Estados Unidos", usa: "Estados Unidos", england: "Inglaterra", "south africa": "África do Sul", spain: "Espanha", france: "França", greece: "Grécia", denmark: "Dinamarca", "czech republic": "República Tcheca", italy: "Itália", australia: "Austrália", brazil: "Brasil", portugal: "Portugal", china: "China", argentina: "Argentina", chile: "Chile", peru: "Peru", colombia: "Colômbia", uruguay: "Uruguai", serbia: "Sérvia" };
const pais = (p) => PAISES[semAcento(p)] || limpa(p);
// Cidade do nome -> país (o Travel Marathon não informa o país na página da corrida)
const CIDADES = [[/nova york|new york|chicago|boston|disney|orlando|las vegas|miami/, "Estados Unidos"], [/atenas|athens/, "Grécia"], [/shanghai|xangai/, "China"], [/valencia/, "Espanha"], [/copenhag/, "Dinamarca"], [/lisboa|porto/, "Portugal"], [/paris/, "França"], [/praga|prague/, "República Tcheca"], [/berlim|berlin/, "Alemanha"], [/londres|london|cardiff/, "Reino Unido"], [/cape town|cidade do cabo/, "África do Sul"], [/sydney|sidney/, "Austrália"], [/toquio|tokyo/, "Japão"], [/roma|rome|florenca/, "Itália"], [/buenos aires|mendoza/, "Argentina"], [/santiago/, "Chile"], [/lima/, "Peru"], [/montevid/, "Uruguai"], [/rio de janeiro|sao paulo|brasilia/, "Brasil"]];
const paisDoNome = (nome) => { const n = semAcento(nome); const c = CIDADES.find(([re]) => re.test(n)); return c ? c[1] : ""; };
// Resumo curto: tira lixo de menu e corta numa frase inteira
// A marca das parceiras não aparece no site: frases que falam delas saem do resumo, e o nome some das listas.
const MARCA_PARCEIRA = /travel\s?run|travel\s?marathon|sub4|operadora oficial/i;
const semMarca = (x) => limpa(String(x).replace(/\b(travel\s?run|travel\s?marathon|sub4(\.run)?)\b/gi, " ").replace(/\s+([,.;:)])/g, "$1"));
function resumo(txt, max = 300) {
  let s = limpa(txt).replace(/\b(DETALHES|O QUE ESTA INCLUSO|HOTEIS|VIDEOS|INSCRICAO)\b/g, " ");
  s = limpa(s).replace(/^Descri[cç][aã]o\s*/i, "");
  s = limpa(s.split(/(?<=[.!?])\s+/).filter((frase) => !MARCA_PARCEIRA.test(frase)).join(" "));
  if (s.length <= max) return s;
  const corte = s.slice(0, max);
  const p = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("! "), corte.lastIndexOf("? "));
  return (p > 120 ? corte.slice(0, p + 1) : corte.replace(/\s+\S*$/, "") + "…");
}

// Lista de linhas curtas e úteis (sem links, sem endereços, sem repetição)
function linhas(txt, max = 12) {
  const vistos = new Set();
  return String(txt || "").split("\n").map((x) => semMarca(limpa(x).replace(/^[·•*–-]+\s*/, "")))
    .filter((x) => x && x.length >= 3 && x.length <= 170 && !/^-+$/.test(x) && !/^(INSCRICAO|VIDEOS|HOTEIS|DETALHES|DESCRICAO|O QUE ESTA INCLUSO)$/i.test(x) && !/^https?:/i.test(x) && !/\d{3,}.*,.*,/.test(x))
    .filter((x) => { const k = semAcento(x); if (vistos.has(k)) return false; vistos.add(k); return true; })
    .slice(0, max);
}

function dinheiro(v) {
  const m = /([\d.]+,\d{2}|\d{1,3}(?:\.\d{3})+|\d+)/.exec(String(v || ""));
  if (!m) return null;
  return Number(m[1].replace(/\./g, "").replace(",", "."));
}

async function carregar(page, url, esperaSeletor) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40_000 });
  if (esperaSeletor) await page.waitForSelector(esperaSeletor, { timeout: 15_000 }).catch(() => {});
  else await page.waitForLoadState("load", { timeout: 8_000 }).catch(() => {});
  await dormir(PAUSA);
}

const linksDe = (page, filtro) =>
  page.evaluate((f) => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.href.split("#")[0]).filter((h) => new RegExp(f).test(h)))], filtro);

// ---------------------------------------------------------------- Sub4 (Vue: só aparece depois do JavaScript)
async function lerSub4(page) {
  const base = "https://www.sub4.com.br";
  const achados = new Map(); // url -> categoria
  const categorias = [[50, "Nacionais"], [51, "Internacionais"], [52, "Mega Finisher"], [53, "Super Halfs"], [54, "Majors"], [55, "Brasil Gigante"], [56, "Yescom"]];
  for (const [id, nome] of categorias) {
    await carregar(page, `${base}/Produtos/${id}/${nome.replace(/ /g, "-")}`, 'a[href*="produtodetalhe"]');
    for (const l of await linksDe(page, "/produtodetalhe/\\d+")) if (!achados.has(l)) achados.set(l, nome);
  }
  await carregar(page, base + "/", 'a[href*="produtodetalhe"]');
  for (const l of await linksDe(page, "/produtodetalhe/\\d+")) if (!achados.has(l)) achados.set(l, "");

  const saida = [];
  for (const [url, categoria] of achados) {
    if (estourou()) { parcial = true; console.warn("Sub4: tempo esgotado, leitura parcial"); break; }
    try {
      await carregar(page, url, "text=/DATA:/");
      const d = await page.evaluate(() => {
        const t = document.body.innerText;
        const pega = (re) => (re.exec(t) || [])[1] || "";
        const imgs = [...document.images].map((i) => i.currentSrc || i.src).filter((s) => s && !/\/images\/(logo|__|MENU|LUPA|bandeira|atendimento)|favicon|\.svg/i.test(s));
        const topo = t.split(/DESCRICAO/i)[0] || t;
        return {
          titulo: document.title.replace(/\s*-\s*Sub4.*$/i, "").trim(),
          data: pega(/DATA:\s*([^\n]+)/i), tipo: pega(/TIPO:\s*([^\n]+)/i), dist: pega(/DISTANCIA:\s*([^\n]+)/i), pais: pega(/PAIS:\s*([^\n]+)/i),
          preco: pega(/a partir de\s*R\$\s*([\d.]+,\d{2})/i), esgotado: /ESGOTADO/i.test(topo),
          descricao: (/\nDescricao\s*\n+([\s\S]*?)(?:\n-\n|\n\(\d{2}\)|$)/.exec(t) || [])[1] || "",
          imagem: imgs.find((s) => /upload|produto|foto|banner|evento/i.test(s)) || "",
        };
      });
      if (!d.titulo || !d.data) continue;
      const lerAba = async (re) => {
        try {
          await page.locator("a", { hasText: re }).first().click({ timeout: 4000 });
          await dormir(500);
          return await page.evaluate(() => { const m = /\nVIDEOS\s*\n([\s\S]*?)(?:\n-\n\s*\(\d{2}\)|\ncontato@|$)/i.exec(document.body.innerText); return m ? m[1] : ""; });
        } catch { return ""; }
      };
      const inclui = LER_INCLUSO ? linhas(await lerAba(/inclu/i)) : [];
      const hoteis = LER_INCLUSO ? linhas(await lerAba(/hotei/i), 6) : [];
      const id = (/produtodetalhe\/(\d+)/.exec(url) || [])[1];
      saida.push({
        id: "sub4-" + id, fonte: "sub4", nome: bonito(d.titulo), data: paraData(d.data), dataTexto: limpa(d.data),
        pais: limpa(d.pais), local: "", distancias: distancias(d.dist, d.titulo), tipo: limpa(d.tipo) || "Corrida de rua", categoria,
        preco: d.preco ? { moeda: "R$", valor: dinheiro(d.preco), rotulo: "a partir de", obs: "" } : null,
        esgotado: d.esgotado, descricao: resumo(d.descricao), inclui, hoteis, naoInclui: [], link: url, imagemOrigem: d.imagem,
      });
      seguidas = 0;
    } catch (e) { console.warn("Sub4: falha em", url, e.message); if (++seguidas >= 4) { parcial = true; console.warn("Sub4: 4 falhas seguidas, leitura interrompida"); break; } }
  }
  return saida;
}

// ---------------------------------------------------------------- TravelRun (PrestaShop: tudo no HTML)
async function lerTravelRun(page) {
  const base = "https://travelrun.com.br";
  const achados = new Set();
  const regProduto = "travelrun\\.com\\.br/[^/]+/\\d+-[^/]+\\.html$";
  await carregar(page, base + "/");
  for (const l of await linksDe(page, regProduto)) achados.add(l);
  // páginas de categoria do menu (Nacionais, Internacionais, distâncias, calendário...)
  const cats = await page.evaluate(() => [...document.querySelectorAll("a[href]")]
    .filter((a) => /nacionais|internacionais|5k a 20k|21k a 42k|\+ de 42k|calend/i.test(a.textContent.trim()) && a.href.startsWith("https://travelrun.com.br"))
    .map((a) => a.href.split("#")[0]));
  for (const c of [...new Set(cats)].slice(0, 8)) {
    for (let pg = 1; pg <= 4; pg++) {
      const antes = achados.size;
      await carregar(page, pg === 1 ? c : c + (c.includes("?") ? "&" : "?") + "page=" + pg);
      for (const l of await linksDe(page, regProduto)) achados.add(l);
      if (achados.size === antes) break;
    }
  }

  const saida = [];
  for (const url of achados) {
    if (estourou()) { parcial = true; console.warn("TravelRun: tempo esgotado, leitura parcial"); break; }
    try {
      await carregar(page, url);
      const d = await page.evaluate(() => {
        const t = document.body.innerText.replace(/[ \t]+/g, " ");
        const meta = (p) => (document.querySelector(`meta[property="${p}"]`) || {}).content || "";
        const h1 = (document.querySelector("h1") || {}).innerText || document.title;
        const apos = (re) => (re.exec(t) || [])[1] || "";
        const local = (/\nLocal\s*\n([\s\S]*?)\nParticipantes/i.exec(t) || [])[1] || "";
        const plano = t.replace(/\s+/g, " ");
        const pv = /Valor a partir de\s*(R\$|US\$|\$|€|£)\s*([\d.]+,\d{2})\s*(.*?)\s*(?:Quero ir|Quer ir|$)/i.exec(plano);
        return {
          titulo: h1, data: apos(/Data do Evento\s*\n?\s*([\d/]+)/i), largada: apos(/Largada\s*\n?\s*([^\n]+)/i), dist: apos(/Dist[âa]ncia\s*\n?\s*([^\n]+)/i),
          local, moeda: pv ? pv[1] : "", valor: pv ? pv[2] : "", obs: pv ? pv[3] : "", consultar: /Valor a consultar/i.test(t),
          incluso: [...(document.getElementById("tab_included") ? document.getElementById("tab_included").querySelectorAll("h1,h2,h3,h4,h5,h6,li,p") : [])].map((e) => e.textContent).join("\n"),
          descricao: ((/Segundos\s*\n([\s\S]*?)\nData do Evento/i.exec(t) || [])[1] || meta("og:description")), imagem: meta("og:image"),
        };
      });
      if (!d.titulo || !d.data) { console.warn("TravelRun: sem título/data em", url, "|", limpa(d.titulo), "|", d.data); continue; }
      const id = (/\/(\d+)-/.exec(url) || [])[1];
      const esgotado = /esgotado/i.test(d.titulo) || /esgotado/i.test(url);
      const partes = limpa(d.local).split(/\s*-\s*/).map(limpa).filter(Boolean);
      saida.push({
        id: "travelrun-" + id, fonte: "travelrun", nome: bonito(limpa(d.titulo).replace(/\s*\(?esgotado\)?/i, "")), data: paraData(d.data), dataTexto: limpa(d.data) + (d.largada ? " às " + limpa(d.largada).replace(/\s*hs?$/i, "h") : ""),
        pais: partes.length > 1 ? pais(partes[partes.length - 1]) : "", local: partes[0] || "", distancias: distancias(d.dist, d.titulo), tipo: "Corrida de rua", categoria: /\/(-?de-42k|inicio)\//.test(url) ? "" : "",
        preco: d.valor ? { moeda: d.moeda === "$" ? "US$" : d.moeda, valor: dinheiro(d.valor), rotulo: "a partir de", obs: limpa(d.obs).split(/Monte seu|Quero ir|Quer ir|Descri[cç]/i)[0].trim().replace(/^p\//i, "por ").replace(/^P\/ Pessoa/i, "por pessoa") } : null,
        esgotado, descricao: resumo(d.descricao), inclui: LER_INCLUSO ? linhas(d.incluso) : [], hoteis: [], naoInclui: [], link: url, imagemOrigem: d.imagem,
      });
      seguidas = 0;
    } catch (e) { console.warn("TravelRun: falha em", url, e.message); if (++seguidas >= 4) { parcial = true; console.warn("TravelRun: 4 falhas seguidas, leitura interrompida"); break; } }
  }
  return saida;
}

// ---------------------------------------------------------------- Travel Marathon (WordPress; sem preço público por corrida)
async function lerTravelMarathon(page) {
  const base = "https://www.travelmarathon.com.br/corridas/";
  await carregar(page, base);
  const lista = await page.evaluate(() => {
    const vistos = new Map();
    for (const a of document.querySelectorAll('a[href*="/corridas/"]')) {
      const href = a.href.split("#")[0].split("?")[0];
      if (!/\/corridas\/[^/]+\/$/.test(href) || /\/corridas\/(page|categoria|tag)\//.test(href)) continue;
      const card = a.closest("article, li, .elementor-post, div[class*=card], div[class*=item]") || a.parentElement;
      const txt = (card ? card.innerText : a.innerText).replace(/\s+/g, " ");
      if (!vistos.has(href) || txt.length > vistos.get(href).length) vistos.set(href, txt);
    }
    return [...vistos].map(([href, txt]) => ({ href, txt }));
  });
  const saida = [];
  for (const { href, txt } of lista) {
    if (estourou()) { parcial = true; console.warn("Travel Marathon: tempo esgotado, leitura parcial"); break; }
    try {
      await carregar(page, href);
      const d = await page.evaluate(() => {
        const t = document.body.innerText.replace(/[ \t]+/g, " ");
        const meta = (p, a = "property") => (document.querySelector(`meta[${a}="${p}"]`) || {}).content || "";
        const apos = (re) => (re.exec(t) || [])[1] || "";
        return {
          titulo: (meta("og:title") || document.title || (document.querySelector("h1") || {}).innerText || "").replace(/\s*\|.*$/, "").replace(/\s*-\s*Travelmarathon.*$/i, ""),
          data: apos(/Fecha del evento\s*\n?\s*([^\n]+)/i), local: apos(/Localizaci[óo]n del Evento\s*\n?\s*([^\n]+)/i),
          descricao: meta("description", "name") || meta("og:description"), imagem: meta("og:image"),
          inc: (/OS PRE[ÇC]OS INCLUEM\s*([\s\S]*?)OS PRE[ÇC]OS N[ÃA]O INCLUEM/i.exec(document.body.textContent) || [])[1] || "",
          nao: (/OS PRE[ÇC]OS N[ÃA]O INCLUEM\s*\n([\s\S]*?Qualquer item n[ãa]o mencionado como incluso\.?)/i.exec(document.body.textContent) || [])[1] || "",
        };
      });
      const dataIso = paraData(d.data) || paraData(txt);
      if (!d.titulo || !dataIso) continue;
      saida.push({
        id: "travelmarathon-" + href.split("/").filter(Boolean).pop(), fonte: "travelmarathon", nome: bonito(limpa(d.titulo).replace(/&#8211;/g, "–")), data: dataIso,
        dataTexto: limpa(d.data) || dataIso.split("-").reverse().join("/"), pais: paisDoNome(d.titulo), local: limpa(d.local), distancias: distancias(txt, d.titulo),
        tipo: /marathon majors|wmm/i.test(txt) ? "World Marathon Majors" : "Corrida de rua", categoria: /superhalfs/i.test(txt) ? "SuperHalfs" : "",
        preco: null, esgotado: /esgotad/i.test(txt), descricao: resumo(d.descricao), inclui: LER_INCLUSO ? linhas(d.inc) : [], hoteis: [], naoInclui: LER_INCLUSO ? linhas(d.nao, 10) : [], link: href, imagemOrigem: d.imagem,
      });
      seguidas = 0;
    } catch (e) { console.warn("Travel Marathon: falha em", href, e.message); if (++seguidas >= 4) { parcial = true; console.warn("Travel Marathon: 4 falhas seguidas, leitura interrompida"); break; } }
  }
  return saida;
}

// ---------------------------------------------------------------- imagens
async function existe(arquivo) { try { await access(arquivo); return true; } catch { return false; } }

// Baixa a imagem de cada corrida (uma vez), reduz para 720 px e salva em WebP. Imagens repetidas em várias corridas
// (logo ou imagem padrão da parceira) são ignoradas: nesses casos o site desenha uma ilustração.
async function prepararImagens(context, corridas) {
  const uso = new Map();
  corridas.forEach((c) => c.imagemOrigem && uso.set(c.imagemOrigem, (uso.get(c.imagemOrigem) || 0) + 1));
  await mkdir(path.join(PASTA, "img", "corridas"), { recursive: true });
  let novas = 0, falhas = 0;
  for (const c of corridas) {
    const url = c.imagemOrigem; delete c.imagemOrigem;
    c.imagem = "";
    if (!url || uso.get(url) > 1 || /placeholder|logo|decoracion|sem-imagem/i.test(url)) continue;
    const rel = "img/corridas/" + crypto.createHash("sha1").update(url).digest("hex").slice(0, 16) + ".webp";
    try {
      if (!(await existe(path.join(PASTA, rel)))) {
        const resp = await context.request.get(url, { timeout: 30_000, headers: { "user-agent": UA } });
        if (!resp.ok()) throw new Error("HTTP " + resp.status());
        await sharp(await resp.body()).rotate().resize({ width: 720, withoutEnlargement: true }).webp({ quality: 72 }).toFile(path.join(PASTA, rel));
        novas++;
      }
      c.imagem = rel;
    } catch (e) { falhas++; console.warn("Imagem não preparada:", url, e.message); }
  }
  console.log(`Imagens: ${novas} novas, ${falhas} com falha`);
}

async function lerAnterior() {
  try { return JSON.parse(await readFile(ARQUIVO, "utf8")); } catch { return null; }
}

async function main() {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ locale: "pt-BR", timezoneId: "America/Sao_Paulo", userAgent: UA });
    // Imagens, fontes e vídeos das páginas não são necessários para ler o texto: bloquear deixa a leitura bem mais rápida.
    await context.route("**/*", (rota) => (["image", "font", "media"].includes(rota.request().resourceType()) ? rota.abort() : rota.continue()));
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    const anterior = await lerAnterior();
    const hoje = new Date().toISOString().slice(0, 10);
    const leitores = { sub4: lerSub4, travelrun: lerTravelRun, travelmarathon: lerTravelMarathon };
    let todas = [];
    const resumo = {};
    const so = (process.env.SO || "").split(",").filter(Boolean);
    for (const [chave, leitor] of Object.entries(leitores)) {
      if (so.length && !so.includes(chave)) {
        const mantidas = anterior ? anterior.corridas.filter((c) => c.fonte === chave && c.data >= hoje) : [];
        todas = todas.concat(mantidas); resumo[chave] = { lidas: mantidas.length, mantidas: true };
        continue;
      }
      let lidas = [];
      parcial = false; seguidas = 0;
      try { lidas = await leitor(page); } catch (e) { console.warn(chave + ": erro geral:", e.message); }
      lidas = lidas.filter((c) => c.data && c.data >= hoje);
      const antigas = anterior ? anterior.corridas.filter((c) => c.fonte === chave) : [];
      // Trava: leitura vazia ou muito menor que a anterior mantém a base boa dessa fonte.
      if (!lidas.length || (!parcial && antigas.length >= 4 && lidas.length < antigas.length * 0.5)) {
        console.warn(`${chave}: leitura suspeita (${lidas.length} agora, ${antigas.length} antes). Mantidas as anteriores.`);
        lidas = antigas.filter((c) => c.data >= hoje);
        resumo[chave] = { lidas: lidas.length, mantidas: true };
      } else {
        await prepararImagens(context, lidas);
        // Leitura parcial (acabou o tempo ou a fonte falhou): o que não foi relido hoje continua com os dados de antes.
        if (parcial) {
          const ids = new Set(lidas.map((c) => c.id));
          const faltou = antigas.filter((c) => !ids.has(c.id) && c.data >= hoje);
          lidas = lidas.concat(faltou);
          console.warn(`${chave}: leitura parcial, ${faltou.length} corridas mantidas de antes`);
        }
        resumo[chave] = { lidas: lidas.length, mantidas: false, parcial };
      }
      todas = todas.concat(lidas);
    }
    if (!todas.length) throw new Error("Nenhuma corrida lida. Base anterior mantida.");
    for (const c of todas) {
      const alvo = semAcento(c.nome + " " + (c.pais || ""));
      const f = FOTOS.find(([re]) => re.test(alvo));
      if (f) c.imagem = f[1];
      if (!LER_INCLUSO) { c.inclui = []; c.hoteis = []; c.naoInclui = []; }
    }
    todas.sort((a, b) => a.data.localeCompare(b.data) || a.nome.localeCompare(b.nome));
    const saida = { geradoEm: new Date().toISOString(), fontes: FONTES, resumo, total: todas.length, corridas: todas };
    await mkdir(PASTA, { recursive: true });
    await writeFile(ARQUIVO + ".tmp", JSON.stringify(saida));
    await writeFile(ARQUIVO, await readFile(ARQUIVO + ".tmp"));
    console.log("Gravado:", ARQUIVO, resumo);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
