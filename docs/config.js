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
  numeros: { embarques: 626, destinos: 28, clientes: 4890, desde: 2025 },
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
  servicos: ["Aéreo", "Cruzeiros", "Hospedagem", "Rodoviário", "Assessoria em visto"]
};
