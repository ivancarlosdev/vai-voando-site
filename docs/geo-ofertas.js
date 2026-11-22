// Coordenadas de aeroportos: OurAirports, domínio público (consulta em 22/11/2026).
// A localização do visitante é processada somente no navegador.
(function () {
  "use strict";
  const aeroportos = {"VDC":[-14.90789,-40.9148],"CGN":[50.8659,7.14274],"CFN":[55.0442,-8.341],"CEB":[10.30926,123.97974],"AQA":[-21.812,-48.133],"AJU":[-10.98394,-37.07287],"ARU":[-21.14148,-50.42457],"BEL":[-1.37928,-48.47621],"BSB":[-15.86917,-47.92083],"CAC":[-25.00032,-53.50121],"CNF":[-19.63571,-43.96693],"CGR":[-20.47,-54.67399],"XAP":[-27.1342,-52.6566],"CWB":[-25.5285,-49.1758],"CXJ":[-29.19718,-51.18765],"CGB":[-15.6529,-56.1167],"MAO":[-3.03861,-60.0497],"IGU":[-25.59417,-54.48944],"FLN":[-27.67028,-48.5525],"FOR":[-3.77583,-38.53222],"GIG":[-22.81,-43.25056],"GYN":[-16.632,-49.2207],"GRU":[-23.43127,-46.46995],"JPA":[-7.14869,-34.95055],"JOI":[-26.2245,-48.7974],"VCP":[-23.0074,-47.1345],"LDB":[-23.33438,-51.12837],"MGF":[-23.47606,-52.01619],"MCZ":[-9.51256,-35.79184],"NVT":[-26.87943,-48.65098],"GEL":[-28.2825,-54.16962],"POA":[-29.99398,-51.16748],"PFB":[-28.24398,-52.32777],"PMW":[-10.2915,-48.357],"PNZ":[-9.36242,-40.5691],"PVH":[-8.70849,-63.90234],"REC":[-8.12747,-34.92296],"SDU":[-22.9104,-43.16282],"RAO":[-21.13431,-47.77405],"NAT":[-5.76982,-35.36661],"OPS":[-11.885,-55.58611],"CGH":[-23.62766,-46.6546],"SJP":[-20.81711,-49.40696],"SSA":[-12.90861,-38.3225],"UDI":[-18.88358,-48.22594],"VIX":[-20.258,-40.285],"SCL":[-33.393,-70.7858],"CBW":[-24.0092,-52.3568],"MVD":[-34.83565,-56.0265]};
  const cidades = { "araraquara": "AQA", "porto velho": "PVH", "sao paulo": "GRU", "rio de janeiro": "GIG", "belo horizonte": "CNF", "vitoria": "VIX", "chapeco": "XAP", "londrina": "LDB", "campo mourao": "CBW", "sao jose do rio preto": "SJP", "s. j. rio preto": "SJP" };
  function normalizar(valor) { return String(valor || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim(); }
  function coordenadas(cidade, iata) {
    const codigo = /^[A-Z]{3}$/.test(String(iata || "")) ? iata : /\\(([A-Z]{3})\\)$/.exec(String(cidade || ""))?.[1];
    const nome = normalizar(String(cidade || "").replace(/\\s*\\([A-Z]{3}\\)$/, ""));
    return aeroportos[codigo] || aeroportos[cidades[nome]] || null;
  }
  function distancia(a, b) {
    const rad = Math.PI / 180, dLat = (b[0] - a[0]) * rad, dLon = (b[1] - a[1]) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
    return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function perto(cidade, iata, centro, raio) {
    const ponto = coordenadas(cidade, iata);
    return !!ponto && distancia(centro, ponto) <= raio;
  }
  function localizar(sucesso, falha) {
    if (!navigator.geolocation) return falha();
    navigator.geolocation.getCurrentPosition(
      (p) => sucesso([p.coords.latitude, p.coords.longitude]),
      falha,
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 3600000 }
    );
  }
  function sePermitido(sucesso) {
    if (!navigator.permissions?.query) return;
    navigator.permissions.query({ name: "geolocation" }).then((p) => {
      if (p.state === "granted") localizar(sucesso, () => {});
    }).catch(() => {});
  }
  window.VVGeo = { coordenadas, perto, localizar, sePermitido };
})();
