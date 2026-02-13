# Projeto Hinário MQAAF PWA - Documentação de Features

## Visão Geral
O **Hinário MQAAF PWA** é uma aplicação web progressiva desenvolvida para apresentação de hinos em reuniões e cultos. Trata-se de um sistema completo com funcionalidades avançadas de apresentação, controle de áudio, personalização visual e gerenciamento de conteúdo multimídia. Mas também para ser usado direto no smartphones.

## Features Principais

### 1. Apresentação de Hinos
- **Seleção de Hinos**: Campo de busca com autocomplete dinâmico powered by jQuery autocomplete, permitindo busca por número, título ou palavras-chave
- **Modo de Apresentação**: Exibição em slides separando versículos e refrões com navegação individual
- **Modo Completo**: Checkbox "Completo" para exibir o hino inteiro em uma única tela com rolagem
- **Apresentação em Tela Cheia**: Modo fullscreen com overlay preto e otimizações para projeção
- **Contador de Slides**: Indicador "X/Y" no canto inferior direito mostrando progresso
- **Navegação Suave**: Transições animadas entre slides com feedback visual
- **Zoom em Palavras**: Funcionalidade Shift+hover para zoom em palavras específicas (modo completo)

### 2. Controle de Áudio
- **Player de Áudio Integrado**: Elemento HTML5 audio com controles nativos e customização
- **Controles de Play/Pause**: Controle padrão de reprodução com feedback visual
- **Indicador de Carregamento**: Spinner animado com texto "Carregando áudio..." durante buffer
- **Controle de Velocidade**: Botões 🐰/🐌 em tela cheia para ajuste de velocidade (0.5x a 2.0x)
- **Controles em Tela Cheia**: Botões ▶/⏹/⏮ para play, stop e restart no modo apresentação
- **Sincronização Automática**: Áudio carregado automaticamente ao selecionar hino
- **Fallback Remoto**: Sistema de fallback para carregar áudios de servidor remoto se local falhar

### 3. Personalização Visual
- **Controle de Tamanho de Fonte**: Botões +/- com display em tempo real (ex: "1rem")
- **Controle de Altura de Linha**: Ajuste de espaçamento com display numérico (ex: "1.0")
- **Seletor de Fontes**: 19 opções incluindo Arial, Roboto, Open Sans, Lato, Montserrat, Poppins, Lora, Merriweather, Raleway, Oswald, Ubuntu, Dancing Script, Playfair Display, Source Sans Pro, Noto Sans
- **Controle de Cor da Fonte**: Input type="color" com valor padrão #FFFFFF
- **Alternância de Fundo**: Botão "Alternar" para trocar entre fundo sólido e imagens
- **Suporte a Modo Escuro**: Classes CSS dark:bg-gray-900 e dark:text-white
- **Opacidade de Fundo**: Imagens com 85% de opacidade para melhor legibilidade
- **Persistência de Configurações**: Salva preferências no localStorage

### 4. Navegação e Controles
- **Navegação por Teclado**: Atalhos para todas as funções principais com suporte a múltiplas combinações
- **Navegação por Gestos**: Suporte a swipe/touch para dispositivos móveis com eventos touch
- **Botões de Navegação**: Botões "Anterior"/"Próximo" com estilo orange-dark e hover effects
- **Hino Aleatório**: Ícone 🎲 (fas fa-random) para seleção aleatória de hinos
- **Limpeza de Seleção**: Ícone ❌ (fas fa-times) para limpar campo de busca
- **Navegação por PageUp/PageDown**: Avança/retrocede entre hinos diferentes
- **Setas Direcionais**: Navegação entre slides e ajuste de altura de linha

### 5. Playlist e Reprodução Automática
- **Modo Playlist**: Reprodução automática sequencial de hinos com temporização configurável
- **Playlist Aleatória**: Ícone 🎲 (fas fa-random) para execução aleatória dos hinos disponíveis
- **Controle de Playlist**: Ícones 🎵/⏹ (fas fa-random/fas fa-stop) para iniciar/parar
- **Navegação entre Hinos**: Botão "Próximo Hino" (fas fa-step-forward) em tela cheia
- **Indicadores Visuais**: Ícones mudam de estado para mostrar playlist ativa
- **Transição Suave**: Animações entre hinos da playlist
- **Loop Contínuo**: Reinicia automaticamente ao final da lista

