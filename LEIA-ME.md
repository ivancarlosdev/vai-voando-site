# Site Vai Voando - Morada do Sol Viagens

Site estático (GitHub Pages, pasta `/docs`) com pacotes atualizados todo dia.

## Onde mudar os dados da agência
Tudo em `docs/config.js`: WhatsApps, e-mail, Instagram, endereço, serviços.
Textos das páginas: `docs/quem-somos.html` e `docs/formas-de-pagamento.html`.
Logo e ícones: `docs/marca/`.

## Atualização diária dos pacotes
`.github/workflows/atualizar.yml` roda todo dia às 06:17 (Brasília), executa
`scripts/atualizar.mjs`, que lê o portal da Cativa (viajandocomdesconto.com),
reduz as fotos para WebP e grava `docs/ofertas.json` + `docs/img/`.
Se vier dado suspeito (poucos pacotes), a atualização é abortada e o site mantém o anterior.
Para rodar na hora: aba **Actions > Atualizar ofertas > Run workflow**.

## Publicação
GitHub > Settings > Pages > Branch `main`, pasta `/docs`.
Domínio principal: **www.vaivoandomoradadosol.com.br**

### DNS na GoDaddy (vaivoandomoradadosol.com.br)
- 4 registros **A** com nome `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- 1 registro **CNAME** nome `www` apontando para `ivancarlosdev.github.io`
- No GitHub (Pages > Custom domain): `www.vaivoandomoradadosol.com.br` e marcar **Enforce HTTPS**.

### vaivoandomoradadosol.com
O GitHub aceita um só domínio por site. Na GoDaddy use **Encaminhamento de domínio**
do `.com` para `https://www.vaivoandomoradadosol.com.br` (permanente, 301).
