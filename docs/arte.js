// Ilustrações dos pacotes e corridas sem foto (window.vvArte). Usado pela home e pela página de corridas.
(function () {
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
  window.vvArte = function (txt, sem, forcar) {
    var th = forcar || tema(txt), R = semente(th + (sem || txt)), g = "", n, i, x, y, w, h;
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
    } else if (th === "corrida") {
      g = '<defs><linearGradient id="vc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b2a6b"/><stop offset=".55" stop-color="#ff8a5c"/><stop offset="1" stop-color="#ffd27a"/></linearGradient></defs>' +
        '<rect width="320" height="200" fill="url(#vc)"/><circle cx="' + (50 + R() * 220).toFixed(0) + '" cy="98" r="24" fill="#fff3c4"/>';
      x = 0; while (x < 320) { w = 14 + R() * 24; h = 24 + R() * 52; g += '<rect x="' + x.toFixed(0) + '" y="' + (128 - h).toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="#1a2f63" opacity=".85"/>'; x += w + 1; }
      g += '<rect y="128" width="320" height="72" fill="#2a2f45"/><path d="M0 128h320" stroke="#ffbd00" stroke-width="2"/>' +
        '<g stroke="#fff" stroke-width="2" stroke-dasharray="14 12" opacity=".75"><path d="M0 150h320M0 172h320"/></g>' +
        '<g fill="#fff"><rect x="236" y="62" width="6" height="72"/><rect x="290" y="62" width="6" height="72"/><rect x="232" y="54" width="68" height="18" rx="3" fill="#d40f57"/></g>' +
        '<text x="266" y="67" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="800" font-size="9" fill="#fff">META</text>';
      var cs = ["#ffbd00", "#acce00", "#ffffff"];
      for (i = 0; i < 3; i++) { x = 40 + i * 62 + R() * 18; y = 138 + i * 10; var c2 = cs[i]; g += '<g stroke="' + c2 + '" stroke-width="3.2" stroke-linecap="round" fill="none"><circle cx="' + x.toFixed(0) + '" cy="' + (y - 24).toFixed(0) + '" r="4.5" fill="' + c2 + '"/><path d="M' + x.toFixed(0) + ' ' + (y - 18).toFixed(0) + 'L' + (x - 2).toFixed(0) + ' ' + (y - 4).toFixed(0) + 'M' + (x - 2).toFixed(0) + ' ' + (y - 4).toFixed(0) + 'L' + (x - 9).toFixed(0) + ' ' + (y + 8).toFixed(0) + 'M' + (x - 2).toFixed(0) + ' ' + (y - 4).toFixed(0) + 'L' + (x + 7).toFixed(0) + ' ' + (y + 6).toFixed(0) + 'M' + x.toFixed(0) + ' ' + (y - 15).toFixed(0) + 'L' + (x + 9).toFixed(0) + ' ' + (y - 8).toFixed(0) + 'M' + x.toFixed(0) + ' ' + (y - 15).toFixed(0) + 'L' + (x - 8).toFixed(0) + ' ' + (y - 10).toFixed(0) + '"/></g>'; }
    } else {
      g = '<defs><linearGradient id="vc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1f4d"/><stop offset="1" stop-color="#f08a5d"/></linearGradient></defs><rect width="320" height="200" fill="url(#vc)"/><circle cx="' + (40 + R() * 240).toFixed(0) + '" cy="46" r="14" fill="#fff6d6"/>';
      x = 0; while (x < 320) { w = 18 + R() * 26; h = 50 + R() * 90; g += '<rect x="' + x.toFixed(0) + '" y="' + (200 - h).toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" fill="' + (R() > .5 ? "#14264f" : "#1c3468") + '"/>'; for (i = 0; i < 6; i++) if (R() > .45) g += '<rect x="' + (x + 3 + R() * (w - 9)).toFixed(0) + '" y="' + (200 - h + 8 + i * 14).toFixed(0) + '" width="4" height="5" fill="#ffd36a"/>'; x += w + 2; }
    }
    var uid = "vc" + (window.__vvArteN = (window.__vvArteN || 0) + 1);
    return (cab + g + "</svg>").replace(/id="vc"/g, "id=\"" + uid + "\"").replace(/url\(#vc\)/g,"url(#" + uid + ")");
  };
})();
