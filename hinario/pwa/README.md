# Hinário MQAAF (PWA)

Aplicativo Web Progressivo para apresentação de hinos, com modo de apresentação em tela cheia, playlist aleatória, reprodução de áudio e controles de tipografia/fundo em tempo real. Construído com Tailwind CSS e JavaScript puro.

## Funcionalidades
- Apresentação de hinos no modo completo/compacto com navegação por slides
- Apresentação em tela cheia com imagens de fundo
- Modo de playlist aleatória (controles de Próximo/Parar no modo tela cheia)
- Reprodutor de áudio por hino
- Ajustes de tamanho de fonte, altura de linha e cor
- Overlay de configurações e atalhos de teclado
- PWA instalável com cache via Service Worker

## Estrutura do Projeto (alto nível)
- `index.html` – UI principal e carregador de scripts (carrega `hinos.js` e depois `script.js`)
- `script.js` – lógica do app (apresentação, playlist, handlers da interface)
- `hinos.js` – dados/conteúdo dos hinos
- `service-worker.js` – cache PWA
- `src/input.css` – fonte do Tailwind
- `dist/output.css` – CSS gerado pelo build do Tailwind
- `styles.css` – estilos adicionais
- `icons/` – ícones do app e favicon
- `js/` – jQuery e plugin de autocomplete

## Pré-requisitos
- Node.js 18+ e npm

## Install
```bash
npm install
```

## Desenvolvimento
Duas opções comuns:

1) Tailwind em modo watch + um servidor estático (recomendado por causa do Service Worker)
```bash
npm run dev
# Em outro terminal, sirva a pasta (exemplos):
# npx serve .
# ou
# python3 -m http.server 5173
```
Abra http://localhost:5173 (ou a porta que você escolher).

2) Abrir `index.html` diretamente no navegador (o comportamento do SW não será o mesmo).

## Build
```bash
npm run build
```
Gera o CSS compilado em `dist/output.css`.

## Deploy (Surge)
Este projeto inclui o script `surge.sh` que faz o build, prepara a pasta `deploy/` e publica no Surge.

- Scripts no `package.json`:
  - `predeploy`: faz o build e copia os arquivos para `deploy/`
  - `deploy:surge`: executa `bash surge.sh`

Execute:
```bash
npm run deploy:surge
```
O script irá:
- Fazer o build do Tailwind
- Copiar os arquivos necessários para `deploy/`
- Publicar no domínio configurado do Surge

## Cache Busting / Versionamento
O `index.html` inclui um indicador de versão no cabeçalho:
```html
<sup class="version" id="version">YY.M.D[.X]</sup>
```
- Os scripts são carregados com `?v=<versão>`, ajudando a invalidar o cache do Service Worker e do navegador.
- Após mudanças, atualize a versão e faça dois hard refreshes para garantir a atualização do SW.

## Atalhos de Teclado (resumo)
- Seta direita/esquerda ou swipe: avançar/voltar slide
- PageUp/PageDown: avançar/retroceder hino
- f: alternar fundo
- c: alternar modo compacto/completo
- +/-: aumentar/diminuir fonte
- Seta cima/baixo: ajustar altura da linha
- Alt+R: resetar configurações
- Esc: fechar overlay

## Contribuições / Issues / Solicitações
Use o repositório para contribuir, reportar problemas ou solicitar ajustes:
- https://github.com/ministerioquartoanjo/hinario/tree/main/hinario/pwa/README.md

## Observações
- O Service Worker pode manter assets antigos. Após deploys, faça dois hard refreshes para ativar o novo SW.
- O `hinos.js` carrega da cópia local primeiro e só faz fallback para a URL remota se a local falhar.
