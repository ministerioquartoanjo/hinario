# 🎵 Seletor de Vídeos de Hinos - Interface Frontend

Sistema web para selecionar manualmente vídeos do YouTube para cada hino do hinário.

## 🚀 Como Usar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar o Servidor
```bash
npm run selector:start
```

### 3. Acessar a Interface
Abra no navegador: http://localhost:3001/video_selector.html

## 📋 Funcionalidades

### 📖 Lista de Hinos
- **196 hinos** carregados do arquivo `hinos.js`
- **Busca instantânea** por título ou autor
- **Status visual**: 
  - 🟢 Verde = Com vídeos
  - ⚪ Cinza = Sem vídeos

### 🔍 Busca de Vídeos
- **Busca inteligente**: Título + Autor + "hinário"
- **Até 10 resultados** por busca
- **Web scraping** do YouTube (sem API key)

### 🎥 Seleção de Vídeos
- **Miniaturas** dos vídeos
- **Títulos descritivos**
- **Player embutido** para pré-visualização
- **Seleção visual** com ✅

### 💾 Salvamento
- **Salva automático** no arquivo `hinos.js`
- **Atualização instantânea** das estatísticas
- **Backup** automático do progresso

## 🎯 Fluxo de Trabalho

1. **Selecione um hino** na lista esquerda
2. **Clique em "Buscar Vídeos"** 
3. **Aguarde os resultados** (10-30 segundos)
4. **Visualize os vídeos** com thumbnails
5. **Clique em um vídeo** para pré-visualizar
6. **Assista no player** embutido
7. **Clique "Salvar Vídeo"** se gostar
8. **Repita** para o próximo hino

## 📊 Estatísticas em Tempo Real

- **Total de hinos**: 196
- **Com vídeos**: X/196
- **Sem vídeos**: Y/196  
- **Progresso**: Z%

## 🔧 Características Técnicas

### Frontend (HTML/JS/CSS)
- **Tailwind CSS** para estilização
- **JavaScript vanilla** (sem frameworks)
- **Responsive design** para mobile
- **Real-time updates** sem refresh

### Backend (Node.js/Express)
- **Express server** na porta 3001
- **Web scraping** do YouTube
- **JSDOM** para parsing HTML
- **File system** para salvar dados

### Busca de Vídeos
- **Múltiplas estratégias** de busca
- **Extração de thumbnails**
- **Títulos limpos** e formatados
- **Dedução automática** de duplicados

## 🎨 Interface

### Layout Responsivo
- **Desktop**: 3 colunas (lista | seleção | preview)
- **Mobile**: 1 coluna empilhada
- **Tablet**: 2 colunas adaptativas

### Cores e Ícones
- **Azul** para ações principais
- **Verde** para sucessos
- **Vermelho** para remoções
- **Cinza** para neutros

### Animações
- **Hover effects** suaves
- **Transições** de 0.3s
- **Loading spinner** animado
- **Progress bar** suave

## 🛠️ API Endpoints

### GET /api/hymns
Retorna todos os hinos do arquivo `hinos.js`

```json
{
  "hymns": [...]
}
```

### POST /api/search-videos
Busca vídeos no YouTube

```json
{
  "query": "A Ceia do Senhor hinário"
}
```

Response:
```json
{
  "videos": [
    {
      "videoId": "abc123",
      "title": "Título do Vídeo",
      "thumbnail": "https://...",
      "url": "https://youtu.be/abc123"
    }
  ]
}
```

### POST /api/save-hymns
Salva todos os hinos no arquivo

```json
{
  "hymns": [...]
}
```

## 🔍 Estratégias de Busca

O sistema usa múltiplas consultas para cada hino:

1. **Título completo**: "1 - A Ceia do Senhor hinário"
2. **Título sem número**: "A Ceia do Senhor hinário"  
3. **Título + autor**: "A Ceia do Senhor Philip Paul Bliss hinário"

## ⚡ Performance

### Otimizações
- **Lazy loading** dos vídeos
- **Debouncing** na busca
- **Caching** de resultados
- **Pagination** implícita (10 resultados)

### Limites
- **10 vídeos** por busca
- **30 segundos** timeout por requisição
- **196 hinos** no total
- **1 requisição** por vez

## 🚨 Troubleshooting

### Problemas Comuns

**Servidor não inicia:**
```bash
# Verifique se a porta 3001 está livre
lsof -i :3001
# Mate processos se necessário
kill -9 <PID>
```

**Busca não retorna vídeos:**
- Verifique conexão com internet
- Tente termos de busca diferentes
- YouTube pode estar bloqueando requisições

**Vídeo não reproduz:**
- Verifique se o vídeo está público
- Alguns vídeos podem ter restrições
- Tente abrir em nova aba

### Logs de Erro
O servidor mostra logs detalhados no console:
- ✅ Buscas bem-sucedidas
- ❌ Erros de requisição  
- ⚠️ Avisos de parsing

## 📱 Mobile Support

### Funcionalidades Mobile
- **Touch friendly** buttons
- **Swipe gestures** na lista
- **Fullscreen video** player
- **Responsive typography**

### Limitações
- **Player smaller** em telas pequenas
- **Scroll horizontal** necessário às vezes
- **Keyboard** pode cobrir conteúdo

## 🔮 Futuras Melhorias

### Planejado
- [ ] **Filtros avançados** (duração, data)
- [ ] **Batch selection** (múltiplos hinos)
- [ ] **Import/Export** de seleções
- [ ] **Dark mode** toggle
- [ ] **Keyboard shortcuts**
- [ ] **Drag & drop** reordering

### Sugestões
- [ ] **Quality selector** para vídeos
- [ ] **Playlist mode** contínua
- [ ] **Notes field** por hino
- [ ] **Share links** customizados

## 📞 Suporte

Se tiver problemas:
1. **Verifique o console** do navegador
2. **Olhe os logs** do servidor
3. **Teste com outro hino**
4. **Reinicie o servidor**

---

**Criado por**: Ministério Quarto Anjo  
**Versão**: 1.0.0  
**Última atualização**: 2026
