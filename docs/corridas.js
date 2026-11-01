// Página de turismo esportivo: lê corridas.json (gerado todos os dias por scripts/atualizar-corridas.mjs).
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var PAGINA = 12;
  var estado = { todas: [], visiveis: PAGINA };
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
  function dataBr(iso) { var p = String(iso).split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function mesAno(iso) { var p = iso.split("-"); return MESES[+p[1] - 1] + " de " + p[0]; }
  function dinheiro(v) { return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function rotuloDist(d) { return d === 42 ? "42K Maratona" : d === 21 ? "21K Meia" : d + "K"; }

  function cartao(c) {
    var foto = c.imagem
      ? '<img src="' + esc(c.imagem) + '" alt="" loading="lazy" decoding="async" width="720" height="450">'
      : window.vvArte(c.nome, c.id, "corrida");
    var dist = (c.distancias || []).slice(-4).map(rotuloDist);
    var preco = c.preco && c.preco.valor != null
      ? '<div class="rot">' + esc(c.preco.rotulo || "A partir de") + '</div><div class="val">' + esc(c.preco.moeda) + " " + dinheiro(c.preco.valor) + "</div>" +
        '<div class="taxa">' + (c.preco.obs ? esc(c.preco.obs.replace(/\s+/g, " ").toLowerCase()) : "por pessoa") + "</div>"
      : '<div class="consulte">Consulte o valor</div>';
    var local = [c.local, c.pais].filter(function (x, i, a) { return x && a.indexOf(x) === i; }).join(", ");
    var msg = c.esgotado
      ? 'Olá! Vi no site que a corrida "' + c.nome + '" está esgotada. Quero entrar na lista de espera ou saber de outras opções.'
      : 'Olá! Vi no site a corrida "' + c.nome + '" (' + dataBr(c.data) + ") e quero saber mais sobre o pacote de turismo esportivo.";
    // "O que está incluso" desativado nas corridas (MOSTRAR_INCLUSO = false). Para voltar, troque para true
    // e ligue LER_INCLUSO em scripts/atualizar-corridas.mjs.
    var MOSTRAR_INCLUSO = false;
    var inc = MOSTRAR_INCLUSO && ((c.inclui && c.inclui.length) || (c.hoteis && c.hoteis.length) || (c.naoInclui && c.naoInclui.length))
      ? "<details><summary>Hotéis e o que está incluso</summary>" +
        (c.hoteis && c.hoteis.length ? '<div class="hoteis">' + c.hoteis.map(function (h) { return '<div class="hotel"><b>' + esc(h) + "</b></div>"; }).join("") + "</div>" : "") +
        (c.inclui && c.inclui.length ? '<ul class="inclui">' + c.inclui.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
        (c.naoInclui && c.naoInclui.length ? '<p class="nao-inclui-t">Não incluso</p><ul class="inclui nao">' + c.naoInclui.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
        "</details>" : "";
    return '<article class="cartao' + (c.esgotado ? " esgotada" : "") + '"><div class="foto' + (c.imagem ? "" : " sem") + '">' + foto +
      (c.esgotado ? '<span class="etiqueta esg">Esgotado</span>' : (c.tipo && /majors/i.test(c.tipo) ? '<span class="etiqueta">World Marathon Majors</span>' : "")) +
      (dist.length ? '<span class="selo">' + esc(dist.join(" · ")) + "</span>" : "") + "</div>" +
      '<div class="cartao-corpo"><h3>' + esc(c.nome) + "</h3>" +
      '<div class="sub"><b>' + esc(dataBr(c.data)) + "</b>" + (local ? "<span>|</span><span>" + esc(local) + "</span>" : "") + "</div>" +
      (c.descricao ? '<p class="desc-corrida">' + esc(c.descricao) + "</p>" : "") +
      inc + '<div class="preco">' + preco + "</div>" +
      '<a class="btn-zap" target="_blank" rel="noopener" href="' + window.waLink(msg) + '">' + (c.esgotado ? "Entrar na lista de espera" : "Quero esta corrida") + "</a></div></article>";
  }

  function filtrar() {
    var q = norm($("f-busca").value), pais = $("f-pais").value, dist = +$("f-dist").value, mes = $("f-mes").value;
    return estado.todas.filter(function (c) {
      if (pais && c.paisNorm !== pais) return false;
      if (dist && !(c.distancias || []).some(function (d) { return dist === 42 ? d >= 42 : dist === 21 ? d >= 21 && d < 42 : d === dist; })) return false;
      if (mes && c.data.slice(0, 7) !== mes) return false;
      if (q && norm([c.nome, c.local, c.pais].join(" ")).indexOf(q) < 0) return false;
      return true;
    });
  }

  function desenhar() {
    var lista = filtrar(), ativo = $("f-busca").value || $("f-pais").value || $("f-dist").value || $("f-mes").value;
    $("f-limpar").hidden = !ativo;
    $("contagem").textContent = lista.length + (lista.length === 1 ? " corrida" : " corridas");
    $("aviso-vazio").hidden = lista.length > 0;
    $("lista").innerHTML = lista.slice(0, estado.visiveis).map(cartao).join("");
    $("mais").hidden = lista.length <= estado.visiveis;
  }

  function opcoes(sel, valores, rotulo) {
    valores.forEach(function (v) { var o = document.createElement("option"); o.value = v[0]; o.textContent = v[1]; sel.appendChild(o); });
  }

  function iniciar(dados) {
    // Regra do site: corrida cuja data já passou não aparece (mesmo que o arquivo tenha sido gerado ontem).
    // Esgotada aparece marcada como "Esgotado", com lista de espera pelo WhatsApp.
    var d0 = new Date(), hoje = d0.getFullYear() + "-" + String(d0.getMonth() + 1).padStart(2, "0") + "-" + String(d0.getDate()).padStart(2, "0");
    estado.todas = dados.corridas.filter(function (c) { return c.data >= hoje; }).map(function (c) { c.paisNorm = norm(c.pais); return c; });
    var paises = {}, meses = {};
    estado.todas.forEach(function (c) { if (c.pais) paises[c.paisNorm] = c.pais; meses[c.data.slice(0, 7)] = mesAno(c.data); });
    opcoes($("f-pais"), Object.keys(paises).sort().map(function (k) { return [k, paises[k]]; }));
    opcoes($("f-mes"), Object.keys(meses).sort().map(function (k) { return [k, meses[k]]; }));
    if (dados.geradoEm) {
      var d = new Date(dados.geradoEm);
      $("atualizado").textContent = "Atualizado em " + d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    ["f-busca", "f-pais", "f-dist", "f-mes"].forEach(function (id) {
      $(id).addEventListener(id === "f-busca" ? "input" : "change", function () { estado.visiveis = PAGINA; desenhar(); });
    });
    $("f-limpar").addEventListener("click", function () {
      ["f-busca", "f-pais", "f-dist", "f-mes"].forEach(function (id) { $(id).value = ""; });
      estado.visiveis = PAGINA; desenhar();
    });
    $("mais").addEventListener("click", function () { estado.visiveis += PAGINA; desenhar(); });
    desenhar();
  }

  $("arte-topo").innerHTML = window.vvArte("Corrida", "topo", "corrida");
  fetch("corridas.json", { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(iniciar)
    .catch(function () { $("aviso-vazio").hidden = false; $("aviso-vazio").textContent = "Não conseguimos carregar as corridas agora. Fale com a gente pelo WhatsApp que enviamos as opções."; });
})();
