# Hinário MQAAF PWA

Aplicação web progressiva para apresentação de hinos em reuniões, cultos e estudo individual. O projeto inclui uma interface principal e uma página de controle remoto, ambas geradas pelo Vite.

## Tecnologias

- **Frontend:** HTML5, Tailwind CSS, JavaScript ES Modules e jQuery
- **Build:** Vite
- **PWA:** Manifest e Service Worker para uso offline
- **Integração OBS:** `obs-websocket-js`
- **Ícones e fontes:** Font Awesome 5.15.3 e Google Fonts
- **Hospedagem:** Cloudflare Pages

## Funcionalidades

- Busca de hinos por número, título ou trecho da letra
- Apresentação em slides ou em modo completo com rolagem
- Player de áudio com controle de velocidade, filtros e playlist automática
- Personalização de fontes, cores, altura de linha, plano de fundo e tema claro/escuro
- Zoom de palavras no modo completo ao pressionar `Shift`
- Inclusão e gerenciamento de vídeos do YouTube relacionados aos hinos
- Controle remoto para navegação, áudio, playlist, aparência e configurações do OBS
- Integração com o OBS via WebSocket para controlar a fonte configurada

## Requisitos

- Node.js compatível com Vite 7
- npm

Para usar a integração com OBS, o OBS WebSocket deve estar habilitado e acessível no endereço configurado pela aplicação. Por padrão, ela tenta se conectar a `localhost:4455`.

## Instalação e uso

Execute os comandos a partir deste diretório (`app-pwa/`).

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

3. Gere o bundle de produção em `dist/`:

   ```bash
   npm run build
   ```

4. Visualize localmente o bundle gerado:

   ```bash
   npm run preview
   ```

## Controle remoto

A interface de controle remoto é gerada em `remote-control.html`. Abra-a a partir da aplicação ou pelo mesmo endereço de origem da página principal, por exemplo `http://localhost:5173/remote-control.html` durante o desenvolvimento.

A sincronização entre a página principal e o controle usa `BroadcastChannel`, portanto funciona entre contextos do navegador na mesma origem. Há também uma ponte por `postMessage` para janelas que possuam relação de abertura ou incorporação; ela não oferece controle genérico entre dispositivos independentes.

## Publicação

Para gerar o bundle e publicá-lo no Cloudflare Pages configurado:

```bash
npm run deploy
```

O projeto está configurado para publicar o diretório `dist/` no projeto Cloudflare Pages `hinariopwa`.
