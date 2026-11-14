// Monta o cabeçalho e o rodapé de todas as páginas e liga os botões de WhatsApp.
(function () {
  var A = window.AGENCIA;
  var principal = A.whatsapps[0];

  window.waLink = function (texto, numero) {
    return "https://wa.me/" + (numero || principal.numero) + "?text=" + encodeURIComponent(texto || "");
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var zap = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.33-2 1.4-.52.07-1.17.1-1.9-.12a17 17 0 0 1-1.72-.64c-3-1.3-4.95-4.35-5.1-4.55-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.17 1.03-2.46.27-.3.58-.37.78-.37h.56c.18 0 .42-.07.65.5.25.58.84 2.02.91 2.17.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.32.38-.45.51-.15.15-.3.3-.13.6.17.3.77 1.27 1.65 2.05 1.13 1 2.09 1.31 2.39 1.46.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.07.12.07.72-.18 1.42Z"/></svg>';

  var paginas = [
    { href: "index.html", rotulo: "Início", chave: "inicio" },
    { href: "index.html#pacotes", rotulo: "Pacotes", chave: "pacotes" },
    { href: "quem-somos.html", rotulo: "Quem somos", chave: "quem-somos" },
    { href: "promo-voo.html", rotulo: "Promo Voo", chave: "promo-voo" },
    { href: "cruzeiros.html", rotulo: "Cruzeiros", chave: "cruzeiros" },
    { href: "corridas.html", rotulo: "Corridas", chave: "corridas" },
    { href: "visto.html", rotulo: "Visto", chave: "visto" },
    { href: "formas-de-pagamento.html", rotulo: "Formas de pagamento", chave: "pagamento" }
  ];
  var atual = document.body.getAttribute("data-pagina") || "inicio";

  document.addEventListener("click", function (evento) {
    var link = evento.target.closest('a[href^="https://wa.me/"]');
    if (!link || link.classList.contains("vr-btn") || link.classList.contains("btn-zap")) return;

    var secao = atual;
    if (link.closest("#inicio-cruzeiros")) secao = "cruzeiros";
    else if (link.closest("#pacotes, #vista-busca, #banner-promocoes")) secao = "pacotes";

    window.gtag?.("event", "clique_cotacao_whatsapp", {
      send_to: "G-19N6EGNTT7",
      secao_cotacao: secao
    });
  });

  var nav = paginas.map(function (p) {
    return '<a href="' + p.href + '"' + (p.chave === atual ? ' aria-current="page"' : "") + ">" + p.rotulo + "</a>";
  }).join("");

  var topo =
    '<div class="topo"><div class="cx topo-in">' +
    '<a class="marca" href="index.html" aria-label="' + esc(A.nome) + ', página inicial">' +
    '<img src="marca/logo.png" width="56" height="56" alt="">' +
    "<span><b>Vai Voando</b><small>Morada do Sol Viagens</small></span></a>" +
    '<nav class="menu" aria-label="Principal" id="menu">' + nav + "</nav>" +
    '<a class="topo-zap" href="' + waLink("Olá! Vim pelo site da Vai Voando e quero ajuda para escolher uma viagem.") + '" target="_blank" rel="noopener">' + zap +
    "<span>" + esc(principal.texto) + "</span></a>" +
    '<button class="hamb" id="hamb" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>' +
    "</div></div>" +
    '<div class="faixa" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>';

  var e = A.endereco;
  var rodape =
    '<div class="faixa" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="cx rodape-in">' +
    '<div class="rod-col rod-marca"><img src="marca/logo.png" width="96" height="96" alt="' + esc(A.nome) + '" loading="lazy">' +
    '<p class="script">' + esc(A.slogan) + "</p><p>" + esc(A.marca) + ", franqueada da Vai Voando.</p></div>" +
    '<div class="rod-col"><h2>Navegue</h2><ul>' +
    paginas.map(function (p) { return '<li><a href="' + p.href + '">' + p.rotulo + "</a></li>"; }).join("") + "</ul></div>" +
    '<div class="rod-col"><h2>Fale com a gente</h2><ul>' +
    A.whatsapps.map(function (w) { return '<li><a href="' + waLink("Olá! Vim pelo site da Vai Voando.", w.numero) + '" target="_blank" rel="noopener">WhatsApp ' + esc(w.texto) + "</a></li>"; }).join("") +
    '<li><a href="' + A.instagram + '" target="_blank" rel="noopener">Instagram ' + esc(A.instagramUsuario) + "</a></li>" +
    '<li><a href="mailto:' + A.email + '">' + esc(A.email) + "</a></li></ul></div>" +
    '<div class="rod-col"><h2>Onde estamos</h2><p>' + esc(e.rua) + "<br>" + esc(e.cidade) + " - " + esc(e.uf) + "<br>CEP " + esc(e.cep) + "</p>" +
    "<h2>O que fazemos</h2><p>" + A.servicos.map(esc).join(", ") + ".</p></div>" +
    "</div>" +
    '<div class="cx rodape-nota"><p>Agência Vai Voando Morada do Sol registrada sob o CNPJ</p>' +
    '<p><strong>CNPJ: 58.097.260/0001-07</strong> (Ativo)<br>' +
    '<strong>Razão Social:</strong> 58.097.260 IVAN CARLOS DA SILVA SAMPAIO - ME<br>' +
    '<strong>Cadastur:</strong> 58.097.260/0001-07</p>' +
    "<p>&copy; " + new Date().getFullYear() + " " + esc(A.nome) + ". Todos os direitos reservados.</p></div>";

  var t = document.getElementById("topo");
  if (t) {
    if (window.CAMPANHA_VIAGEM) {
      document.body.classList.add("campanha-black");
      topo = '<a class="faixa-black" href="' + (atual === "inicio" ? "" : "index.html") +
        '#banner-promocoes"><strong>' + esc(window.CAMPANHA_VIAGEM) +
        ' Vai Voando</strong><span>Confira as ofertas <span aria-hidden="true">↗</span></span></a>' + topo;
    }
    t.innerHTML = topo;
  }
  var r = document.getElementById("rodape"); if (r) r.innerHTML = rodape;

  var hamb = document.getElementById("hamb"), menu = document.getElementById("menu");
  if (hamb && menu) hamb.addEventListener("click", function () {
    var aberto = menu.classList.toggle("aberto");
    hamb.setAttribute("aria-expanded", String(aberto));
  });

  // Destaque das avaliações do Google: <section id="avaliacoes"> (dados em config.js)
  var av = A.avaliacoes, alvoAv = document.getElementById("avaliacoes");
  if (av && alvoAv) {
    var estrelas = '<span class="estrelas" aria-hidden="true">★★★★★</span>';
    var nota = String(av.nota.toFixed(1)).replace(".", ",");
    alvoAv.innerHTML =
      '<div class="aval-topo"><div>' +
      '<h2 id="h-aval">Somos ' + (av.nota % 1 ? nota : String(av.nota)) + ' estrelas no Google</h2>' +
      '<p class="aval-sub">' + estrelas + ' <b>' + nota + '</b> · ' + av.total + ' avaliações de clientes</p></div>' +
      '<a class="btn-ouro" href="' + av.link + '" target="_blank" rel="noopener">Ver no Google</a></div>' +
      '<div class="aval-lista" tabindex="0" role="region" aria-label="Avaliações de clientes">' + av.itens.map(function (i) {
        return '<figure class="aval"><div>' + estrelas + '</div><blockquote>“' + esc(i.texto) + '”</blockquote><figcaption>' + esc(i.nome) + ' <small>avaliação no Google</small></figcaption></figure>';
      }).join("") + "</div>";
  }

  // Roleta "Gire e ganhe"
  if (A.roleta && A.roleta.ativa !== false) {
    var rs = document.createElement("script"); rs.src = "roleta.js"; rs.defer = true; document.body.appendChild(rs);
  }

  // Botões de WhatsApp avulsos: <a data-wa="mensagem" data-wa-num="1">
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    var i = +(a.getAttribute("data-wa-num") || 0);
    a.href = waLink(a.getAttribute("data-wa"), (A.whatsapps[i] || principal).numero);
    a.target = "_blank"; a.rel = "noopener";
  });
  document.querySelectorAll("[data-zap-texto]").forEach(function (el) {
    var i = +el.getAttribute("data-zap-texto"); el.textContent = (A.whatsapps[i] || principal).texto;
  });
  document.querySelectorAll("[data-email]").forEach(function (a) { a.href = "mailto:" + A.email; a.textContent = A.email; });

  window.VV_CHAT_ENABLED = true;
  var chatCss = document.createElement("link"); chatCss.rel = "stylesheet"; chatCss.href = "site-chat.css?v=1"; document.head.appendChild(chatCss);
  var chatScript = document.createElement("script"); chatScript.src = "site-chat.js?v=1"; chatScript.defer = true; document.body.appendChild(chatScript);
  document.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (!link) return;
    if (window.VV_CHAT_ENABLED && link.classList.contains("btn-zap")) return;
    var banner = link.id === "editorial-link";
    var whatsapp = /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(link.href);
    if (!banner && !whatsapp) return;
    var offerId = Number(link.dataset.editorialId || 0);
    var source = banner ? "banner" : offerId ? "offer_whatsapp" : link.closest("#topo") ? "header_whatsapp" : link.closest("#rodape") ? "footer_whatsapp" : "page_whatsapp";
    var data = { source: source };
    if (offerId) data.offer_id = offerId;
    if (navigator.sendBeacon) navigator.sendBeacon("https://crm.vaivoandomoradadosol.com.br/api/site/click", new Blob([JSON.stringify(data)], { type: "text/plain" }));
  });
})();