### 6. Gestão de Vídeos
- **Seção de Vídeos**: Painel expansível com ícone 📹 (fas fa-video) para vídeos relacionados
- **Adição de Vídeos Personalizados**: Input de URL YouTube com validação e preview
- **Gerenciamento de Vídeos**: Modal com lista de vídeos personalizados e opção de remoção
- **Busca Automática**: Sistema que busca vídeos relacionados ao hino atual
- **Integração YouTube**: Suporte a URLs youtu.be e youtube.com/watch
- **Lista Dinâmica**: Videos populados automaticamente com base no hino selecionado
- **Controle de Exibição**: Botão "Adicionar" com ícone ➕ e estilo blue-600

### 7. Controle Remoto
- **Controle Remoto de Hinos**: Ícone 📱 (fas fa-mobile-alt) para abrir interface remota
- **Interface Separada**: Arquivo `remote-control.html` com controles dedicados
- **Navegação Remota**: Controle de slides e hinos à distância via WebSocket/sincronização
- **Sincronização em Tempo Real**: Sincronização entre dispositivos para controle remoto
- **Controle Completo**: Acesso a todas as funcionalidades principais remotamente
- **Design Responsivo**: Interface otimizada para dispositivos móveis de controle

### 8. Menu e Funcionalidades Adicionais
- **Menu Principal**: Dropdown com ícone 📋 (fas fa-bars) no cabeçalho
- **Informações do App**: Ícone ℹ️ (fas fa-info-circle) com overlay de atalhos e descrição
- **Download de MP3s**: Ícone ⬇️ (fas fa-download) para baixar todos os áudios
- **Barra de Progresso**: Indicador visual de progresso durante downloads
- **Links para GitHub**: Direcionamento para repositório e issues
- **Overlay Informativo**: Modal com lista completa de atalhos e funcionalidades
- **Versão da Aplicação**: Display da versão atual (ex: 25.12.10.1)

### 9. Interface Responsiva
- **Design Mobile-First**: Interface adaptável com breakpoints md: e lg:
- **Menu Mobile**: Menu oculto com controles específicos para dispositivos móveis
- **Controles Otimizados**: Botões com padding ajustado para touch (p-2)
- **Viewport Otimizado**: Meta tags viewport-fit=cover e user-scalable=no
- **Layout Flexbox**: Estrutura flex com gap-4 e max-w-4xl responsivo
- **Tamanhos Adaptativos**: Textos com tamanhos diferentes (text-3xl md:text-5xl)
- **Grid Responsivo**: Organização flex-col md:flex-row para controles
- **Icones Escaláveis**: Transform scale-50 md:scale-100 para diferentes telas

### 10. Funcionalidades PWA
- **Service Worker**: Registro automático com fallback para erros
- **Manifest.json**: Configuração completa com name, short_name, icons, theme_color
- **Ícones Adaptativos**: Múltiplos tamanhos (72x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512)
- **Cache Inteligente**: Armazenamento de recursos estáticos para acesso offline
- **Instalação Nativa**: Suporte a apple-mobile-web-app-capable e mobile-web-app-capable
- **Cross-Origin**: Configuração crossorigin="use-credentials" para credenciais
- **Fallback Remoto**: Sistema de carregamento de recursos de GitHub como backup
- **Atualização Dinâmica**: Versionamento automático de recursos com ?v=timestamp

### 11. Acessibilidade e Usabilidade
- **Atalhos de Teclado**: Diversos atalhos para funções principais com documentação completa
  - `Setas direita/esquerda`: Navegação entre slides
  - `PageUp/PageDown`: Avança/Retrocede Hino
  - `f`: Alternar fundo
  - `c`: Intercala modo completo/normal
  - `+/-`: Aumentar/diminuir fonte
  - `Setas cima/baixo`: Alterar altura da linha
  - `Alt+R`: Resetar configurações
  - `Escape`: Fechar overlay
- **Feedback Visual**: Indicadores de carregamento, status e progresso
- **Tooltips**: Atributos title e aria-label em todos os botões
- **ARIA Labels**: aria-label para acessibilidade em leitores de tela
- **Contraste**: Cores com bom contraste para modo claro/escuro
- **Navegação por Tab**: Ordem lógica de tabulação entre elementos
- **Focus Management**: Indicadores visuais de foco em elementos interativos

