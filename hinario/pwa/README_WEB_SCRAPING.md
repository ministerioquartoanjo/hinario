# Sistema de Busca de Vídeos de Hinos (Web Scraping)

Este sistema busca vídeos no YouTube usando web scraping, sem necessidade de API key.

## Configuração

1. **Instalar dependências:**
   ```bash
   npm install
   ```

## Uso

### Testar com um hino específico
```bash
npm run videos:test-web 0    # Testa o primeiro hino
npm run videos:test-web 5    # Testa o sexto hino
```

### Processar todos os 196 hinos
```bash
npm run videos:process-web
```

## Como funciona

### 1. Busca no YouTube via Web Scraping
- Acessa a página de resultados do YouTube
- Extrai links de vídeos diretamente do HTML
- Não requer API key

### 2. Busca em Sites Alternativos
- Hinário.com.br
- Letras.mus.br
- Outros sites de hinos cristãos

### 3. Verificação Simplificada
Como não temos acesso à API de legendas, a verificação usa:
- Análise do título e descrição do vídeo
- Detecção de menções a "letra" ou "legenda"
- Correspondência de palavras-chave (mínimo 20%)

### 4. Estratégias de Busca
Para cada hino, o sistema busca:
- `"Título do Hino" hinário letra`
- `"Título do Hino" hino cristão`
- Frases-chave das letras + "hinário"

## Características

### ✅ Vantagens
- Não precisa de API key do YouTube
- Gratuito e ilimitado
- Busca em múltiplas fontes
- Salva progresso automaticamente

### ⚠️ Limitações
- Verificação menos precisa (sem acesso direto às legendas)
- Pode ser bloqueado pelo YouTube (uso excessivo)
- Mais lento que a API
- Requer delays entre requisições

## Segurança e Boas Práticas

### Rate Limiting
- 2 segundos de delay entre buscas
- 3 segundos entre verificações
- Limita a 10 resultados por busca

### Tratamento de Erros
- Timeout de 10 segundos por requisição
- Tratamento de HTTP errors
- Continua mesmo se alguns sites falharem

## Arquivos Gerados

- **hinos_updated.js** - Arquivo final com vídeos
- **hinos_progress.js** - Backup automático a cada 10 hinos
- **video_search_report.txt** - Relatório detalhado

## Exemplo de Saída

```
1/196 - 1 - A Ceia do Senhor
Frases-chave: Como irmãos nos acheguemos ao festim do Salvador | Esta é a Santa Ceia memorial do eterno amor
  Buscando: "1 - A Ceia do Senhor" hinário letra
  Encontrados 5 vídeos únicos
    Verificando 1: HINO 1 - A CEIA DO SENHOR - COM LETRA...
      ✓ Correspondência de 45.2% com legendas
    Verificando 2: A Ceia do Senhor - Hinário...
      ✗ Correspondência baixa: 15.3%
  ✓ Adicionados 1 vídeos
```

## Solução de Problemas

### Se o YouTube bloquear as requisições:
1. Aumente os delays no código
2. Use VPN se necessário
3. Execute em horários de menor tráfego

### Se não encontrar vídeos:
1. Verifique a conexão com a internet
2. Tente com um hino diferente
3. Analise o relatório para ver padrões

## Comparação: API vs Web Scraping

| Característica | API YouTube | Web Scraping |
|---------------|------------|--------------|
| Custo | Pago (quota gratuita) | Gratuito |
| Precisão | Alta (acesso direto) | Média (análise indireta) |
| Velocidade | Rápida | Lenta |
| Confiabilidade | Alta | Média |
| Limites | 10.000 req/dia | Ilimitado (com cuidado) |
| Setup | Requer API key | Apenas npm install |

## Recomendações

1. **Teste primeiro**: Use `npm run videos:test-web 0` para testar
2. **Monitore**: Observe os logs para identificar problemas
3. **Backup**: O sistema salva progresso automaticamente
4. **Paciência**: Processar 196 hinos pode levar horas

## Estatísticas Finais

Ao final, o sistema mostra:
- Total de hinos processados
- Hinos com vídeos encontrados
- Taxa de sucesso
- Total de vídeos adicionados
