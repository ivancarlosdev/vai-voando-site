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
let destaque = null;

function el(tag, texto, classe) {
  const no = document.createElement(tag);
  if (classe) no.className = classe;
  no.textContent = texto;
  return no;
}

const cabines = ["Interna", "Externa", "Varanda", "Suíte"];
const logos = {
  CRZ: "corazul-marca.png", PROMOACAO: "promoacao.svg", COS: "costa.svg",
  NCL: "ncl.svg", DCL: "dcl-cores.png", R: "rccl.svg", C: "clb.svg", Z: "aza.svg",
  PCL: "pcl.svg", HAL: "hal.svg", CUN: "cun.svg", CLTY: "clty.svg", OCE: "oce.svg",
  AMA: "ama.svg", CRY: "cry.svg", REG: "reg.svg", SBN: "sbn.svg",
};
const fonte = "https://mediumvioletred-peafowl-260122.hostingersite.com/";
const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" });

function itinerario(saida) {
  const listaDias = el("ol", "", "cruzeiro-dias");
  for (const [dia, porto, chegada, partida] of saida.dias) {
    const dataDia = new Date(saida.ida + "T00:00:00Z");
    dataDia.setUTCDate(dataDia.getUTCDate() + dia - 1);
    const item = el("li", "");
    item.append(el("span", "Dia " + dia + " · " + data.format(dataDia)), el("strong", porto));
    const horas = [chegada && "Chegada " + chegada, partida && "Saída " + partida].filter(Boolean);
    if (horas.length) item.append(el("span", horas.join(" · ")));
    listaDias.append(item);
  }
  return listaDias;
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

function cartao(o) {
  const foto = fotoCruzeiro(o);
  const detalhes = el("details", "", "cruzeiro-itinerario");
  const comRoteiro = o.saidas.filter((s) => s.dias.length);
  const seletor = el("select", "");
  const dias = el("div", "");
  function mostrarRoteiro(saida) {
    seletor.value = saida.ida;
    dias.replaceChildren(itinerario(saida));
  }
  if (comRoteiro.length) {
    detalhes.append(el("summary", "Ver itinerário dia a dia"));
    const rotulo = el("label", "Saída");
    seletor.append(...comRoteiro.map((s) => new Option(formatar(s.ida), s.ida)));
    seletor.addEventListener("change", () => {
      const saida = comRoteiro.find((s) => s.ida === seletor.value);
      if (saida) mostrarRoteiro(saida);
    });
    rotulo.append(seletor);
    detalhes.append(rotulo, dias);
    mostrarRoteiro(comRoteiro[0]);
  }

  const corpo = el("div", "", "cruzeiro-resumo");
  corpo.append(el("span", o.destino, "cruzeiro-regiao"), el("h3", o.titulo),
    el("p", [o.noites + (o.noites === 1 ? " noite" : " noites"), o.cia, o.navio].filter(Boolean).join(" · ")),
    el("p", "Embarque em " + o.porto));
  if (o.escalas.length > 1) corpo.append(el("p", o.escalas.join(" → "), "cruzeiro-portos"));
  if (comRoteiro.length) corpo.append(detalhes);
  const menor = el("div", "", "cruzeiro-menor");
  menor.append(el("span", "A partir de"), el("strong", moeda.format(o.preco)), el("small", "Referência por pessoa"));

  const topo = el("div", "", "cruzeiro-card-topo");
  topo.append(foto, corpo, menor);

  const tabela = el("table", "", "cruzeiro-tarifas");
  const cabecalho = el("tr", "");
  for (const titulo of ["Saída", ...cabines]) {
    const th = el("th", titulo);
    th.scope = "col";
    cabecalho.append(th);
  }
  const thead = el("thead", "");
  thead.append(cabecalho);
  const tbody = el("tbody", "");
  const linhas = o.saidas.map((saida, i) => {
    const linha = el("tr", "");
    linha.hidden = i >= 3;
    const dataSaida = el("th", "");
    dataSaida.scope = "row";
    dataSaida.append(el("strong", formatar(saida.ida)),
      el("small", diaSemana.format(new Date(saida.ida + "T00:00:00Z"))));
    if (saida.dias.length) {
      const ver = el("button", "Ver itinerário", "cruzeiro-ver-dia");
      ver.type = "button";
      ver.addEventListener("click", () => {
        detalhes.open = true;
        mostrarRoteiro(saida);
        seletor.focus();
      });
      dataSaida.append(ver);
    }
    linha.append(dataSaida);
    saida.cabines.forEach((valor, indice) => {
      const celula = el("td", "");
      if (valor == null) {
        celula.append(el("span", "Sem tarifa", "cruzeiro-sem-tarifa"));
      } else {
        const link = el("a", moeda.format(valor), "cruzeiro-tarifa");
        if (valor === saida.preco) link.classList.add("menor");
        link.target = "_blank";
        link.rel = "noopener";
        link.setAttribute("aria-label", "Cotar cabine " + cabines[indice] + " em " + formatar(saida.ida) + " · " + moeda.format(valor));
        link.href = window.waLink("Olá! Quero cotar o cruzeiro " + o.titulo + " (" + o.cia +
          "), cabine " + cabines[indice] + ", com embarque em " + o.porto + " em " + formatar(saida.ida) +
          ". Vi o valor de referência de " + moeda.format(valor) + " por pessoa. Podem confirmar?");
        celula.append(link);
      }
      linha.append(celula);
    });
    tbody.append(linha);
    return linha;
  });
  tabela.append(thead, tbody);
  const rolagem = el("div", "", "cruzeiro-tabela");
  rolagem.tabIndex = 0;
  rolagem.setAttribute("role", "region");
  rolagem.setAttribute("aria-label", "Tarifas por cabine para " + o.titulo);
  rolagem.append(tabela);
  const artigo = el("article", "", "cruzeiro-card");
  artigo.tabIndex = -1;
  artigo.append(topo, rolagem);
  if (linhas.length > 3) {
    const expandir = el("button", "Ver mais saídas (" + linhas.length + " no total)", "btn-borda cruzeiro-mais-saidas");
    expandir.type = "button";
    expandir.setAttribute("aria-expanded", "false");
    expandir.addEventListener("click", () => {
      const aberto = expandir.getAttribute("aria-expanded") !== "true";
      linhas.slice(3).forEach((linha) => { linha.hidden = !aberto; });
      expandir.setAttribute("aria-expanded", String(aberto));
      expandir.textContent = aberto ? "Ver menos saídas" : "Ver mais saídas (" + linhas.length + " no total)";
    });
    artigo.append(expandir);
  }
  return artigo;
}

function montarCompanhias() {
  const faixa = porId("cruzeiro-companhias");
  const companhias = new Map(ofertas.map((o) => [o.codigo, o.cia]));
  const codigos = Object.keys(logos).filter((codigo) => companhias.has(codigo));
  const opcoes = [["", "Todas"], ...codigos.map((codigo) => [codigo, companhias.get(codigo)])];
  for (const [codigo, nome] of opcoes) {
    const botao = el("button", nome);
    botao.type = "button";
    botao.value = codigo ? nome : "";
    botao.setAttribute("aria-label", nome);
    if (codigo) {
      const logo = el("img", "");
      logo.alt = "";
      logo.addEventListener("load", () => botao.replaceChildren(logo), { once: true });
      logo.src = fonte + "logos/" + logos[codigo];
    }
    botao.addEventListener("click", () => {
      campos.cia.value = botao.value;
      filtrar();
      porId("cruzeiro-titulo").scrollIntoView({ block: "start" });
    });
    faixa.append(botao);
  }
  porId("cruzeiro-cias-anterior").addEventListener("click", () => faixa.scrollBy({ left: -300 }));
  porId("cruzeiro-cias-proximo").addEventListener("click", () => faixa.scrollBy({ left: 300 }));
  porId("cruzeiro-navegacao").hidden = false;
}

function montarDestaques() {
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
    const botao = el("button", "Ver esta saída →", "btn-ouro");
    botao.type = "button";
    botao.addEventListener("click", () => {
      form.reset();
      destaque = { id: oferta.id, ida: saida.ida };
      limite = 12;
      render();
      const card = lista.firstElementChild;
      card?.focus({ preventScroll: true });
      card?.scrollIntoView({ block: "start" });
    });
    corpo.append(el("h3", oferta.titulo),
      el("p", oferta.noites + (oferta.noites === 1 ? " noite" : " noites") + " · " + oferta.cia),
      el("p", formatar(saida.ida) + " · " + oferta.porto),
      el("strong", moeda.format(saida.preco)), el("small", "Referência por pessoa"), botao);
    card.append(foto, corpo);
    porId("cruzeiro-destaques").append(card);
  }
  porId("cruzeiro-oportunidades").hidden = !selecionados.length;
}