### 12. Slides de Fundo
- **Imagens de Fundo**: Galerias de imagens Unsplash com URLs dinâmicas
- **Controle de Opacidade**: CSS com opacity: 0.85 para melhor legibilidade
- **Alternância Automática**: Botão para trocar entre fundo sólido e imagens
- **Modo Apresentação**: Exibição otimizada com object-cover e w-full h-full
- **Imagens Responsivas**: URLs com parâmetros auto=format&fit=crop&w=1920&q=80
- **Background Fixo**: Posicionamento absolute com z-index controlado
- **Transições Suaves**: Animações CSS para mudança de fundo
- **Fallback Visual**: Fundo cinza escuro como fallback quando imagens falham

## Estrutura Técnica

### Arquitetura do Frontend

#### Estrutura HTML Principal
- **HTML5 Semântico**: Estrutura com `<header>`, `<main>`, `<section>` e tags acessíveis
- **Meta Tags Otimizadas**: Viewport configurado para mobile-first, PWA capabilities
- **Progressive Enhancement**: Funcionalidade básica garantida sem JavaScript
- **Formulários Acessíveis**: Labels, ARIA attributes e navegação por teclado

#### Componentes UI Principais
- **Cabeçalho Dinâmico**: Título com versão, ícones de funcionalidades e menu dropdown
- **Painel de Controles**: Seção central com busca, configurações e player de áudio
- **Container de Preview**: Área de visualização de slides com background e navegação
- **Modal de Vídeos**: Interface para gerenciamento de vídeos do YouTube
- **Overlay Informativo**: Modal com atalhos e informações do aplicativo

#### Sistema de Layout
- **Flexbox/Grid**: Layout responsivo com `flex`, `grid` e `gap` system
- **Breakpoints**: Mobile-first com `sm:`, `md:`, `lg:` para responsividade
- **Container Centralizado**: `max-w-4xl mx-auto` para conteúdo principal
- **Espaçamento Consistente**: Sistema `p-4`, `gap-4`, `mb-4` para spacing

