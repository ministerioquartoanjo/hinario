# Sistema de Busca de Vídeos de Hinos

Este sistema automatiza a busca de vídeos no YouTube para todos os hinos do hinário, verificando se as letras correspondem exatamente.

## Configuração

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Obter chave da API do YouTube:**
   - Acesse: https://console.developers.google.com/
   - Crie um novo projeto ou selecione um existente
   - Ative a "YouTube Data API v3"
   - Crie uma chave de API (Credentials)
   - Copie a chave

3. **Configurar variável de ambiente:**
   ```bash
   export YOUTUBE_API_KEY="sua_chave_aqui"
   # Ou crie um arquivo .env (não commitado):
   echo "YOUTUBE_API_KEY=sua_chave_aqui" > .env
   ```

## Uso

### Testar com um hino específico
```bash
npm run videos:test 0    # Testa o primeiro hino
npm run videos:test 5    # Testa o sexto hino
```

### Processar todos os 196 hinos
```bash
npm run videos:process
```

## Como funciona

1. **Extração de frases-chave:** O sistema analisa as letras de cada hino e extrai as frases mais significativas para busca.

2. **Busca no YouTube:** Realiza múltiplas consultas usando:
   - Título do hino + "hinário letra"
   - Frases-chave + "hinário"
   - Frases-chave + "hino cristão"

3. **Verificação de legendas:** Para cada vídeo encontrado:
   - Baixa as legendas em português (se disponíveis)
   - Compara o texto das legendas com as letras do hino
   - Calcula percentual de correspondência
   - Apenas vídeos com ≥30% de correspondência são aprovados

4. **Atualização do arquivo:** Os URLs válidos são adicionados ao array `videos` de cada hino.

## Resultados

- **hinos_updated.js:** Arquivo atualizado com os vídeos encontrados
- **video_search_report.txt:** Relatório detalhado do processamento

## Limitações

- Apenas vídeos com legendas em português são considerados
- Limite de requisições da API YouTube (10.000 por dia)
- Alguns hinos podem não ter vídeos disponíveis com letras correspondentes

## Exemplo de saída

```
Processando hino 1: 1 - A Ceia do Senhor
Frases-chave para busca: [
  "Como irmãos nos acheguemos ao festim do Salvador",
  "Esta é a Santa Ceia memorial do eterno amor",
  "Os emblemas que hoje temos simbolizam redenção"
]

Encontrados 5 vídeos:

1. HINO 1 - A CEIA DO SENHOR - COM LETRA
   URL: https://youtu.be/abc123
   Verificação: Correspondência de 85.2%

2. A Ceia do Senhor - Hinário
   URL: https://youtu.be/def456
   Verificação: Correspondência de 12.1%
```

## Segurança

Nunca commit o arquivo `.env` com sua chave de API. Use `.env.example` como template.
