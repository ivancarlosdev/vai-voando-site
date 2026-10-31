// Página inicial: abas, busca, carrosséis e resultados. Lê ofertas.json, atualizado todo dia pela rotina.
(function () {
  "use strict";
  var A = window.AGENCIA;
  var PAGINA = 24;
  var CATS = ["Nacional", "Internacional", "Evento"];

  var ICONES = {
    mala: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    pino: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    globo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    ingresso: '<path d="M3 9a2 2 0 0 0 0 6v3h18v-3a2 2 0 0 1 0-6V6H3z"/><path d="M14 6v12"/>',
    aviao: '<path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    cama: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.5"/>',
    navio: '<path d="M3 17l2 3h14l2-3z"/><path d="M5 17v-4h14v4M9 13V9h6v4M12 9V5"/>',
    onibus: '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16M7 21v-4M17 21v-4"/><circle cx="8" cy="14" r=".7"/><circle cx="16" cy="14" r=".7"/>',
    escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    passaporte: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/>',
    carro: '<path d="M5 16v-5l2-5h10l2 5v5M3 16h18M7 19v-3M17 19v-3"/><path d="M5 11h14"/>',
    seta: '<path d="m9 6 6 6-6 6"/>'
  };
  function svg(nome) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONES[nome] + "</svg>"; }

  var ABAS = [
    { id: "pacotes", rot: "Pacotes", ic: "mala", titulo: "Pacotes de viagem", cat: "" },
    { id: "nacional", rot: "Nacionais", ic: "pino", titulo: "Pacotes nacionais", cat: "Nacional" },
    { id: "internacional", rot: "Internacionais", ic: "globo", titulo: "Pacotes internacionais", cat: "Internacional" },
    { id: "evento", rot: "Eventos", ic: "ingresso", titulo: "Pacotes para eventos", cat: "Evento" },
    { id: "passagens", rot: "Passagens", ic: "aviao", servico: { t: "Passagens aéreas", d: "Conte a origem, o destino e as datas. Pesquisamos as melhores opções e respondemos pelo WhatsApp.", m: "Olá! Quero cotar passagens aéreas. Origem, destino e datas:" } },
    { id: "hospedagem", rot: "Hospedagens", ic: "cama", servico: { t: "Hospedagens", d: "Hotéis e pousadas para a sua viagem. Informe o destino, as datas e quantas pessoas vão.", m: "Olá! Quero cotar hospedagem. Destino, datas e número de pessoas:" } },
    { id: "cruzeiros", rot: "Cruzeiros", ic: "navio", servico: { t: "Cruzeiros", d: "Conte o roteiro que você imagina e o período. Enviamos as opções disponíveis.", m: "Olá! Quero cotar um cruzeiro. Período e roteiro desejado:" } },
    { id: "rodoviario", rot: "Rodoviário", ic: "onibus", servico: { t: "Passagens rodoviárias", d: "Informe a origem, o destino e a data da viagem de ônibus.", m: "Olá! Quero cotar passagem rodoviária. Origem, destino e data:" } },
    { id: "seguro", rot: "Seguro viagem", ic: "escudo", servico: { t: "Seguro viagem", d: "Conte o destino e o período da viagem e peça a cotação do seguro.", m: "Olá! Quero cotar seguro viagem. Destino e período:" } },
    { id: "visto", rot: "Visto", ic: "passaporte", servico: { t: "Assessoria em visto", d: "Diga para qual país você precisa do visto. Orientamos os próximos passos.", m: "Olá! Preciso de assessoria em visto. País de destino:", link: "visto.html", btn: "Preencher solicitação de visto" } },
    { id: "carro", rot: "Aluguel de carro", ic: "carro", servico: { t: "Aluguel de carro", d: "Informe a cidade, as datas de retirada e devolução e o tipo de carro.", m: "Olá! Quero cotar aluguel de carro. Cidade e datas:" } }
  ];

  var DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  function $(id) { return document.getElementById(id); }
  function p2(n) { return ("0" + n).slice(-2); }
  function iso(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmt(d) { return p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + "/" + d.getFullYear(); }
  function curto(d) { return p2(d.getDate()) + "/" + p2(d.getMonth() + 1); }
  function dia(d) { return DIAS[d.getDay()] + " " + p2(d.getDate()) + " " + MESES[d.getMonth()]; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
  function bonito(s) { s = String(s || "").trim(); return s && s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s; }
  function limpaNome(s) { return String(s || "").split(/\s{2,}/)[0].trim(); }
  function brl(n) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  var rows = [];
  var estado = { aba: "pacotes", cat: "", ordem: "preco", visiveis: PAGINA };
  var el = {
    o: $("f-origem"), d: $("f-destino"), dt: $("f-data"), lista: $("lista"), cont: $("contagem"), ord: $("ordem"),
    mais: $("mais"), vInicio: $("vista-inicio"), vBusca: $("vista-busca"), limpar: $("limpar")
  };
  el.dt.min = hoje.getFullYear() + "-" + p2(hoje.getMonth() + 1) + "-" + p2(hoje.getDate());

  // ---------- abas ----------
  var abasEl = $("abas");
  abasEl.innerHTML = ABAS.map(function (a) {
    return '<button class="aba" type="button" role="tab" id="aba-' + a.id + '" data-aba="' + a.id + '" aria-selected="' + (a.id === "pacotes") + '">' +
      '<span class="ic">' + svg(a.ic) + "</span>" + esc(a.rot) + "</button>";
  }).join("");
  abasEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-aba]"); if (!b) return;
    var a = ABAS.filter(function (x) { return x.id === b.getAttribute("data-aba"); })[0];
    estado.aba = a.id;
    abasEl.querySelectorAll(".aba").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
    if (a.servico) {
      $("busca").hidden = true; $("busca-rodape").hidden = true; $("painel-servico").hidden = false;
      $("busca-titulo").textContent = a.servico.t;
      $("serv-titulo").textContent = a.servico.t; $("serv-texto").textContent = a.servico.d;
      if (a.servico.link) {
        $("serv-zap").href = a.servico.link; $("serv-zap").removeAttribute("target"); $("serv-zap").removeAttribute("rel");
      } else {
        $("serv-zap").href = window.waLink(a.servico.m + " ");
        $("serv-zap").target = "_blank"; $("serv-zap").rel = "noopener";
      }
      $("serv-zap").textContent = a.servico.btn || "Pedir cotação pelo WhatsApp";
    } else {
      $("busca").hidden = false; $("busca-rodape").hidden = false; $("painel-servico").hidden = true;
      $("busca-titulo").textContent = a.titulo;
      estado.cat = a.cat; estado.visiveis = PAGINA; render();
      if (a.cat) $("pacotes").scrollIntoView({ block: "start" });
    }
  });

  // ---------- dados ----------
  function carregar(dados) {
    if (dados.exemplo) $("aviso-exemplo").hidden = false;
    if (dados.geradoEm) {
      var g = new Date(dados.geradoEm);
      $("atualizado-linha").textContent = "Ofertas atualizadas em " + fmt(g) + " às " + p2(g.getHours()) + ":" + p2(g.getMinutes()) + ".";
    }
    (dados.pacotes || []).forEach(function (p) {
      var inclui = p.inclui || [];
      (p.origens || []).forEach(function (o) {
        var ex = (o.saidas || []).map(function (s) { return { ini: iso(s[0]), fim: iso(s[1]), pr: !!s[2] }; })
          .filter(function (x) { return x.ini >= hoje; }).sort(function (a, b) { return a.ini - b.ini; });
        if (!ex.length) return;
        rows.push({ p: p, o: o, ex: ex, preco: o.valorParcela == null ? null : o.valorParcela, cat: p.categoria || "Nacional" });
      });
    });

    var origens = {};
    rows.forEach(function (r) { if (r.o.cidade) origens[r.o.cidade] = 1; });
    Object.keys(origens).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); }).forEach(function (c) { el.o.appendChild(opcao(c, c)); });

    var porCat = {};
    rows.forEach(function (r) { var k = norm(r.p.destino); if (k) (porCat[r.cat] = porCat[r.cat] || {})[k] = bonito(r.p.destino); });
    CATS.concat(Object.keys(porCat).filter(function (c) { return CATS.indexOf(c) < 0; })).forEach(function (cat) {
      if (!porCat[cat]) return;
      var g = document.createElement("optgroup"); g.label = cat === "Evento" ? "Eventos" : cat === "Nacional" ? "Nacionais" : cat === "Internacional" ? "Internacionais" : cat;
      Object.keys(porCat[cat]).sort(function (a, b) { return porCat[cat][a].localeCompare(porCat[cat][b], "pt-BR"); }).forEach(function (k) { g.appendChild(opcao(k, porCat[cat][k])); });
      el.d.appendChild(g);
    });

    destaque();
    render();
  }
  function opcao(v, t) { var o = document.createElement("option"); o.value = v; o.textContent = t; return o; }

  function destaque() {
    var melhor = null;
    rows.forEach(function (r) { if (r.preco != null && r.p.capa && (!melhor || r.preco < melhor.preco)) melhor = r; });
    if (!melhor) return;
    $("destaque-img").src = melhor.p.capa;
    $("destaque-txt").textContent = (melhor.o.parcela || "") + (melhor.o.parcela ? " · " : "") + bonito(melhor.p.nome.split(/ [-–(] /)[0]);
    $("destaque").hidden = false;
  }

  // ---------- filtros ----------
  function filtrosAtivos() { return !!(estado.cat || el.o.value || el.d.value || el.dt.value); }
  function filtrar() {
    var dt = el.dt.value ? iso(el.dt.value) : null, de = dt && dt > hoje ? dt : hoje, out = [];
    rows.forEach(function (r) {
      if (estado.cat && r.cat !== estado.cat) return;
      if (el.o.value && r.o.cidade !== el.o.value) return;
      if (el.d.value && norm(r.p.destino) !== el.d.value) return;
      var prox = null;
      for (var i = 0; i < r.ex.length; i++) { if (r.ex[i].ini >= de) { prox = r.ex[i]; break; } }
      if (prox) out.push({ r: r, prox: prox });
    });
    var porData = el.ord.value === "data";
    out.sort(function (a, b) {
      var pa = a.r.preco == null ? Infinity : a.r.preco, pb = b.r.preco == null ? Infinity : b.r.preco;
      return porData ? (a.prox.ini - b.prox.ini || pa - pb) : (pa - pb || a.prox.ini - b.prox.ini);
    });
    return { lista: out, filtrouData: !!dt };
  }

  // ---------- cartão ----------
  function tipo(inclui) {
    var t = (inclui || []).join(" ").toLowerCase(), a = /a[eé]re/.test(t), h = /hosped|noite|hotel/.test(t);
    return a && h ? "Aéreo + Hotel" : a ? "Aéreo" : h ? "Hotel" : "Pacote";
  }

  // Pacote sem foto: em vez de um fundo liso, desenhamos uma ilustração do tipo de destino (praia, serra, cidade, parque ou cruzeiro).
  function semAcento(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function tema(txt) {
    var t = semAcento(txt);
    if (/cruzeiro|msc |costa |navio/.test(t)) return "cruzeiro";
    if (/disney|orlando|parque|beto carrero|hopi hari|universal|wet|thermas|hot park|olimpia/.test(t)) return "parque";
    if (/gramado|canela|campos do jordao|serra|monte verde|bariloche|neve|ski|bento goncalves|urubici|visconde/.test(t)) return "serra";
    if (/praia|ilha|natal|maceio|fortaleza|recife|porto de galinhas|maragogi|salvador|porto seguro|cancun|caribe|punta|noronha|buzios|arraial|jericoacoara|aracaju|joao pessoa|florianopolis|camboriu|ubatuba|ilhabela|angra|paraty|ceara|bahia|litoral|resort|nordeste|pipa|camurupim|trancoso/.test(t)) return "praia";
    return "cidade";
  }
  function semente(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
  window.vvArte = function (txt, sem) {
    var th = tema(txt), R = semente(th + (sem || txt)), g = "", n, i, x, y, w, h;
    var cab = '<svg class="arte" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">';
    if (th === "praia") {
      var sx = 60 + R() * 200;
      g = '<defs><linearGradient id="vc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b5d86"/><stop offset=".55" stop-color="#f6a04d"/><stop offset="1" stop-color="#ffd27a"/></linearGradient></defs>' +
        '<rect width="320" height="200" fill="url(#vc)"/><circle cx="' + sx.toFixed(0) + '" cy="104" r="26" fill="#fff3c4"/>' +
        '<rect y="112" width="320" height="52" fill="#0aa0b8"/><path d="M0 128q20-8 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0V150H0z" fill="#0d8aa3" opacity=".7"/>' +
        '<path d="M0 164q60-14 130-6t190-8V200H0z" fill="#f4d79b"/>';
      var px = 40 + R() * 40;
      g += '<g fill="none" stroke="#0a3b2c" stroke-width="3" stroke-linecap="round"><path d="M' + px.toFixed(0) + ' 192Q' + (px + 6).toFixed(0) + ' 150 ' + (px + 18).toFixed(0) + ' 126"/></g>' +
        '<g fill="#14804a"><path d="M' + (px + 18).toFixed(0) + ' 126q-26-6-38 8q18-4 38-8zM' + (px + 18).toFixed(0) + ' 126q26-10 40 4q-20-2-40-4zM' + (px + 18).toFixed(0) + ' 126q-8-22-30-24q16 6 30 24zM' + (px + 18).toFixed(0) + ' 126q10-22 32-20q-18 4-32 20z"/></g>';
      for (i = 0; i < 3; i++) g += '<path d="M' + (140 + i * 34 + R() * 20).toFixed(0) + ' ' + (40 + R() * 24).toFixed(0) + 'q5-5 10 0q5-5 10 0" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>';
    } else if (th === "serra") {
      g = '<defs><linearGradient id="vc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1f4d"/><stop offset="1" stop-color="#5f7fb8"/></linearGradient></defs>' +
        '<rect width="320" height="200" fill="url(#vc)"/><circle cx="' + (230 + R() * 50).toFixed(0) + '" cy="40" r="14" fill="#fff6d6"/>';
      for (i = 0; i < 14; i++) g += '<circle cx="' + (R() * 320).toFixed(0) + '" cy="' + (R() * 80).toFixed(0) + '" r="1.1" fill="#fff" opacity=".8"/>';
      g += '<path d="M0 150L70 70l45 55 45-70 70 80 40-45 50 60v50H0z" fill="#2b4a86"/><path d="M70 70l-14 18 14-6 10 8zM160 55l-16 22 16-8 14 10z" fill="#e8f0ff"/>' +
        '<path d="M0 175q80-30 160-8t160-14V200H0z" fill="#e8f0ff"/>';
      for (i = 0; i < 9; i++) { x = 10 + i * 36 + R() * 14; h = 28 + R() * 22; g += '<path d="M' + x.toFixed(0) + ' 190l-9 0 9-' + h.toFixed(0) + ' 9 ' + h.toFixed(0) + 'z" fill="#0f5a43"/>'; }
    } else if (th === "parque") {
      g = '<defs><linearGradient id="vc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0f4d"/><stop offset="1" stop-color="#7a2a8f"/></linearGradient></defs><rect width="320" height="200" fill="url(#vc)"/>';
      var cores = ["#ffbd00", "#ff4d8d", "#5ee0ff", "#acce00"];
      for (n = 0; n < 3; n++) { x = 50 + R() * 220; y = 30 + R() * 50; var c = cores[Math.floor(R() * 4)]; g += '<g stroke="' + c + '" stroke-width="2" stroke-linecap="round">'; for (i = 0; i < 12; i++) { var a = i * Math.PI / 6; g += '<line x1="' + (x + Math.cos(a) * 6).toFixed(1) + '" y1="' + (y + Math.sin(a) * 6).toFixed(1) + '" x2="' + (x + Math.cos(a) * 17).toFixed(1) + '" y2="' + (y + Math.sin(a) * 17).toFixed(1) + '"/>'; } g += "</g>"; }
      g += '<g fill="#12093a"><rect x="120" y="120" width="80" height="80"/><rect x="108" y="100" width="24" height="100"/><rect x="188" y="100" width="24" height="100"/><path d="M108 100l12-30 12 30zM188 100l12-30 12 30zM140 120l20-44 20 44z"/></g>' +
        '<g fill="none" stroke="#12093a" stroke-width="3"><circle cx="262" cy="150" r="34"/><path d="M262 116v68M228 150h68M238 126l48 48M286 126l-48 48"/></g><rect y="188" width="320" height="12" fill="#12093a"/>';
    } else if (th === "cruzeiro") {
      g = '<defs><linearGradient id="vc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a5a"/><stop offset=".6" stop-color="#ffd7a0"/><stop offset="1" stop-color="#ffe9c0"/></linearGradient></defs><rect width="320" height="200" fill="url(#vc)"/>' +
        '<circle cx="' + (60 + R() * 200).toFixed(0) + '" cy="110" r="24" fill="#fff6d6"/><rect y="120" width="320" height="80" fill="#0a6fa0"/><path d="M0 140q20-8 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0V170H0z" fill="#07557d" opacity=".7"/>' +
        '<g fill="#fff"><path d="M60 132h200l-20 26H84z"/><rect x="92" y="108" width="136" height="24"/><rect x="112" y="90" width="96" height="18"/></g><g fill="#0b2a5b"><rect x="104" y="114" width="12" height="8"/><rect x="126" y="114" width="12" height="8"/><rect x="148" y="114" width="12" height="8"/><rect x="170" y="114" width="12" height="8"/><rect x="192" y="114" width="12" height="8"/><rect x="152" y="70" width="14" height="22"/></g><rect x="152" y="70" width="14" height="6" fill="#d40f57"/>';
    } else {
      g = '<defs><linearGradient id="vc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1f4d"/><stop offset="1" stop-color="#f08a5d"/></linearGradient></defs><rect width="320" height="200" fill="url(#vc)"/><circle cx="' + (40 + R() * 240).toFixed(0) + '" cy="46" r="14" fill="#fff6d6"/>';
      x = 0; while (x < 320) { w = 18 + R() * 26; h = 50 + R() * 90; g += '<rect x="' + x.toFixed(0) + '" y="' + (200 - h).toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="' + (R() > .5 ? "#14264f" : "#1c3468") + '"/>'; for (i = 0; i < 6; i++) if (R() > .45) g += '<rect x="' + (x + 3 + R() * (w - 9)).toFixed(0) + '" y="' + (200 - h + 8 + i * 14).toFixed(0) + '" width="4" height="5" fill="#ffd36a"/>'; x += w + 2; }
    }
    var uid = "vc" + (window.__vvArteN = (window.__vvArteN || 0) + 1);
    return (cab + g + "</svg>").replace(/id="vc"/g, "id=\"" + uid + "\"").replace(/url\(#vc\)/g,"url(#" + uid + ")");
  };
  function cartao(it, opts) {
    opts = opts || {};
    var r = it.r, p = r.p, o = r.o, prox = it.prox;
    var iataOk = /^[A-Za-z]{3}$/.test(o.iata || "");
    var origemTxt = o.cidade ? o.cidade + (iataOk ? " (" + o.iata.toUpperCase() + ")" : "") : "";
    var noites = Math.round((prox.fim - prox.ini) / 864e5);
    var selo = noites > 0 ? (noites + 1) + " Dias / " + noites + " Noites" : "";
    var etiqueta = r.cat === "Evento" || p.evento ? "Evento" : r.cat === "Internacional" ? "Internacional" : "";
    var foto = p.capa
      ? '<img src="' + esc(p.capa) + '" alt="" loading="lazy" decoding="async" width="720" height="450" data-t="' + esc(p.destino + " " + p.nome) + '" onerror="this.parentNode.classList.add(\'sem\');this.parentNode.insertAdjacentHTML(\'afterbegin\',window.vvArte(this.getAttribute(\'data-t\'),\'\'));this.remove()">'
      : window.vvArte(p.destino + " " + p.nome, p.slug);
    var inclui = o.inclui || p.inclui || [];
    var outras = r.ex.filter(function (x) { return x !== prox; });
    var chips = outras.slice(0, 5).map(function (x) { return "<em>" + curto(x.ini) + "</em>"; }).join("") + (outras.length > 5 ? "<em>+" + (outras.length - 5) + "</em>" : "");
    var outrasHtml = !opts.carrossel && outras.length ? '<div class="outras">Outras saídas:' + chips + "</div>" : "";
    var aviso = !opts.carrossel && opts.filtrouData && !prox.pr
      ? '<div class="aviso-data">Saída em <b>' + fmt(prox.ini) + "</b>. O valor mostrado vale para a data principal; confirmamos o valor desta saída pelo WhatsApp.</div>" : "";
    var m = /^(\d+)\s*x/i.exec(o.parcela || "");
    var preco = r.preco == null
      ? '<div class="consulte">Consulte o valor</div>'
      : '<div class="rot">Preço por pessoa</div><div class="val"><small>' + (m ? m[1] : "10") + "x de</small> R$ " + r.preco.toLocaleString("pt-BR") + "</div>" +
        (o.taxas ? '<div class="taxa">+ ' + esc(o.taxas) + " de taxas de embarque</div>" : '<div class="taxa">Taxas de embarque à parte</div>');
    var hoteis = (o.hoteis || []).slice().sort(function (a, b) { return (a.preco || 0) - (b.preco || 0); });
    var hotHtml = hoteis.length ? '<div class="hoteis">' + hoteis.map(function (h) {
      return '<div class="hotel"><b>' + esc(limpaNome(h.nome)) + "</b>" + (h.regime ? "<span>" + esc(h.regime) + "</span>" : "") +
        (h.promo ? '<span class="promo">' + esc(h.promo) + "</span>" : "") +
        "<span>" + (h.preco != null ? "R$ " + brl(h.preco) + " por pessoa" : "") + (h.parcela ? " · " + esc(h.parcela) : "") + "</span></div>";
    }).join("") + "</div>" : "";
    var det = inclui.length || hotHtml
      ? "<details><summary>Hotéis e o que está incluso</summary>" + hotHtml + (inclui.length ? '<ul class="inclui">' + inclui.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "") + "</details>" : "";
    var msg = 'Olá! Vi no site e quero saber mais sobre o pacote "' + p.nome + '"' + (origemTxt ? " saindo de " + origemTxt : "") + ", com saída em " + fmt(prox.ini) +
      (r.preco != null ? ". Valor visto no site: " + (o.parcela || "") + " por pessoa + taxas." : ".");
    var mais = opts.carrossel && opts.cidades > 1 ? ' <span class="mais-cidades">+' + (opts.cidades - 1) + " cidades de saída</span>" : "";
    return '<article class="cartao"><div class="foto' + (p.capa ? "" : " sem") + '">' + foto + '<span class="sem-foto">' + esc(bonito(p.destino)) + "</span>" +
      (etiqueta ? '<span class="etiqueta">' + etiqueta + "</span>" : "") + (selo ? '<span class="selo">' + selo + "</span>" : "") + "</div>" +
      '<div class="cartao-corpo"><h3>' + esc(p.nome) + "</h3>" +
      '<div class="sub"><b>' + tipo(inclui) + "</b><span>|</span><span>" + dia(prox.ini) + " – " + dia(prox.fim) + "</span></div>" +
      '<div class="saida">' + svg("aviao") + "<span>" + (origemTxt ? "Saindo de " + esc(origemTxt) : "Saída e roteiro sob consulta") + mais + "</span></div>" +
      aviso + outrasHtml + det + '<div class="preco">' + preco + "</div>" +
      '<a class="btn-zap" target="_blank" rel="noopener" href="' + window.waLink(msg) + '">Quero este pacote</a></div></article>';
  }

  // ---------- carrosséis ----------
  function melhoresPorPacote(lista, limite) {
    var porPacote = {};
    lista.forEach(function (it) {
      var k = it.r.p.slug || it.r.p.nome, atual = porPacote[k];
      if (!atual) porPacote[k] = { it: it, n: 1 };
      else { atual.n++; if ((it.r.preco == null ? Infinity : it.r.preco) < (atual.it.r.preco == null ? Infinity : atual.it.r.preco)) atual.it = it; }
    });
    return Object.keys(porPacote).map(function (k) { return porPacote[k]; })
      .sort(function (a, b) { return (a.it.r.preco == null ? Infinity : a.it.r.preco) - (b.it.r.preco == null ? Infinity : b.it.r.preco); }).slice(0, limite);
  }
  function secao(titulo, sub, itens, verTodos) {
    if (!itens.length) return "";
    return '<section class="secao"><div class="secao-cab"><div><h2>' + titulo + "</h2><p>" + sub + "</p></div>" +
      (verTodos ? '<button class="btn-borda" type="button" data-ver="' + verTodos + '">Ver todos</button>' : "") + "</div>" +
      '<div class="carrossel"><button class="seta ant" type="button" aria-label="Anterior" hidden>' + '<svg viewBox="0 0 24 24" aria-hidden="true" style="transform:scaleX(-1)">' + ICONES.seta + "</svg></button>" +
      '<div class="trilho">' + itens.map(function (x) { return cartao(x.it, { carrossel: true, cidades: x.n }); }).join("") + "</div>" +
      '<button class="seta prox" type="button" aria-label="Próximo">' + svg("seta") + "</button></div></section>";
  }
  function ligarCarrosseis(raiz) {
    raiz.querySelectorAll(".carrossel").forEach(function (c) {
      var t = c.querySelector(".trilho"), ant = c.querySelector(".ant"), prox = c.querySelector(".prox");
      function estadoSetas() { ant.hidden = t.scrollLeft < 8; prox.hidden = t.scrollLeft + t.clientWidth >= t.scrollWidth - 8; }
      ant.addEventListener("click", function () { t.scrollBy({ left: -t.clientWidth * 0.9, behavior: "smooth" }); });
      prox.addEventListener("click", function () { t.scrollBy({ left: t.clientWidth * 0.9, behavior: "smooth" }); });
      t.addEventListener("scroll", estadoSetas, { passive: true });
      window.addEventListener("resize", estadoSetas);
      estadoSetas();
    });
    raiz.querySelectorAll("[data-ver]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-ver"), aba = $("aba-" + id); if (aba) aba.click();
      });
    });
  }

  function render() {
    var ativo = filtrosAtivos();
    el.limpar.hidden = !ativo;
    el.vInicio.hidden = ativo; el.vBusca.hidden = !ativo;
    var f = filtrar();
    if (!ativo) {
      var todos = f.lista;
      var imper = melhoresPorPacote(todos.filter(function (i) { return i.r.p.capa; }), 12);
      var usados = {};
      imper.forEach(function (x) { usados[x.it.r.p.slug || x.it.r.p.nome] = 1; });
      var por = function (cat) {
        return melhoresPorPacote(todos.filter(function (i) { return i.r.cat === cat && !usados[i.r.p.slug || i.r.p.nome]; }), 12);
      };
      el.vInicio.innerHTML =
        secao("Pacotes imperdíveis", "Os menores preços por pessoa, com saída a partir de hoje.", imper, "") +
        secao("Pacotes nacionais", "Praias, serras e cidades do Brasil.", por("Nacional"), "nacional") +
        secao("Pacotes internacionais", "Para viajar além das fronteiras.", por("Internacional"), "internacional") +
        secao("Eventos e datas especiais", "Pacotes para shows, jogos e grandes eventos.", por("Evento"), "evento");
      ligarCarrosseis(el.vInicio);
      return;
    }
    var lista = f.lista;
    el.cont.textContent = lista.length === 1 ? "1 pacote encontrado" : lista.length.toLocaleString("pt-BR") + " pacotes encontrados";
    if (!lista.length) {
      el.lista.innerHTML = '<div class="vazio"><b>Nenhum pacote para essa busca</b>Tente outra data, outra origem ou limpe os filtros. Também podemos montar uma cotação pelo WhatsApp.</div>';
      el.mais.hidden = true; return;
    }
    el.lista.innerHTML = lista.slice(0, estado.visiveis).map(function (it) { return cartao(it, { filtrouData: f.filtrouData }); }).join("");
    var resto = lista.length - estado.visiveis;
    el.mais.hidden = resto <= 0;
    el.mais.textContent = "Mostrar mais pacotes (" + Math.max(resto, 0).toLocaleString("pt-BR") + ")";
  }
  function alterou() { estado.visiveis = PAGINA; render(); }

  $("busca").addEventListener("submit", function (e) { e.preventDefault(); alterou(); if (filtrosAtivos()) $("pacotes").scrollIntoView({ block: "start" }); });
  [el.o, el.d, el.dt, el.ord].forEach(function (x) { x.addEventListener("change", alterou); });
  el.mais.addEventListener("click", function () { estado.visiveis += PAGINA; render(); });
  el.limpar.addEventListener("click", function () {
    el.o.value = ""; el.d.value = ""; el.dt.value = ""; estado.cat = "";
    var a = $("aba-pacotes"); if (a) a.click(); else alterou();
  });

  fetch("ofertas.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(carregar)
    .catch(function () {
      el.vInicio.innerHTML = '<section class="secao"><div class="vazio"><b>Não foi possível carregar as ofertas agora</b>Atualize a página em instantes ou fale com a gente pelo WhatsApp.</div></section>';
    });
})();
