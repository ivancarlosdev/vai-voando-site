const porId = (id) => document.getElementById(id);
const formulario = porId("filtros");
const campos = formulario.elements;
const lista = porId("lista");
const status = porId("status-voo");
const ordem = porId("ordem");
const mais = porId("mais");
const consulta = porId("consulta");
const tamanhoPagina = 12;
const catalogoAtual = "https://raw.githubusercontent.com/ivancarlosdev/vai-voando-site/main/docs/promo-voo.json.gz";
const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });
const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
const dataCurta = (dia) => data.format(new Date(dia + "T00:00:00Z"));
const texto = (valor) => valor.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
const valorValido = (valor) => Number.isFinite(valor) && valor >= 0;

let voos = [];
let carregando = true;
let falha = false;
let limite = tamanhoPagina;

function diaValido(dia) {
  if (typeof dia !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dia)) return false;
  const instante = new Date(dia + "T00:00:00Z");
  return Number.isFinite(instante.getTime()) && instante.toISOString().slice(0, 10) === dia;
}

function prepararVoos(registros) {
  return registros.filter((voo) =>
    voo && ["origem", "destino", "companhia"].every((campo) =>
      typeof voo[campo] === "string" && voo[campo].trim()
    ) &&
    diaValido(voo.ida) && diaValido(voo.volta) &&
    voo.ida >= hoje && voo.volta >= voo.ida &&
    (!voo.emitirAte || (diaValido(voo.emitirAte) && voo.emitirAte >= hoje)) &&
    valorValido(voo.tarifa) && (voo.taxas == null || valorValido(voo.taxas)) &&
    !voo.esgotado && voo.lugares !== 0
  ).map((voo) => ({
    ...voo,
    total: voo.taxas == null ? null : Math.round((voo.tarifa + voo.taxas) * 100) / 100,
  }));
}

function filtros() {
  return {
    origem: campos.origem.value.trim(),
    destino: campos.destino.value.trim(),
    inicio: campos.inicio.value,
    fim: campos.fim.value,
    preco: campos.preco.valueAsNumber,
  };
}

function combina(voo, filtro) {
  return texto(voo.origem).includes(texto(filtro.origem)) &&
    texto(voo.destino).includes(texto(filtro.destino)) &&
    (!filtro.inicio || voo.ida >= filtro.inicio) &&
    (!filtro.fim || voo.ida <= filtro.fim) &&
    (!valorValido(filtro.preco) || (voo.total != null && voo.total <= filtro.preco));
}

function atualizarConsulta() {
  const filtro = filtros();
  const mensagem = ["Olá! Quero uma cotação de passagem aérea pelo Promo Voo."];
  if (filtro.origem) mensagem.push("Origem: " + filtro.origem);
  if (filtro.destino) mensagem.push("Destino: " + filtro.destino);
  if (filtro.inicio) mensagem.push("Saída a partir de: " + dataCurta(filtro.inicio));
  if (filtro.fim) mensagem.push("Saída até: " + dataCurta(filtro.fim));
  if (valorValido(filtro.preco)) mensagem.push("Orçamento por pessoa: até " + moeda.format(filtro.preco));
  consulta.href = window.waLink(mensagem.join("\n"));
}

function elemento(tag, conteudo, classe) {
  const node = document.createElement(tag);
  node.textContent = conteudo;
  if (classe) node.className = classe;
  return node;
}

const dataTrecho = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });
const numero = new Intl.NumberFormat("pt-BR");

function trechoVoo(rotulo, dia, origem, destino, partida, chegada) {
  const linha = elemento("p", "", "voo-trecho");
  const data = dataTrecho.format(new Date(dia + "T00:00:00Z"));
  linha.append(elemento("strong", rotulo + " · " + data),
    elemento("span", (partida ? partida + " " : "") + origem + " → " + (chegada ? chegada + " " : "") + destino));
  return linha;
}

