# Site Vai Voando Morada do Sol

Site de pacotes que se atualiza sozinho todo dia, às 06h17 (horário de Brasília).

## Como funciona

1. Todo dia o GitHub abre o portal Viajando com Desconto (Cativa Operadora) num navegador automático.
2. A rotina lê a lista de pacotes, hotéis, valores e datas e grava em `docs/ofertas.json`. As fotos dos destinos vão para `docs/img/`.
3. O site (`docs/index.html`) lê esse arquivo. Quem entra e busca uma data vê os valores na hora.
4. Se a leitura sair vazia ou com queda grande de ofertas, a rotina para e mantém o arquivo do dia anterior.

## Colocar no ar (uma vez só)

1. Crie uma conta gratuita em github.com e um repositório novo chamado `vai-voando-site`. No plano gratuito, o GitHub Pages exige repositório **público**.
2. Envie todo o conteúdo desta pasta para o repositório (botão "Add file", depois "Upload files"). A pasta `.github` é oculta no Windows; ative "Itens ocultos" no Explorador para ela aparecer.
3. No repositório, abra **Settings, Pages**. Em "Build and deployment", escolha **Deploy from a branch**, branch `main` e pasta **/docs**.
4. Abra a aba **Actions**, escolha **Atualizar ofertas** e clique em **Run workflow**. A primeira leitura leva alguns minutos e é o teste de que o GitHub consegue abrir o portal.
5. Quando terminar, o site está em `https://SEU-USUARIO.github.io/vai-voando-site/`.

## Número do WhatsApp

Em `docs/index.html`, procure `WA_NUMBER` e coloque o número com DDI e DDD, só dígitos. Exemplo: `5516900000000`.

## Domínio da GoDaddy

1. No GitHub, em **Settings, Pages, Custom domain**, digite o domínio (por exemplo `www.seudominio.com.br`) e salve.
2. Na GoDaddy, abra **DNS** do domínio e crie um registro **CNAME**: nome `www`, valor `SEU-USUARIO.github.io`.
3. Para o domínio sem `www`, crie quatro registros **A** com o nome `@` e os valores `185.199.108.153`, `185.199.109.153`, `185.199.110.153` e `185.199.111.153`. Confira esses números na documentação do GitHub Pages, caso tenham mudado.
4. Quando o GitHub liberar, marque **Enforce HTTPS**. A propagação do DNS pode levar de alguns minutos a algumas horas.

## Se a atualização falhar

- O GitHub envia um e-mail avisando. O site continua no ar com os dados do último dia que funcionou.
- Abra **Actions**, clique na execução com erro e veja a mensagem no passo "Ler as ofertas do portal".
- Se a mensagem disser que o portal mudou (`PACOTES` ou `vdSaidasDaOferta` não encontrados), a Cativa alterou o portal e a leitura precisa de ajuste em `scripts/atualizar.mjs`.
- O GitHub pode pausar rotinas agendadas em repositórios sem atividade por 60 dias. Se o robô parar de rodar, clique em "Enable workflow" na aba Actions.

## Observações sobre os dados

- Os valores são por pessoa, em parcelas, e a data de divulgação aparece em cada cartão.
- O valor mostrado vale para a data principal da oferta. Nas "outras datas", o cartão avisa que o valor é confirmado pelo WhatsApp.
- Uso do conteúdo da Cativa Operadora autorizado por escrito. Guarde essa autorização.
