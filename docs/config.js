// Dados da agência. Para mudar telefone, e-mail ou endereço, altere só este arquivo:
// o cabeçalho, o rodapé e os botões de WhatsApp de todas as páginas leem daqui.
window.AGENCIA = {
  nome: "Vai Voando - Morada do Sol",
  marca: "Morada do Sol Viagens",
  slogan: "Seu destino, nossa paixão.",
  site: "https://www.vaivoandomoradadosol.com.br/",
  // WhatsApp: número com DDI e DDD (só dígitos) e o texto que aparece na tela. O primeiro é o principal.
  whatsapps: [
    { numero: "5516991420330", texto: "(16) 99142-0330" },
    { numero: "5516991333578", texto: "(16) 99133-3578" }
  ],
  email: "vaivoando.moradadosol@gmail.com",
  instagram: "https://www.instagram.com/vaivoando.moradadosol/",
  instagramUsuario: "@vaivoando.moradadosol",
  endereco: { rua: "Alameda Paulista, 2026", cidade: "Araraquara", uf: "SP", cep: "14810-282" },
  // Números da página "Quem somos" e do visto. Atualize aqui.
  numeros: { embarques: 626, destinos: 28, clientes: 4890, desde: 2015 },
  // Avaliações do Google. Para incluir outra, copie o texto da avaliação e acrescente um item em "itens".
  // "link" é a página da agência no Google (Maps). Troque pelo link curto do perfil, se tiver.
  avaliacoes: {
    nota: 5.0,
    total: 11,
    link: "https://www.google.com/maps/search/?api=1&query=Vai+Voando+Morada+do+Sol+Araraquara",
    itens: [
      { nome: "Israel Ramos", texto: "Pessoal sensacional, te ajudam desde o início da compra até o dia do embarque e desembarque, dão total apoio pro que precisar... Meus parabéns a toda equipe!" },
      { nome: "Josi Tonche", texto: "Só viajo com eles! São incríveis, super indico." },
      { nome: "Maria Germina de Oliveira", texto: "Amei a viagem." },
      { nome: "Vanessa Marraschio", texto: "Atendimento excepcional desde a contratação, até o final da hospedagem e transfer. EQUIPE NOTA 10! Recomendo." },
      { nome: "Marcelo Santos", texto: "Atendimento maravilhoso e atencioso por toda a equipe." },
      { nome: "Aline Coluccio", texto: "Excelente experiência! Parabéns pelo trabalho!" },
      { nome: "Carol D. L.", texto: "Atendimento da Stefany nota 10! Muito paciente e simpática. Empresa idônea, amparou a minha viagem de férias." },
      { nome: "Simone Maro", texto: "Tudo certo com a minha viagem! E todas as vezes que surgia alguma dúvida, era sempre respondida! Obrigada!" },
      { nome: "Jhenerson Silva Melo", texto: "Foi tudo perfeito, um excelente atendimento pessoal, dá toda assistência necessária desde a compra até a viagem. Correu tudo conforme combinado." },
      { nome: "Talita Martins", texto: "Comprei no boleto com eles ida e volta pra Goiânia com meu filho e deu tudo certo. Recomendo e comprarei mais vezes." }
    ]
  },
  // Roleta "Gire e ganhe" (roleta.js). Para desligar, ponha ativa: false.
  // "chance" é o peso do sorteio (soma 100). "fatias" é a ordem visual das 8 fatias da roda.
  roleta: {
    ativa: true,
    titulo: "Gire e ganhe um presente",
    subtitulo: "Todo mundo ganha. Gire a roleta e resgate seu prêmio no WhatsApp.",
    validadeDias: 7,
    segundosParaBotao: 8,
    segundosMinimoParaSair: 6,
    premios: [
      { id: "5", rotulo: "5%", titulo: "5% de desconto (até R$ 25)", chance: 99.985 },
      { id: "10", rotulo: "10%", titulo: "10% de desconto (até R$ 50)", chance: 0.006 },
      { id: "15", rotulo: "15%", titulo: "15% de desconto (até R$ 100)", chance: 0.003 },
      { id: "mala", rotulo: "Mala", titulo: "Uma mala de viagem", chance: 0.003 },
      { id: "vale", rotulo: "Vale-viagem", titulo: "Vale-viagem de R$ 150", chance: 0.003 }
    ],
    fatias: ["5", "mala", "5", "10", "5", "vale", "15", "5"],
    regulamento: [
      "Todo participante ganha um prêmio. A grande maioria dos giros resulta em 5% de desconto; 10%, 15%, mala de viagem e vale-viagem são prêmios raros.",
      "Os descontos são aplicados sobre a tarifa do dia: 15% limitado a R$ 100; 10% limitado a R$ 50; 5% limitado a R$ 25. O vale-viagem é de até R$ 150.",
      "Os descontos não são acumulativos. Prêmio válido uma vez por CPF, com um giro por pessoa.",
      "O prêmio vale por 7 dias a partir do giro e precisa ser confirmado pela equipe da agência no WhatsApp, com o código recebido.",
      "Nome e WhatsApp são usados apenas para enviar a mensagem do prêmio e não ficam guardados neste site."
    ]
  },
  servicos: ["Aéreo", "Cruzeiros", "Hospedagem", "Rodoviário", "Assessoria em visto"]
};
