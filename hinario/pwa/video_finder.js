const fs = require('fs');
const { google } = require('googleapis');

// Configuração da API do YouTube
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY // Você precisará definir esta variável de ambiente
});

// Função para extrair frases-chave da letra do hino
function extractKeyPhrases(verses, coro = null) {
    const allLines = [];
    
    // Adiciona os versos
    verses.forEach(verse => {
        verse.forEach(line => {
            // Remove números e pontuação, mantém palavras significativas
            const cleanLine = line.replace(/^\d+\.\s*/, '') // Remove número do verso
                                .replace(/[.,;:!?]/g, '') // Remove pontuação
                                .trim();
            if (cleanLine.length > 5) { // Apenas linhas com conteúdo significativo
                allLines.push(cleanLine);
            }
        });
    });
    
    // Adiciona o coro se existir
    if (coro) {
        coro.forEach(line => {
            const cleanLine = line.replace(/[.,;:!?]/g, '').trim();
            if (cleanLine.length > 5) {
                allLines.push(cleanLine);
            }
        });
    }
    
    // Pega as frases mais longas e únicas para busca
    return [...new Set(allLines)]
        .filter(line => line.length > 10)
        .slice(0, 3); // Pega as 3 frases mais longas
}

// Função para buscar vídeos no YouTube
async function searchVideosByLyrics(hymnTitle, keyPhrases) {
    const searchQueries = [];
    
    // Cria várias consultas de busca
    searchQueries.push(`"${hymnTitle}" hinário letra`);
    
    keyPhrases.forEach(phrase => {
        if (phrase.length > 15) {
            searchQueries.push(`"${phrase}" hinário`);
            searchQueries.push(`"${phrase}" hino cristão`);
        }
    });
    
    const videoResults = [];
    
    for (const query of searchQueries.slice(0, 3)) { // Limita a 3 buscas por hino
        try {
            const response = await youtube.search.list({
                part: 'snippet',
                q: query,
                type: 'video',
                videoCaption: 'closedCaption', // Apenas vídeos com legenda
                maxResults: 5,
                relevanceLanguage: 'pt',
                order: 'relevance'
            });
            
            response.data.items.forEach(item => {
                videoResults.push({
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    url: `https://youtu.be/${item.id.videoId}`
                });
            });
            
        } catch (error) {
            console.log(`Erro na busca por "${query}":`, error.message);
        }
    }
    
    return videoResults;
}

// Função para verificar correspondência das letras
async function verifyLyricsMatch(videoId, expectedLyrics) {
    try {
        // Tenta obter a transcrição do vídeo
        const response = await youtube.captions.list({
            part: 'snippet',
            videoId: videoId
        });
        
        const captions = response.data.items;
        if (captions.length === 0) {
            return { match: false, reason: 'Sem legendas disponíveis' };
        }
        
        // Pega a legenda em português se disponível
        const ptCaption = captions.find(c => c.snippet.language === 'pt' || c.snippet.language === 'pt-BR');
        if (!ptCaption) {
            return { match: false, reason: 'Sem legendas em português' };
        }
        
        // Baixa o conteúdo da legenda
        const captionContent = await youtube.captions.download({
            id: ptCaption.id,
            tfmt: 'srt' // Formato SRT para legenda
        });
        
        // Converte para texto e verifica correspondência
        const captionText = captionContent.data.toLowerCase();
        const expectedText = expectedLyrics.join(' ').toLowerCase();
        
        // Verifica se pelo menos 30% do texto esperado está na legenda
        const matchWords = expectedText.split(' ').filter(word => 
            word.length > 3 && captionText.includes(word)
        ).length;
        
        const totalWords = expectedText.split(' ').filter(word => word.length > 3).length;
        const matchPercentage = (matchWords / totalWords) * 100;
        
        return {
            match: matchPercentage >= 30,
            matchPercentage,
            reason: matchPercentage >= 30 ? `Correspondência de ${matchPercentage.toFixed(1)}%` : `Correspondência baixa: ${matchPercentage.toFixed(1)}%`
        };
        
    } catch (error) {
        return { match: false, reason: `Erro ao verificar legendas: ${error.message}` };
    }
}