function corresponde(o) {
  const duracao = o.noites <= 4 ? "curta" : o.noites <= 7 ? "media" : "longa";
  return (!campos.porto.value || o.porto === campos.porto.value) &&
    (!campos.destino.value || o.destino === campos.destino.value) &&
    (!campos.cia.value || o.cia === campos.cia.value) &&
    (!campos.noites.value || duracao === campos.noites.value) &&
    (brasil.getAttribute("aria-pressed") !== "true" || o.brasil);
}

function render() {
  if (!carregado) return;
  const invertido = campos.inicio.value && campos.fim.value && campos.inicio.value > campos.fim.value;
  for (const botao of porId("cruzeiro-companhias").children) {
    botao.setAttribute("aria-pressed", String(botao.value === campos.cia.value));
  }
  const visiveis = invertido ? [] : ofertas.filter(corresponde).map((o) => {
    const saidas = o.saidas.filter((s) => (!campos.inicio.value || s.ida >= campos.inicio.value) &&
      (!campos.fim.value || s.ida <= campos.fim.value));
    if (o.id === destaque?.id) {
      const posicao = saidas.findIndex((s) => s.ida === destaque.ida);
      if (posicao > 0) saidas.unshift(...saidas.splice(posicao, 1));
    }
    return { ...o, saidas, ida: saidas[0]?.ida, preco: Math.min(...saidas.map((s) => s.preco)) };
  }).filter((o) => o.saidas.length);
  visiveis.sort((a, b) => {
    const primeiro = Number(b.id === destaque?.id) - Number(a.id === destaque?.id);
    if (primeiro) return primeiro;
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
  destaque = null;
  limite = 12;
  render();
}

form.addEventListener("submit", (evento) => evento.preventDefault());
form.addEventListener("input", filtrar);
form.addEventListener("reset", () => {
  brasil.setAttribute("aria-pressed", "false");
  destaque = null;
  limite = 12;
  requestAnimationFrame(() => { if (!destaque) render(); });
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

async function lerCatalogo(url) {
  const resposta = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!resposta.ok || !resposta.body) throw new Error("Catálogo indisponível");
  return new Response(resposta.body.pipeThrough(new DecompressionStream("gzip"))).json();
}

async function carregar() {
  try {
    const catalogo = await lerCatalogo("https://raw.githubusercontent.com/ivancarlosdev/vai-voando-site/main/docs/cruzeiros-v2.json.gz")
      .catch(() => lerCatalogo("cruzeiros-v2.json.gz"));
    ofertas = catalogo.ofertas.map((o, id) => ({
      ...o, id, saidas: o.saidas.filter((s) => s.ida >= hoje),
    })).filter((o) => o.saidas.length);
    for (const campo of ["porto", "destino", "cia"]) {
      const opcoes = [...new Set(ofertas.map((o) => o[campo]))].sort((a, b) => a.localeCompare(b, "pt-BR"));
      campos[campo].append(...opcoes.map((opcao) => new Option(opcao, opcao)));
    }
    porId("cruzeiro-data").textContent = "Tarifas de referência do catálogo de " + formatar(catalogo.data) +
      ". O preço e a disponibilidade atuais são confirmados na cotação.";
    montarCompanhias();
    montarDestaques();
    carregado = true;
    render();
  } catch {
    status.textContent = "O catálogo está indisponível. Peça uma cotação pelo WhatsApp.";
  }
}
carregar();
