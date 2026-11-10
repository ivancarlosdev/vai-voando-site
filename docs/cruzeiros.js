const porId = (id) => document.getElementById(id);
const form = porId("cruzeiro-filtros");
const campos = form.elements;
const lista = porId("cruzeiro-lista");
const status = porId("cruzeiro-status");
const ordem = porId("cruzeiro-ordem");
const brasil = porId("cruzeiro-brasil");
const mais = porId("cruzeiro-mais");
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const data = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", dateStyle: "short" });
const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
const formatar = (dia) => data.format(new Date(dia + "T00:00:00Z"));
let ofertas = [];
let limite = 12;
let carregado = false;

function el(tag, texto, classe) {
  const no = document.createElement(tag);
  if (classe) no.className = classe;
  no.textContent = texto;
  return no;
}

function cartao(o) {
  const foto = el("div", "", "foto cruzeiro-foto");
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
  foto.append(el("span", o.destino, "selo"));
  const corpo = el("div", "", "cartao-corpo");
  corpo.append(el("h3", o.titulo), el("p", [o.cia, o.navio, o.noites + (o.noites === 1 ? " noite" : " noites")].filter(Boolean).join(" · "), "sub"),
    el("p", "Embarque: " + o.porto + " · " + formatar(o.ida), "saida"));
  if (o.escalas.length > 1) corpo.append(el("p", "Roteiro: " + o.escalas.join(" → "), "cruzeiro-portos"));
  const preco = el("div", "", "preco");
  preco.append(el("span", "Valor de referência por pessoa", "rot"), el("strong", moeda.format(o.preco), "val"),
    el("span", "Confirme cabine, taxas e disponibilidade.", "taxa"));
  const link = el("a", "Pedir cotação deste cruzeiro", "btn-zap");
  link.target = "_blank";
  link.rel = "noopener";
  link.href = window.waLink("Olá! Quero uma cotação atualizada do cruzeiro " + o.titulo + " (" + o.cia +
    "), com embarque em " + o.porto + " em " + formatar(o.ida) + ". Podem confirmar cabines, taxas e valor final?");
  corpo.append(preco, link);
  const artigo = el("article", "", "cartao cruzeiro-card");
  artigo.append(foto, corpo);
  return artigo;
}

function corresponde(o) {
  const duracao = o.noites <= 4 ? "curta" : o.noites <= 7 ? "media" : "longa";
  return (!campos.porto.value || o.porto === campos.porto.value) &&
    (!campos.destino.value || o.destino === campos.destino.value) &&
    (!campos.cia.value || o.cia === campos.cia.value) &&
    (!campos.noites.value || duracao === campos.noites.value) &&
    (!campos.inicio.value || o.ida >= campos.inicio.value) &&
    (!campos.fim.value || o.ida <= campos.fim.value) &&
    (brasil.getAttribute("aria-pressed") !== "true" || o.brasil);
}

function render() {
  if (!carregado) return;
  const invertido = campos.inicio.value && campos.fim.value && campos.inicio.value > campos.fim.value;
  const visiveis = invertido ? [] : ofertas.filter(corresponde);
  visiveis.sort((a, b) => {
    if (ordem.value === "data") return a.ida.localeCompare(b.ida) || a.preco - b.preco;
    if (ordem.value === "preco") return a.preco - b.preco || a.ida.localeCompare(b.ida);
    return Number(b.brasil) - Number(a.brasil) || a.preco - b.preco;
  });
  lista.replaceChildren(...visiveis.slice(0, limite).map(cartao));
  mais.hidden = visiveis.length <= limite;
  status.textContent = invertido ? "A data final precisa ser igual ou posterior à inicial." :
    visiveis.length ? visiveis.length.toLocaleString("pt-BR") + (visiveis.length === 1 ? " roteiro encontrado" : " roteiros encontrados") :
      "Nenhum cruzeiro para esses filtros. Tente outra data ou peça uma cotação.";
}

function filtrar() {
  limite = 12;
  render();
}

form.addEventListener("submit", (evento) => evento.preventDefault());
form.addEventListener("input", filtrar);
form.addEventListener("reset", () => {
  brasil.setAttribute("aria-pressed", "false");
  requestAnimationFrame(filtrar);
});
ordem.addEventListener("change", filtrar);
brasil.addEventListener("click", () => {
  brasil.setAttribute("aria-pressed", String(brasil.getAttribute("aria-pressed") !== "true"));
  campos.porto.value = "";
  filtrar();
});
mais.addEventListener("click", () => {
  const primeira = limite;
  limite += 12;
  render();
  lista.children[primeira]?.querySelector("a")?.focus();
});

async function carregar() {
  try {
    const resposta = await fetch("cruzeiros.json.gz", { signal: AbortSignal.timeout(10000) });
    if (!resposta.ok || !resposta.body) throw new Error("Catálogo indisponível");
    const catalogo = await new Response(resposta.body.pipeThrough(new DecompressionStream("gzip"))).json();
    ofertas = catalogo.ofertas.filter((o) => o.ida >= hoje);
    for (const campo of ["porto", "destino", "cia"]) {
      const opcoes = [...new Set(ofertas.map((o) => o[campo]))].sort((a, b) => a.localeCompare(b, "pt-BR"));
      campos[campo].append(...opcoes.map((opcao) => new Option(opcao, opcao)));
    }
    porId("cruzeiro-data").textContent = "Tarifas de referência do catálogo de " + formatar(catalogo.data) +
      ". O preço e a disponibilidade atuais são confirmados na cotação.";
    carregado = true;
    render();
  } catch {
    status.textContent = "O catálogo está indisponível. Peça uma cotação pelo WhatsApp.";
  }
}
carregar();
