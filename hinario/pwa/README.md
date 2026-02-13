# Hinário MQAAF PWA

Este é um Web App Progressivo (PWA) de alta performance e estética premium para apresentação de hinos em reuniões, cultos e estudo individual.

## 🚀 Tecnologias
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), jQuery
- **PWA**: Manifest.json, Service Worker para suporte offline
- **Build Tool**: Vite para desenvolvimento rápido e bundling otimizado
- **Icons**: Font Awesome 5.15.3
- **Fonts**: Google Fonts (Inter, Roboto, Montserrat, etc.)

## ✨ Funcionalidades
- **Busca Inteligente**: Autocomplete dinâmico por número, título ou letra.
- **Modos de Apresentação**: Alternância entre slides individuais e modo completo com rolagem.
- **Sincronização Remota**: Controle a apresentação de outro dispositivo.
- **Player de Áudio**: Reprodução com ajuste de velocidade e playlist automática.
- **Personalização Total**: Controle de fontes, cores, altura de linha e temas (Dark/Light).
- **Zoom em Palavras**: Pressione Shift e passe o mouse no modo completo para zoom instantâneo.
- **Integração de Vídeos**: Adicione e gerencie vídeos do YouTube relacionados aos hinos.

## 📦 Instalação e Uso
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Para produzir o bundle final:
   ```bash
   npm run build
   ```

## 📱 Controle Remoto
Abra o menu ou clique no ícone de celular para abrir a interface de controle remoto. Ela sincroniza ações como troca de slides, hinos e player de áudio em tempo real com a janela principal via `BroadcastChannel`.

---
Desenvolvido com foco na simplicidade e excelência visual.