// Função principal para processar todos os hinos
async function processAllHymns() {
    try {
        // Lê o arquivo de hinos
        const hymnsData = fs.readFileSync('./hinos.js', 'utf8');
        
        // Extrai o array de hinos (remove o const e o ; final)
        const hymnsJson = hymnsData.replace('const hymns = ', '').replace(/;$/, '');
        const hymns = JSON.parse(hymnsJson);
        
        console.log(`Processando ${hymns.length} hinos...`);
        
        const results = [];
        
        for (let i = 0; i < hymns.length; i++) {
            const hymn = hymns[i];
            console.log(`\nProcessando hino ${i + 1}: ${hymn.title}`);
            
            // Pula se já tiver vídeos
            if (hymn.videos && hymn.videos.length > 0) {
                console.log('Hino já possui vídeos, pulando...');
                continue;
            }
            
            // Extrai frases-chave
            const allLyrics = [...hymn.verses.flat()];
            if (hymn.coro) {
                allLyrics.push(...hymn.coro);
            }
            
            const keyPhrases = extractKeyPhrases(hymn.verses, hymn.coro);
            
            // Busca vídeos
            const videos = await searchVideosByLyrics(hymn.title, keyPhrases);
            
            if (videos.length === 0) {
                console.log('Nenhum vídeo encontrado');
                results.push({ hymn: hymn.title, videos: [] });
                continue;
            }
            
            // Verifica correspondência das letras (até 3 vídeos)
            const verifiedVideos = [];
            for (let j = 0; j < Math.min(3, videos.length); j++) {
                const video = videos[j];
                console.log(`  Verificando vídeo ${j + 1}: ${video.title}`);
                
                const verification = await verifyLyricsMatch(video.videoId, allLyrics);
                
                if (verification.match) {
                    verifiedVideos.push({
                        url: video.url,
                        title: video.title,
                        matchPercentage: verification.matchPercentage
                    });
                    console.log(`    ✓ Aprovado: ${verification.reason}`);
                } else {
                    console.log(`    ✗ Reprovado: ${verification.reason}`);
                }
            }
            
            // Adiciona os vídeos verificados ao hino
            if (verifiedVideos.length > 0) {
                hymn.videos = verifiedVideos.map(v => v.url);
                console.log(`  ✓ Adicionados ${verifiedVideos.length} vídeos`);
            } else {
                console.log('  ✗ Nenhum vídeo com letras correspondentes encontrado');
            }
            
            results.push({
                hymn: hymn.title,
                videos: verifiedVideos,
                searched: videos.length
            });
            
            // Pequeno delay para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Salva o resultado
        const updatedContent = 'const hymns = ' + JSON.stringify(hymns, null, 4) + ';';
        fs.writeFileSync('./hinos_updated.js', updatedContent, 'utf8');
        
        // Gera relatório
        const report = results.map(r => 
            `${r.hymn}: ${r.videos.length} vídeos encontrados (buscou em ${r.searched})`
        ).join('\n');
        
        fs.writeFileSync('./video_search_report.txt', report, 'utf8');
        
        console.log('\n✓ Processo concluído!');
        console.log(`Resultados salvos em hinos_updated.js`);
        console.log(`Relatório salvo em video_search_report.txt`);
        
        return results;
        
    } catch (error) {
        console.error('Erro durante o processamento:', error);
        throw error;
    }
}

// Função para testar com um hino específico
async function testSingleHymn(hymnIndex) {
    try {
        const hymnsData = fs.readFileSync('./hinos.js', 'utf8');
        const hymnsJson = hymnsData.replace('const hymns = ', '').replace(/;$/, '');
        const hymns = JSON.parse(hymnsJson);
        
        const hymn = hymns[hymnIndex];
        console.log(`Testando hino ${hymnIndex + 1}: ${hymn.title}`);
        
        const allLyrics = [...hymn.verses.flat()];
        if (hymn.coro) {
            allLyrics.push(...hymn.coro);
        }
        
        const keyPhrases = extractKeyPhrases(hymn.verses, hymn.coro);
        console.log('Frases-chave para busca:', keyPhrases);
        
        const videos = await searchVideosByLyrics(hymn.title, keyPhrases);
        console.log(`\nEncontrados ${videos.length} vídeos:`);
        
        for (let i = 0; i < Math.min(3, videos.length); i++) {
            const video = videos[i];
            console.log(`\n${i + 1}. ${video.title}`);
            console.log(`   URL: ${video.url}`);
            
            const verification = await verifyLyricsMatch(video.videoId, allLyrics);
            console.log(`   Verificação: ${verification.reason}`);
        }
        
    } catch (error) {
        console.error('Erro no teste:', error);
    }
}

// Exporta as funções
module.exports = {
    processAllHymns,
    testSingleHymn,
    extractKeyPhrases,
    searchVideosByLyrics,
    verifyLyricsMatch
};

// Se executado diretamente
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'test') {
        const hymnIndex = parseInt(process.argv[3]) || 0;
        testSingleHymn(hymnIndex);
    } else if (command === 'all') {
        processAllHymns();
    } else {
        console.log('Uso:');
        console.log('  node video_finder.js test [index] - Testa um hino específico');
        console.log('  node video_finder.js all - Processa todos os hinos');
        console.log('\nAntes de executar, defina a variável de ambiente YOUTUBE_API_KEY');
    }
}
