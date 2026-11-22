document.querySelector("[data-vis-clientes]").textContent = "Mais de " + window.AGENCIA.numeros.clientes.toLocaleString("pt-BR") + " clientes atendidos";

document.getElementById("form-visto").addEventListener("submit", async function (ev) {
  ev.preventDefault();
  const form = ev.currentTarget;
  if (!form.reportValidity()) return;
  const valor = (nome) => form.elements[nome].value.trim();
  const retorno = document.getElementById("visto-retorno");
  const botao = form.querySelector('button[type="submit"]');
  let telefone = valor("telefone").replace(/\D/g, "");
  if (telefone.length === 10 || telefone.length === 11) telefone = "55" + telefone;
  retorno.hidden = false;
  if (!/^55\d{10,11}$/.test(telefone)) {
    retorno.textContent = "Confira o telefone com DDD.";
    return;
  }
  botao.disabled = true;
  retorno.textContent = "Enviando sua solicitação…";
  try {
    const resposta = await fetch("https://crm.vaivoandomoradadosol.com.br/api/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: valor("nome"), phone: telefone, consent: form.elements.consent.checked,
        offer_title: "Assessoria em visto · " + valor("destino"), page_url: location.href,
        message: "Solicitação de visto para " + valor("destino") + ". E-mail: " + valor("email") +
          (valor("comentarios") ? ". Comentários: " + valor("comentarios") : "")
      })
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.error || "Não conseguimos enviar agora.");
    retorno.textContent = "Recebemos sua solicitação! Nossa equipe entrará em contato pelo telefone informado.";
    form.reset();
  } catch (erro) {
    retorno.textContent = "Não foi possível enviar: " + erro.message + " Tente novamente.";
  } finally {
    botao.disabled = false;
  }
});
