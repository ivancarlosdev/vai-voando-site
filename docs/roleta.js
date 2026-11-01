// Roleta "Gire e ganhe". Prêmios, chances e regras ficam em config.js (AGENCIA.roleta).
// Nada é guardado em servidor: o nome e o WhatsApp só vão na mensagem enviada pelo próprio cliente.
(function () {
  var A = window.AGENCIA, R = A && A.roleta;
  if (!R || R.ativa === false) return;
  if (document.body.getAttribute("data-pagina") === "visto") return;

  var CHAVE = "vv-roleta-v1", SESSAO = "vv-roleta-aberta";
  function ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || "null"); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem(CHAVE, JSON.stringify(v)); } catch (e) {} }
  var jaAbriu = function () { try { return sessionStorage.getItem(SESSAO) === "1"; } catch (e) { return false; } };
  var marcarAbriu = function () { try { sessionStorage.setItem(SESSAO, "1"); } catch (e) {} };

  var premios = R.premios;            // [{id, rotulo, titulo, chance}]
  var fatias = R.fatias;              // ids na ordem das 8 fatias, no sentido horário a partir do topo
  var N = fatias.length, ANG = 360 / N;
  var porId = {}; premios.forEach(function (p) { porId[p.id] = p; });

  function aleatorio() { var b = new Uint32Array(1); (window.crypto || window.msCrypto).getRandomValues(b); return b[0] / 4294967296; }
  function sortear() {
    var total = premios.reduce(function (s, p) { return s + p.chance; }, 0), x = aleatorio() * total, acc = 0;
    for (var i = 0; i < premios.length; i++) { acc += premios[i].chance; if (x < acc) return premios[i]; }
    return premios[0];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var cores = ["#d40f57", "#017c9d", "#acce00", "#f41800", "#ffbd00"];
  function rad(g) { return g * Math.PI / 180; }
  function ponto(r, g) { return [(100 + r * Math.cos(rad(g))).toFixed(2), (100 + r * Math.sin(rad(g))).toFixed(2)]; }
  function roda() {
    var s = '<svg viewBox="0 0 200 200" aria-hidden="true"><g class="vr-giro">';
    for (var i = 0; i < N; i++) {
      var a0 = -90 + i * ANG, a1 = a0 + ANG, p0 = ponto(96, a0), p1 = ponto(96, a1), mid = a0 + ANG / 2;
      var p = porId[fatias[i]], cor = p.id === "5" ? (i % 2 ? "#017c9d" : "#d40f57") : (p.id === "10" ? "#ffbd00" : (p.id === "vale" ? "#acce00" : (p.id === "15" ? "#000d2d" : "#f41800")));
      var escuro = p.id === "10" || p.id === "vale";
      s += '<path d="M100 100L' + p0[0] + " " + p0[1] + "A96 96 0 0 1 " + p1[0] + " " + p1[1] + 'Z" fill="' + cor + '" stroke="#fff" stroke-width="1.5"/>';
      s += '<text transform="rotate(' + mid + " 100 100) translate(100 100) translate(60 0)" + '" text-anchor="middle" dominant-baseline="middle" font-family="Montserrat,sans-serif" font-weight="800" font-size="' + (p.rotulo.length > 6 ? 9 : 13) + '" fill="' + (escuro ? "#000d2d" : "#fff") + '">' + esc(p.rotulo) + "</text>";
    }
    return s + '</g><circle cx="100" cy="100" r="14" fill="#000d2d" stroke="#ffbd00" stroke-width="3"/></svg>';
  }

  var css = document.createElement("style");
  css.textContent =
    ".vr-fab{position:fixed;left:max(14px,env(safe-area-inset-left,0px));bottom:max(14px,env(safe-area-inset-bottom,0px));z-index:60;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:12px 18px;background:var(--ouro,#ffbd00);color:var(--marinho,#000d2d);font:800 .92rem var(--f-titulo,Montserrat,sans-serif);box-shadow:0 8px 24px rgba(0,13,45,.35);cursor:pointer}" +
    ".vr-fab[hidden],.vr-fundo[hidden]{display:none}" +
    ".vr-fundo{position:fixed;inset:0;z-index:100;background:rgba(0,13,45,.72);display:grid;place-items:center;padding:16px;overflow:auto}" +
    ".vr-cx{position:relative;width:min(100%,460px);max-height:100%;overflow:auto;background:#fff;border-radius:22px;border-top:6px solid var(--ouro,#ffbd00);padding:26px 22px 22px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.45)}" +
    ".vr-x{position:absolute;right:10px;top:8px;width:40px;height:40px;border:0;background:none;font-size:1.7rem;line-height:1;color:var(--suave,#5b6785);cursor:pointer}" +
    ".vr-cx h2{margin:0 0 6px;font-size:1.4rem;color:var(--marinho,#000d2d)}" +
    ".vr-cx p{margin:0 0 12px;color:var(--suave,#5b6785)}" +
    ".vr-roda{position:relative;width:min(70vw,260px);margin:6px auto 14px}" +
    ".vr-roda svg{display:block;width:100%;height:auto}" +
    ".vr-giro{transform-origin:100px 100px;transition:transform 5s cubic-bezier(.12,.7,.1,1)}" +
    ".vr-seta{position:absolute;left:50%;top:-8px;width:0;height:0;margin-left:-11px;border-left:11px solid transparent;border-right:11px solid transparent;border-top:22px solid var(--marinho,#000d2d);filter:drop-shadow(0 2px 0 #ffbd00)}" +
    ".vr-form{display:grid;gap:10px;text-align:left}" +
    ".vr-form label{display:grid;gap:4px;font:800 .84rem var(--f-titulo,Montserrat,sans-serif);color:var(--marinho,#000d2d)}" +
    ".vr-form input[type=text],.vr-form input[type=tel]{width:100%;border:1px solid var(--linha,#dfe3ef);border-radius:10px;padding:11px 12px;font:600 1rem var(--f-corpo,sans-serif)}" +
    ".vr-form .vr-ok{display:flex;gap:8px;align-items:flex-start;font:600 .8rem var(--f-corpo,sans-serif);color:var(--suave,#5b6785)}" +
    ".vr-btn{display:inline-flex;justify-content:center;align-items:center;width:100%;border:0;border-radius:999px;padding:14px 22px;background:var(--ouro,#ffbd00);color:var(--marinho,#000d2d);font:800 1rem var(--f-titulo,Montserrat,sans-serif);cursor:pointer;text-decoration:none}" +
    ".vr-btn.zap{background:#25d366;color:#fff}" +
    ".vr-btn[disabled]{opacity:.6;cursor:default}" +
    ".vr-premio{font:800 1.9rem var(--f-titulo,Montserrat,sans-serif);color:var(--magenta,#d40f57);margin:4px 0 6px}" +
    ".vr-reg{margin-top:12px;font-size:.76rem;color:var(--suave,#5b6785);text-align:left}" +
    ".vr-reg summary{cursor:pointer;font-weight:700}" +
    ".vr-fab{animation:vr-pulsa 2.6s ease-in-out 1s 3}" +
    "@keyframes vr-pulsa{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}" +
    "@media (prefers-reduced-motion:reduce){.vr-giro{transition-duration:.01s}.vr-fab{animation:none}}";
  document.head.appendChild(css);

  var fab = document.createElement("button");
  fab.type = "button"; fab.className = "vr-fab"; fab.hidden = true;
  document.body.appendChild(fab);

  var fundo = document.createElement("div");
  fundo.className = "vr-fundo"; fundo.hidden = true;
  fundo.innerHTML = '<div class="vr-cx" role="dialog" aria-modal="true" aria-labelledby="vr-t"><button class="vr-x" type="button" aria-label="Fechar">×</button><div id="vr-corpo"></div></div>';
  document.body.appendChild(fundo);
  var corpo = fundo.querySelector("#vr-corpo"), cx = fundo.querySelector(".vr-cx"), ultimoFoco = null;

  var reg = '<details class="vr-reg"><summary>Regulamento</summary><p>' + R.regulamento.map(esc).join("</p><p>") + "</p></details>";

  function telaGiro() {
    corpo.innerHTML =
      '<h2 id="vr-t">' + esc(R.titulo) + "</h2><p>" + esc(R.subtitulo) + "</p>" +
      '<div class="vr-roda"><span class="vr-seta"></span>' + roda() + "</div>" +
      '<form class="vr-form" id="vr-f" novalidate>' +
      '<label>Seu nome<input type="text" name="nome" autocomplete="given-name" required></label>' +
      '<label>Seu WhatsApp (com DDD)<input type="tel" name="tel" inputmode="tel" autocomplete="tel" placeholder="(16) 99999-9999" required></label>' +
      '<label class="vr-ok"><input type="checkbox" name="ok" required> Concordo em receber contato da agência pelo WhatsApp sobre o meu prêmio. Não guardamos esses dados no site.</label>' +
      '<button class="vr-btn" type="submit" id="vr-girar">Girar a roleta</button></form>' + reg;
    var f = corpo.querySelector("#vr-f");
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!f.reportValidity()) return;
      var nome = f.elements.nome.value.trim(), tel = f.elements.tel.value.trim();
      var p = sortear(), idx = [], i;
      for (i = 0; i < N; i++) if (fatias[i] === p.id) idx.push(i);
      var alvo = idx[Math.floor(aleatorio() * idx.length)];
      var desvio = (aleatorio() - .5) * (ANG - 10);
      var fim = 360 * 6 - (alvo * ANG + ANG / 2) + desvio;
      var giro = corpo.querySelector(".vr-giro"), btn = corpo.querySelector("#vr-girar");
      btn.disabled = true; btn.textContent = "Girando...";
      f.querySelectorAll("input").forEach(function (x) { x.disabled = true; });
      giro.style.transform = "rotate(" + fim + "deg)";
      var codigo = "VV-" + Math.floor(aleatorio() * 36 ** 5).toString(36).toUpperCase().padStart(5, "0");
      var salvo = { premio: p.id, nome: nome, tel: tel, codigo: codigo, quando: Date.now() };
      gravar(salvo);
      var reduz = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(function () { telaPremio(salvo); atualizarFab(); }, reduz ? 200 : 5300);
    });
  }

  function mensagem(s) {
    var p = porId[s.premio];
    return "Olá! Girei a roleta no site da Vai Voando e ganhei: " + p.titulo + ".\nNome: " + s.nome + "\nWhatsApp: " + s.tel + "\nCódigo do prêmio: " + s.codigo + "\nQuero resgatar!";
  }
  function validade(s) { var d = new Date(s.quando + R.validadeDias * 86400000); return d.toLocaleDateString("pt-BR"); }
  function telaPremio(s) {
    var p = porId[s.premio];
    corpo.innerHTML =
      '<h2 id="vr-t">Parabéns, ' + esc(s.nome.split(" ")[0]) + "!</h2><p>Você ganhou</p>" +
      '<div class="vr-premio">' + esc(p.titulo) + "</div>" +
      "<p>Seu código: <b>" + esc(s.codigo) + "</b><br>Válido até " + validade(s) + ".</p>" +
      '<a class="vr-btn zap" target="_blank" rel="noopener" href="' + waLink(mensagem(s)) + '">Resgatar no WhatsApp</a>' + reg;
  }

  function abrir() {
    ultimoFoco = document.activeElement; marcarAbriu();
    var s = ler();
    if (s && porId[s.premio]) telaPremio(s); else telaGiro();
    fundo.hidden = false; fab.hidden = true;
    document.documentElement.style.overflow = "hidden";
    var alvo = cx.querySelector("input,a.vr-btn"); (alvo || cx.querySelector(".vr-x")).focus();
  }
  function fechar() {
    fundo.hidden = true; document.documentElement.style.overflow = "";
    atualizarFab(); if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  function atualizarFab() {
    var s = ler(); fab.hidden = !fundo.hidden;
    fab.innerHTML = s && porId[s.premio] ? "🎁 Seu prêmio" : "🎁 Gire e ganhe";
  }
  fab.addEventListener("click", abrir);
  fundo.querySelector(".vr-x").addEventListener("click", fechar);
  fundo.addEventListener("click", function (e) { if (e.target === fundo) fechar(); });
  document.addEventListener("keydown", function (e) {
    if (fundo.hidden) return;
    if (e.key === "Escape") return fechar();
    if (e.key === "Tab") {
      var f = cx.querySelectorAll("button:not([disabled]),input:not([disabled]),a[href],summary");
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  // O botão fixo aparece depois de alguns segundos; no computador, a roleta também abre uma vez por visita
  // quando o mouse sobe para fora da página (intenção de sair).
  setTimeout(atualizarFab, R.segundosParaBotao * 1000);
  // Para testar: abra qualquer página do site com ?roleta no final do endereço (ex.: .../index.html?roleta).
  // Isso apaga o giro guardado neste aparelho e abre a roleta na hora.
  if (/[?&]roleta(=|&|$)/.test(location.search)) {
    try { localStorage.removeItem(CHAVE); sessionStorage.removeItem(SESSAO); } catch (e) {}
    setTimeout(abrir, 800);
  }
  var entrada = Date.now();
  document.addEventListener("mouseout", function (e) {
    if (e.relatedTarget || e.clientY > 0 || !fundo.hidden || jaAbriu() || ler()) return;
    if (Date.now() - entrada < R.segundosMinimoParaSair * 1000) return;
    if (window.matchMedia && !matchMedia("(hover: hover)").matches) return;
    abrir();
  });
})();
