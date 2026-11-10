const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const data = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", dateStyle: "short" });
const formatar = (dia) => data.format(new Date(dia + "T00:00:00Z"));

function el(tag, texto, classe) {
  const no = document.createElement(tag);
  if (classe) no.className = classe;
  no.textContent = texto;
  return no;
}

function fotoCruzeiro(o) {
  const foto = el("div", "", "cruzeiro-foto");
  if (o.url) {
    const img = el("img", "");
    img.src = o.url;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => img.remove(), { once: true });
    foto.append(img);
  }
  return foto;
}

async function lerCatalogo(url) {
  const resposta = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!resposta.ok || !resposta.body) throw new Error("Catálogo indisponível");
  return new Response(resposta.body.pipeThrough(new DecompressionStream("gzip"))).json();
}

export async function carregarCatalogo() {
  const catalogo = await lerCatalogo("https://raw.githubusercontent.com/ivancarlosdev/vai-voando-site/main/docs/cruzeiros-v2.json.gz")
    .catch(() => lerCatalogo("cruzeiros-v2.json.gz"));
  const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const ofertas = catalogo.ofertas.map((o, id) => ({
    ...o, id, saidas: o.saidas.filter((s) => s.ida >= hoje),
  })).filter((o) => o.saidas.length);
  return { ...catalogo, ofertas };
}

export function chaveCruzeiro(o) {
  return JSON.stringify([o.codigo, o.titulo, o.navio, o.porto, o.noites]);
}

export function montarDestaques(ofertas, lista, criarAcao) {
  const embarques = ofertas.filter((o) => o.url).map((o) => ({
    oferta: o,
    saida: o.saidas.reduce((melhor, s) => s.preco < melhor.preco ? s : melhor),
  })).sort((a, b) => a.saida.preco - b.saida.preco);
  const selecionados = [];
  const navios = new Set();
  for (const nacional of [true, false, null]) {
    let total = 0;
    for (const item of embarques) {
      const o = item.oferta;
      const chave = o.navio || o.cia;
      if (selecionados.length >= 4 || (nacional != null && total >= 2)) break;
      if ((nacional != null && o.brasil !== nacional) || navios.has(chave)) continue;
      navios.add(chave);
      selecionados.push(item);
      total++;
    }
  }
  for (const { oferta, saida } of selecionados) {
    const card = el("article", "", "cruzeiro-destaque");
    const foto = fotoCruzeiro(oferta);
    foto.append(el("span", oferta.destino, "cruzeiro-destaque-regiao"));
    const corpo = el("div", "", "cruzeiro-destaque-corpo");
    const botao = criarAcao(oferta, saida);
    corpo.append(el("h3", oferta.titulo),
      el("p", oferta.noites + (oferta.noites === 1 ? " noite" : " noites") + " · " + oferta.cia),
      el("p", formatar(saida.ida) + " · " + oferta.porto),
      el("strong", moeda.format(saida.preco)), el("small", "Referência por pessoa"), botao);
    card.append(foto, corpo);
    lista.append(card);
  }
  return selecionados.length;
}

export { fotoCruzeiro };