#### Sistema de Cores e Temas
- **Cores Primárias**: `orange-dark` (#ea580c) para branding principal
- **Modo Escuro**: Classes `dark:bg-gray-900`, `dark:text-white` automático
- **Cores de Estado**: `bg-blue-600`, `bg-green-600`, `bg-red-600` para feedback
- **Contraste WCAG**: Cores testadas para acessibilidade

#### Tipografia
- **Font System**: 19 fontes do Google Fonts com `display=swap`
- **Tamanhos Responsivos**: `text-3xl md:text-5xl` para headings principais
- **Altura de Linha**: Controle dinâmico com CSS custom properties
- **Pesos de Fonte**: `font-bold`, `font-semibold` para hierarquia visual

#### Sistema de Ícones
- **Font Awesome 5.15.3**: Ícones vetoriais com classes `fas`, `far`
- **Ícones Contextuais**: Cada funcionalidade com ícone específico e tooltip
- **Ícones Animados**: `fa-spin` para loading, transições suaves
- **Icon Scaling**: `scale-50 md:scale-100` para diferentes telas

#### Componentes Interativos
- **Botões com Estados**: `hover:`, `focus:`, `transition-colors` para feedback
- **Inputs Personalizados**: Estilo customizado para campos de formulário
- **Dropdown Menus**: Menu suspenso com animações e posicionamento
- **Cards e Panels**: `bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg`

#### Sistema de Navegação
- **Menu Principal**: Dropdown com ícone `fas fa-bars`
- **Menu Mobile**: Controles específicos para dispositivos móveis
- **Breadcrumbs**: Navegação estrutural implícita
- **Tab Navigation**: Ordem lógica de navegação por teclado

#### Feedback Visual e Microinterações
- **Loading States**: Spinners com `fa-spin` e mensagens de status
- **Hover Effects**: Transições suaves em todos elementos interativos
- **Focus Indicators**: Indicadores visuais claros para acessibilidade
- **Progress Bars**: Barras de progresso para downloads e operações

#### Sistema de Formulários
- **Campo de Busca**: Input com autocomplete e botões de ação
- **Select Customizado**: Dropdown de fontes com styling consistente
- **Color Picker**: Input type="color" para personalização
- **Checkboxes Estilizados**: Checkbox container com labels customizados

#### Layout de Apresentação
- **Slide Container**: `relative w-full h-[400px] md:h-[500px]` para slides
- **Fullscreen Mode**: `fixed inset-0 bg-black` para apresentação
- **Background Layers**: Sistema de camadas com z-index controlado
- **Content Overlay**: `bg-black bg-opacity-50` para legibilidade

#### Componentes de Áudio
- **Player HTML5**: Elemento `<audio>` com controles customizados
- **Loading Overlay**: Indicador de carregamento com spinner
- **Controles Customizados**: Botões de play/pause/stop em tela cheia
- **Speed Controls**: Botões 🐰/🐌 para ajuste de velocidade

#### Sistema de Grid e Cards
- **Video Cards**: Estrutura para exibição de vídeos relacionados
- **List Items**: `space-y-2` para listagem consistente
- **Modal Structure**: `fixed inset-0 bg-black bg-opacity-50` para overlays
- **Responsive Grid**: `grid-cols-1 md:grid-cols-2` para layouts

#### Animações e Transições
- **CSS Transitions**: `transition-colors`, `transition-transform` para suavidade
- **Keyframe Animations**: Animações customizadas para loading
- **Transform Effects**: `scale`, `translate` para interações
- **Opacity Changes**: Transições de opacidade para fades

#### Sistema de Z-Index
- **Modal Layer**: `z-50` para overlays principais
- **Drawer System**: `z-[60]`, `z-[1100]` para componentes flutuantes
- **Content Layers**: `z-10`, `z-20` para conteúdo estruturado
- **Fixed Elements**: `fixed` positioning para headers e controles

### Tecnologias Utilizadas
- **HTML5**: Estrutura semântica moderna com tags header, main, section
- **CSS3**: Estilização com Tailwind CSS (classes utilitárias) e CSS customizado
- **JavaScript ES6+**: Lógica da aplicação com async/await, arrow functions, destructuring
- **jQuery 3.x**: Biblioteca para manipulação DOM, eventos e plugin autocomplete
- **Font Awesome 5.15.3**: Ícones vetoriais da interface (fas, far classes)
- **Google Fonts**: 19 fontes via CDN com display=swap para performance
- **Tailwind CSS**: Framework CSS com configuração customizada em tailwind.config.js
- **PostCSS**: Processamento CSS com otimizações automáticas
- **Autocomplete Plugin**: Plugin jQuery para busca dinâmica de hinos

### Arquivos Principais
- `index.html`: Interface principal com estrutura completa da aplicação (445 linhas)
- `script.js`: Lógica principal da aplicação com eventos, controles e gerenciamento de estado
- `hinos.js`: Base de dados dos hinos em formato JavaScript (230KB+) https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/main/hinario/pwa/hinos.js
- `styles.css`: Estilos personalizados complementares ao Tailwind (8KB+)
- `service-worker.js`: Funcionalidade offline com cache strategy (4KB)
- `manifest.json`: Configuração PWA com ícones e metadados
- `remote-control.html`: Interface dedicada para controle remoto (46KB)
- `package.json`: Dependências npm e scripts de build
- `tailwind.config.js`: Configuração customizada do Tailwind CSS
- `postcss.config.js`: Configuração de processamento CSS

### Funcionalidades Avançadas
- **Autocomplete Inteligente**: Sistema de busca com jQuery autocomplete para hinos
- **Lazy Loading**: Carregamento dinâmico de scripts e recursos sob demanda
- **Error Handling**: Tratamento robusto de erros com try-catch e fallbacks
- **Cross-browser Compatibility**: Shim para eventos 'unload' → 'pagehide' (Chrome compliance)
- **Performance Optimization**: Otimizações com debounce, throttle e cache
- **Modular JavaScript**: Carregamento encadeado de scripts com Promise-based loading
- **State Management**: Gerenciamento de estado com localStorage e sessionStorage
- **Event Delegation**: Otimização de eventos com delegation patterns
- **Memory Management**: Cleanup de event listeners e prevenção de memory leaks

## Casos de Uso

### Para Apresentações em Reuniões
- **Seleção rápida de hinos**: Campo de busca com autocomplete para encontrar hinos em segundos
- **Controle profissional de apresentação**: Modo slides com navegação suave e contador
- **Modo fullscreen para projeção**: Tela cheia otimizada para projetores e telas grandes
- **Controle de áudio integrado**: Play/pause sincronizado com apresentação
- **Playlist automática**: Reprodução sequencial para momentos específicos do culto
- **Controle remoto**: Operação à distância com dispositivo móvel
- **Personalização visual**: Ajuste de fontes e cores para visibilidade na projeção
- **Gestos touch**: Navegação intuitiva em tablets durante apresentação

### Para Estudo Individual
- **Busca e navegação fácil**: Autocomplete para encontrar hinos por número ou título
- **Personalização de visualização**: Ajuste de fonte, cores e espaçamento para leitura confortável
- **Acesso offline aos hinos**: Funcionalidade PWA para estudo sem conexão
- **Reprodução de áudio para aprendizagem**: Player com controle de velocidade
- **Modo completo**: Visualização integral do hino para estudo detalhado
- **Zoom em palavras**: Funcionalidade para focar em partes específicas
- **Vídeos relacionados**: Acesso a versões em vídeo para aprendizado visual
- **Favoritos e playlist**: Criação de listas personalizadas de estudo

### Para Músicos e Líderes de Louvor
- **Playlist automática**: Reprodução sequencial para ensaios e momentos específicos
- **Controle remoto**: Operação enquanto toca instrumentos ou lidera
- **Vídeos relacionados**: Acesso a diferentes versões e arranjos
- **Download de conteúdo para uso offline**: MP3s e hinos disponíveis offline
- **Velocidade de reprodução**: Ajuste para estudo de melodia e ritmo
- **Modo completo**: Visualização integral para acompanhamento detalhado
- **Transposição**: Facilidade para acompanhar diferentes tonalidades
- **Análise de estrutura**: Separação clara de versículos e refrões

## Manutenção e Extensibilidade

O projeto foi desenvolvido com arquitetura modular que permite:

### Facilidade de Manutenção
- **Código Modular**: Separação clara entre HTML, CSS e JavaScript
- **Configuração Centralizada**: Arquivos de configuração (package.json, tailwind.config.js)
- **Versionamento**: Sistema de versionamento automático de recursos
- **Documentação**: READMEs detalhados para diferentes funcionalidades
- **Logs e Debug**: Sistema de logging para troubleshooting

### Extensão de Funcionalidades
- **Plugin System**: Arquitetura que permite adição de novos plugins
- **API Flexível**: Interfaces bem definidas para integração de novas features
- **Componentização**: Estrutura de componentes reutilizáveis
- **Event-Driven**: Sistema de eventos para comunicação entre módulos

### Adição de Novos Hinos
- **Formato Padronizado**: Estrutura JSON clara para adição de hinos
- **Validação Automática**: Sistema de validação de dados dos hinos
- **Importação em Lote**: Suporte a importação de múltiplos hinos
- **Versionamento de Conteúdo**: Controle de versões da base de hinos

### Atualizações Incrementais
- **Service Worker Updates**: Atualizações automáticas de cache
- **Rollback System**: Capacidade de reverter alterações
- **A/B Testing**: Sistema para testar novas funcionalidades
- **Gradual Rollout**: Implementação progressiva de mudanças

### Performance e Escalabilidade
- **Lazy Loading**: Carregamento sob demanda de recursos
- **Cache Strategy**: Estratégias inteligentes de cache
- **Bundle Optimization**: Otimização de bundles JavaScript
- **Image Optimization**: Otimização automática de imagens

### Segurança e Robustez
- **Input Validation**: Validação rigorosa de entradas do usuário
- **XSS Protection**: Proteção contra cross-site scripting
- **CSP Headers**: Content Security Policy implementado
- **Error Boundaries**: Tratamento robusto de erros

---

**Versão Atual**: 25.12.10.1  
**Repositório**: https://github.com/ministerioquartoanjo/hinario/tree/main/hinario/pwa  
**Licença**: Projeto open source para uso em comunidades religiosas  
**Última Atualização**: Sistema de CI/CD com deploy automático  
**Documentação Complementar**: README_SELECTOR.md, README_VIDEOS.md, README_WEB_SCRAPING.md