function cartao(voo) {
  const trecho = voo.origem + " → " + voo.destino;
  const periodo = "Ida " + dataCurta(voo.ida) + " · Volta " + dataCurta(voo.volta);
  const tarifa = "Tarifa " + moeda.format(voo.tarifa) +
    (voo.taxas == null ? " · taxas a consultar" : " + " + moeda.format(voo.taxas) + " em taxas");
  const total = voo.total == null ? "Total a confirmar" : moeda.format(voo.total) + " por pessoa";
  const link = elemento("a", "Consultar pelo WhatsApp", "btn-zap");
  link.setAttribute("aria-label", "Consultar " + trecho + " pelo WhatsApp");
  link.target = "_blank";
  link.rel = "noopener";
  link.href = window.waLink([
    "Olá! Quero consultar este voo que vi no Promo Voo.",
    trecho + " · " + voo.companhia,
    periodo,
    tarifa,
    total,
    "Podem confirmar o preço e a disponibilidade?",
  ].join("\n"));

  const noites = Math.round((Date.parse(voo.volta) - Date.parse(voo.ida)) / 86400000);
  const origem = /\(([A-Z]{3})\)$/.exec(voo.origem)?.[1] ?? voo.origem;
  const destino = /\(([A-Z]{3})\)$/.exec(voo.destino)?.[1] ?? voo.destino;
  const [saidaIda, chegadaIda, saidaVolta, chegadaVolta] = voo.horarios ?? [];
  const resumo = elemento("div", "");
  resumo.append(elemento("h3", voo.destino.replace(/ \([A-Z]{3}\)$/, "")),
    elemento("p", "Saindo de " + voo.origem, "voo-meta"),
    elemento("p", voo.companhia + " · " + noites + (noites === 1 ? " noite" : " noites"), "voo-meta"));
  if (voo.lugares === 1) resumo.append(elemento("span", "Último lugar", "voo-lugares"));
  else if (voo.lugares > 1 && voo.lugares <= 4) {
    resumo.append(elemento("span", "Últimos " + voo.lugares + " lugares", "voo-lugares"));
  }

  const itinerario = elemento("div", "", "voo-trechos");
  itinerario.append(trechoVoo("Ida", voo.ida, origem, destino, saidaIda, chegadaIda),
    trechoVoo("Volta", voo.volta, destino, origem, saidaVolta, chegadaVolta));

  const preco = elemento("div", "", "voo-preco");
  preco.append(elemento("strong", moeda.format(voo.total ?? voo.tarifa)),
    elemento("p", voo.taxas == null ? "Tarifa por pessoa · taxas a consultar" : "Por pessoa, incluindo " + moeda.format(voo.taxas) + " em taxas", "voo-taxas"),
    link);

  const artigo = elemento("article", "", "voo-card");
  artigo.append(resumo, itinerario, preco);
  return artigo;
}

function renderizar() {
  atualizarConsulta();
  const filtro = filtros();
  const datasInvalidas = filtro.inicio && filtro.fim && filtro.inicio > filtro.fim;
  campos.fim.setCustomValidity(datasInvalidas ? "Escolha uma data final igual ou posterior à inicial." : "");
  const encontrados = datasInvalidas ? [] : voos.filter((voo) => combina(voo, filtro));
  encontrados.sort((a, b) => {
    const porData = a.ida.localeCompare(b.ida);
    const porPreco = (a.total ?? Infinity) - (b.total ?? Infinity);
    return ordem.value === "data" ? porData || porPreco : porPreco || porData;
  });
  lista.replaceChildren(...encontrados.slice(0, limite).map(cartao));
  mais.hidden = encontrados.length <= limite;

  if (datasInvalidas) status.textContent = "A data final deve ser igual ou posterior à inicial.";
  else if (carregando) status.textContent = "Carregando ofertas…";
  else if (falha) status.textContent = "O catálogo está indisponível no momento. Você pode pedir uma cotação pelo WhatsApp.";
  else if (!voos.length) status.textContent = "Ainda não há voos publicados. Você pode pedir uma cotação pelo WhatsApp.";
  else if (!encontrados.length) status.textContent = "Nenhum voo encontrado. Experimente outros filtros ou peça uma cotação.";
  else status.textContent = encontrados.length === 1 ? "1 voo encontrado" : numero.format(encontrados.length) + " voos encontrados";
}

function refazerBusca() {
  limite = tamanhoPagina;
  renderizar();
}

formulario.addEventListener("input", refazerBusca);
formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  refazerBusca();
});
formulario.addEventListener("reset", () => requestAnimationFrame(refazerBusca));
ordem.addEventListener("change", refazerBusca);
mais.addEventListener("click", () => {
  const primeiroNovo = limite;
  limite += tamanhoPagina;
  renderizar();
  lista.children[primeiroNovo]?.querySelector("a")?.focus();
});

async function lerCatalogo(url) {
  const resposta = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!resposta.ok || !resposta.body) throw new Error("Catálogo indisponível");
  const conteudo = resposta.body.pipeThrough(new DecompressionStream("gzip"));
  const catalogo = await new Response(conteudo).json();
  const dataFonte = catalogo.atualizadoEm;
  if (!diaValido(dataFonte) || dataFonte > hoje ||
      (Date.parse(hoje) - Date.parse(dataFonte)) / 86400000 > 3 ||
      !Array.isArray(catalogo.voos)) throw new Error("Catálogo vencido ou inválido");
  return catalogo;
}

async function carregarVoos() {
  try {
    const catalogo = await lerCatalogo(catalogoAtual).catch(() => lerCatalogo("promo-voo.json.gz"));
    voos = prepararVoos(catalogo.voos);
    for (const [campo, id] of [["origem", "origens"], ["destino", "destinos"]]) {
      const opcoes = [...new Set(voos.map((voo) => voo[campo]))].sort((a, b) => a.localeCompare(b, "pt-BR"));
      porId(id).replaceChildren(...opcoes.map((opcao) => new Option(opcao, opcao)));
    }
    const atualizado = catalogo.atualizadoEm;
    if (voos.length) {
      porId("atualizado").textContent = "Catálogo atualizado em " +
        dataCurta(atualizado) + " · Fonte: Cativa Operadora";
      porId("atualizado").hidden = false;
    }
  } catch {
    falha = true;
  } finally {
    carregando = false;
    renderizar();
  }
}

renderizar();
carregarVoos();
