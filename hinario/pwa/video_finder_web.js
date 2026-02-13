const fs = require('fs');
const https = require('https');
const { JSDOM } = require('jsdom');

// Sistema de logs
const logStream = fs.createWriteStream('./video_search.log', { flags: 'a' });

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(message);
    logStream.write(logMessage + '\n');
}

function logError(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}`;
    console.error(`❌ ${message}`);
    logStream.write(logMessage + '\n');
}

function logSuccess(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] SUCCESS: ${message}`;
    console.log(`✅ ${message}`);
    logStream.write(logMessage + '\n');
}

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

// Função para fazer requisição HTTP
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                if (response.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                }
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Função para buscar vídeos no YouTube via web scraping
async function searchYouTube(query) {
    try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        console.log(`  Buscando: ${query}`);
        
        const html = await makeRequest(searchUrl);
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        const videos = [];
        
        // Procura por links de vídeos de várias formas
        const selectors = [
            'a[href*="/watch?v="]',
            'a.yt-simple-endpoint[href*="/watch"]',
            '.ytd-video-renderer a[href*="/watch"]',
            'a[id="video-title"]'
        ];
        
        for (const selector of selectors) {
            try {
                const videoLinks = document.querySelectorAll(selector);
                console.log(`    Encontrados ${videoLinks.length} links com seletor: ${selector}`);
                
                for (const link of videoLinks) {
                    const href = link.getAttribute('href');
                    if (href && (href.includes('/watch?v=') || href.includes('youtu.be'))) {
                        const videoId = href.includes('youtu.be/') 
                            ? href.split('youtu.be/')[1]?.split('?')[0]
                            : href.split('v=')[1]?.split('&')[0];
                        
                        if (videoId && videoId.length === 11) {
                            const title = link.textContent?.trim() || 
                                        link.getAttribute('title') || 
                                        link.getAttribute('aria-label') || '';
                            
                            // Pula se já tiver este vídeo
                            if (!videos.find(v => v.videoId === videoId) && title.length > 0) {
                                videos.push({
                                    videoId,
                                    title: title.replace(/\s+/g, ' ').trim(),
                                    url: `https://youtu.be/${videoId}`
                                });
                            }
                        }
                    }
                }
                
                if (videos.length > 0) break; // Para no primeiro seletor que funcionar
                
            } catch (error) {
                console.log(`    Erro com seletor ${selector}: ${error.message}`);
                continue;
            }
        }
        
        // Se ainda não encontrou, tenta regex no HTML bruto
        if (videos.length === 0) {
            console.log('    Tentando busca com regex no HTML...');
            const videoRegex = /watch\?v=([a-zA-Z0-9_-]{11})/g;
            let match;
            const foundIds = new Set();
            
            while ((match = videoRegex.exec(html)) !== null) {
                const videoId = match[1];
                if (!foundIds.has(videoId)) {
                    foundIds.add(videoId);
                    videos.push({
                        videoId,
                        title: `Vídeo ${videoId}`,
                        url: `https://youtu.be/${videoId}`
                    });
                }
            }
        }
        
        console.log(`    Total de vídeos encontrados: ${videos.length}`);
        return videos.slice(0, 10); // Limita a 10 resultados
        
    } catch (error) {
        console.log(`    Erro na busca: ${error.message}`);
        return [];
    }
}

// Função para buscar em sites de legendas com vínculos YouTube
async function searchLyricsSites(hymnTitle, keyPhrases) {
    const sites = [
        {
            name: 'Letras.mus.br',
            baseUrl: 'https://www.letras.mus.br',
            searchPath: '/?q=',
            videoSelectors: [
                'a[href*="youtube.com"]',
                'a[href*="youtu.be"]',
                'iframe[src*="youtube"]',
                '.b-video-player a',
                '.video-player iframe'
            ]
        },
        {
            name: 'Cifra Club',
            baseUrl: 'https://www.cifraclub.com.br',
            searchPath: '/search.php?q=',
            videoSelectors: [
                'a[href*="youtube.com"]',
                'a[href*="youtu.be"]',
                'iframe[src*="youtube"]',
                '.video-player iframe',
                '.topo-video iframe'
            ]
        },
        {
            name: 'Hinário.com.br',
            baseUrl: 'https://www.hinario.com.br',
            searchPath: '/busca?q=',
            videoSelectors: [
                'a[href*="youtube.com"]',
                'a[href*="youtu.be"]',
                'iframe[src*="youtube"]',
                '.video-container iframe',
                '.player-video iframe'
            ]
        },
        {
            name: 'Vagalume',
            baseUrl: 'https://www.vagalume.com.br',
            searchPath: '/search.php?q=',
            videoSelectors: [
                'a[href*="youtube.com"]',
                'a[href*="youtu.be"]',
                'iframe[src*="youtube"]',
                '.video-player iframe',
                '.h-video-player iframe'
            ]
        },
        {
            name: 'Musixmatch',
            baseUrl: 'https://www.musixmatch.com',
            searchPath: '/search/',
            videoSelectors: [
                'a[href*="youtube.com"]',
                'a[href*="youtu.be"]',
                'iframe[src*="youtube"]',
                '.mxm-video-player iframe',
                '.video-player iframe'
            ]
        },
        {
            name: 'Genius',
            baseUrl: 'https://genius.com',
            searchPath: '/search?q=',
            videoSelectors: [
                'a[href*="youtube.com"]',
                'a[href*="youtu.be"]',
                'iframe[src*="youtube"]',
                '.video-player iframe',
                '.embed iframe'
            ]
        }
    ];
    
    const results = [];
    
    for (const site of sites) {
        try {
            // Cria múltiplas consultas de busca
            const searchQueries = [
                `${hymnTitle}`,
                ...keyPhrases.slice(0, 2)
            ];
            
            for (const query of searchQueries) {
                try {
                    const searchUrl = site.baseUrl + site.searchPath + encodeURIComponent(query);
                    console.log(`    🎵 Buscando em ${site.name}: "${query}"`);
                    
                    const html = await makeRequest(searchUrl);
                    const dom = new JSDOM(html);
                    const document = dom.window.document;
                    
                    // Procura por links de resultados primeiro
                    const resultLinks = document.querySelectorAll('a[href*="/"]');
                    
                    for (const link of resultLinks.slice(0, 5)) { // Limita a 5 resultados por busca
                        const href = link.getAttribute('href');
                        if (href && href.length > 5 && !href.includes('http')) {
                            const fullUrl = site.baseUrl + href;
                            
                            try {
                                // Acessa a página da letra
                                const pageHtml = await makeRequest(fullUrl);
                                const pageDom = new JSDOM(pageHtml);
                                const pageDocument = pageDom.window.document;
                                
                                // Verifica se a letra corresponde ao hino
                                const pageText = pageDocument.body?.textContent?.toLowerCase() || '';
                                const expectedText = keyPhrases.join(' ').toLowerCase();
                                
                                // Verifica correspondência da letra
                                const keyWords = expectedText.split(' ').filter(word => word.length > 4);
                                const matchedWords = keyWords.filter(word => pageText.includes(word));
                                const matchPercentage = (matchedWords.length / keyWords.length) * 100;
                                
                                if (matchPercentage >= 30) { // Correspondência boa da letra
                                    console.log(`      ✅ Letra correspondente encontrada (${matchPercentage.toFixed(1)}%)`);
                                    
                                    // Agora procura por vídeos nesta página
                                    for (const selector of site.videoSelectors) {
                                        const videoElements = pageDocument.querySelectorAll(selector);
                                        
                                        for (const videoElement of videoElements) {
                                            const videoSrc = videoElement.getAttribute('href') || 
                                                          videoElement.getAttribute('src');
                                            
                                            if (videoSrc && (videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be'))) {
                                                const videoId = videoSrc.includes('youtu.be/') 
                                                    ? videoSrc.split('youtu.be/')[1]?.split('?')[0]
                                                    : videoSrc.split('v=')[1]?.split('&')[0];
                                                
                                                if (videoId && videoId.length === 11) {
                                                    const videoTitle = videoElement.getAttribute('title') || 
                                                                    videoElement.textContent?.trim() || 
                                                                    `Vídeo de ${hymnTitle}`;
                                                    
                                                    results.push({
                                                        videoId,
                                                        title: videoTitle,
                                                        url: `https://youtu.be/${videoId}`,
                                                        source: site.name,
                                                        lyricsMatch: matchPercentage,
                                                        hasLyrics: true
                                                    });
                                                    
                                                    console.log(`        🎥 Vídeo encontrado: ${videoTitle}`);
                                                }
                                            }
                                        }
                                    }
                                }
                                
                            } catch (pageError) {
                                console.log(`      Erro acessando página: ${pageError.message}`);
                            }
                        }
                    }
                    
                } catch (searchError) {
                    console.log(`    Erro na busca em ${site.name}: ${searchError.message}`);
                }
                
                // Delay entre buscas no mesmo site
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            console.log(`    Erro geral em ${site.name}: ${error.message}`);
        }
        
        // Delay entre sites diferentes
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Remove duplicados
    const uniqueVideos = results.filter((video, index, self) => 
        index === self.findIndex(v => v.videoId === video.videoId)
    );
    
    console.log(`    📺 Encontrados ${uniqueVideos.length} vídeos únicos em sites de legendas`);
    return uniqueVideos;
}

// Função para verificar correspondência das letras (simplificada)
async function verifyLyricsMatch(videoId, expectedLyrics) {
    try {
        // Tenta obter a página do vídeo para verificar informações
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const html = await makeRequest(videoUrl);
        
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        // Procura por descrição, título e metadados
        const title = document.querySelector('title')?.textContent || '';
        const description = document.querySelector('#description')?.textContent || '';
        
        // Verifica se há menção a legendas/CC
        const hasCaptions = document.querySelector('.ytp-caption-segment') !== null ||
                           description.toLowerCase().includes('legenda') ||
                           description.toLowerCase().includes('letra');
        
        // Verifica correspondência básica pelo título e descrição
        const allText = (title + ' ' + description).toLowerCase();
        const expectedText = expectedLyrics.join(' ').toLowerCase();
        
        // Conta palavras-chave que aparecem
        const keyWords = expectedText.split(' ').filter(word => word.length > 4);
        const matchedWords = keyWords.filter(word => allText.includes(word));
        
        const matchPercentage = (matchedWords.length / keyWords.length) * 100;
        
        return {
            match: matchPercentage >= 20 && hasCaptions, // Requisito mínimo mais baixo sem API
            matchPercentage,
            hasCaptions,
            reason: matchPercentage >= 20 
                ? `Correspondência de ${matchPercentage.toFixed(1)}%${hasCaptions ? ' com legendas' : ''}`
                : `Correspondência baixa: ${matchPercentage.toFixed(1)}%`
        };
        
    } catch (error) {
        return { 
            match: false, 
            reason: `Erro ao verificar vídeo: ${error.message}`,
            hasCaptions: false
        };
    }
}

// Função principal para processar todos os hinos
async function processAllHymns() {
    const startTime = Date.now();
    log('🚀 Iniciando processamento de todos os hinos via web scraping...');
    
    try {
        // Lê o arquivo de hinos usando o parser melhorado
        const hymns = parseHymnsFile();
        
        log(`📁 Total de ${hymns.length} hinos encontrados no arquivo`);
        
        const results = [];
        let successCount = 0;
        let errorCount = 0;
        let totalVideosFound = 0;
        
        for (let i = 0; i < hymns.length; i++) {
            const hymn = hymns[i];
            const progress = ((i + 1) / hymns.length * 100).toFixed(1);
            
            log(`\n📖 [${i + 1}/${hymns.length}] ${progress}% - ${hymn.title}`);
            
            // Pula se já tiver vídeos
            if (hymn.videos && hymn.videos.length > 0) {
                log(`   ⏭️  Já possui ${hymn.videos.length} vídeos, pulando...`);
                continue;
            }
            
            try {
                // Extrai frases-chave
                const keyPhrases = extractKeyPhrases(hymn.verses, hymn.coro);
                log(`   🔑 Frases-chave: ${keyPhrases.slice(0, 2).join(' | ')}`);
                
                // Prepara consultas de busca
                const searchQueries = [
                    `"${hymn.title}" hinário letra`,
                    `"${hymn.title}" hino cristão`
                ];
                
                // Adiciona frases-chave como consultas
                keyPhrases.slice(0, 2).forEach(phrase => {
                    if (phrase.length > 15) {
                        searchQueries.push(`"${phrase}" hinário`);
                    }
                });
                
                const allVideos = [];
                
                // Busca no YouTube
                for (const query of searchQueries.slice(0, 3)) {
                    log(`   🔍 Buscando: ${query}`);
                    const videos = await searchYouTube(query);
                    allVideos.push(...videos);
                    
                    // Delay entre buscas
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                // Busca em sites de legendas (nova abordagem)
                log(`   � Buscando em sites de legendas...`);
                const lyricsVideos = await searchLyricsSites(hymn.title, keyPhrases);
                allVideos.push(...lyricsVideos);
                
                // Remove duplicados
                const uniqueVideos = allVideos.filter((video, index, self) => 
                    index === self.findIndex(v => v.videoId === video.videoId)
                );
                
                log(`   📺 Encontrados ${uniqueVideos.length} vídeos únicos`);
                
                if (uniqueVideos.length === 0) {
                    results.push({ hymn: hymn.title, videos: [], status: 'no_videos' });
                    continue;
                }
                
                // Verifica correspondência (até 3 vídeos)
                const verifiedVideos = [];
                const allLyrics = [...hymn.verses.flat()];
                if (hymn.coro) {
                    allLyrics.push(...hymn.coro);
                }
                
                for (let j = 0; j < Math.min(3, uniqueVideos.length); j++) {
                    const video = uniqueVideos[j];
                    log(`      🎥 Verificando ${j + 1}/3: ${video.title.substring(0, 50)}...`);
                    
                    // Se veio de site de legendas, já tem correspondência verificada
                    if (video.hasLyrics && video.lyricsMatch) {
                        logSuccess(`         ✓ Letra verificada (${video.lyricsMatch.toFixed(1)}%) - Fonte: ${video.source}`);
                        verifiedVideos.push({
                            url: video.url,
                            title: video.title,
                            matchPercentage: video.lyricsMatch,
                            hasCaptions: true,
                            source: video.source
                        });
                    } else {
                        // Verificação tradicional para vídeos do YouTube
                        const verification = await verifyLyricsMatch(video.videoId, allLyrics);
                        
                        if (verification.match) {
                            verifiedVideos.push({
                                url: video.url,
                                title: video.title,
                                matchPercentage: verification.matchPercentage,
                                hasCaptions: verification.hasCaptions
                            });
                            logSuccess(`         ✓ ${verification.reason}`);
                        } else {
                            log(`         ✗ ${verification.reason}`);
                        }
                        
                        // Delay entre verificações
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                }
                
                // Adiciona os vídeos verificados ao hino
                if (verifiedVideos.length > 0) {
                    hymn.videos = verifiedVideos.map(v => v.url);
                    logSuccess(`   🎉 Adicionados ${verifiedVideos.length} vídeos`);
                    successCount++;
                    totalVideosFound += verifiedVideos.length;
                } else {
                    log(`   ❌ Nenhum vídeo verificado encontrado`);
                    errorCount++;
                }
                
                results.push({
                    hymn: hymn.title,
                    videos: verifiedVideos,
                    searched: uniqueVideos.length,
                    status: verifiedVideos.length > 0 ? 'success' : 'failed'
                });
                
                // Salva progresso a cada 10 hinos
                if ((i + 1) % 10 === 0) {
                    const updatedContent = 'const hymns = ' + JSON.stringify(hymns, null, 4) + ';';
                    fs.writeFileSync('./hinos_progress.js', updatedContent, 'utf8');
                    log(`   💾 Progresso salvo em hinos_progress.js (${i + 1} hinos processados)`);
                    
                    // Estatísticas parciais
                    const partialTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
                    log(`   📊 Estatísticas parciais: ${successCount} sucessos, ${errorCount} falhas, ${totalVideosFound} vídeos, ${partialTime}min`);
                }
                
            } catch (error) {
                logError(`Erro processando hino ${hymn.title}: ${error.message}`);
                errorCount++;
                results.push({
                    hymn: hymn.title,
                    videos: [],
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        // Salva o resultado final
        log(`\n💾 Salvando resultado final...`);
        const updatedContent = 'const hymns = ' + JSON.stringify(hymns, null, 4) + ';';
        fs.writeFileSync('./hinos_updated.js', updatedContent, 'utf8');
        
        // Gera relatório detalhado
        const report = generateReport(results, startTime, successCount, errorCount, totalVideosFound);
        fs.writeFileSync('./video_search_report.txt', report, 'utf8');
        
        logSuccess(`\n🎉 Processo concluído com sucesso!`);
        log(`📁 Arquivos criados:`);
        log(`   • hinos_updated.js - Arquivo final com vídeos`);
        log(`   • video_search_report.txt - Relatório detalhado`);
        log(`   • video_search.log - Logs completos`);
        
        // Estatísticas finais
        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        log(`\n📊 Estatísticas Finais:`);
        log(`   • Hinos processados: ${results.length}`);
        log(`   • Hinos com vídeos: ${successCount}`);
        log(`   • Hinos sem vídeos: ${errorCount}`);
        log(`   • Total de vídeos: ${totalVideosFound}`);
        log(`   • Taxa de sucesso: ${((successCount / results.length) * 100).toFixed(1)}%`);
        log(`   • Tempo total: ${totalTime} minutos`);
        
        return results;
        
    } catch (error) {
        logError(`Erro fatal durante o processamento: ${error.message}`);
        throw error;
    } finally {
        logStream.end();
    }
}

// Função para gerar relatório detalhado
function generateReport(results, startTime, successCount, errorCount, totalVideosFound) {
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    let report = `RELATÓRIO DE BUSCA DE VÍDEOS DE HINOS\n`;
    report += `=====================================\n\n`;
    report += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
    report += `Tempo total: ${totalTime} minutos\n`;
    report += `Hinos processados: ${results.length}\n`;
    report += `Hinos com vídeos: ${successCount}\n`;
    report += `Hinos sem vídeos: ${errorCount}\n`;
    report += `Total de vídeos: ${totalVideosFound}\n`;
    report += `Taxa de sucesso: ${((successCount / results.length) * 100).toFixed(1)}%\n\n`;
    
    report += `DETALHES POR HINO:\n`;
    report += `-----------------\n\n`;
    
    results.forEach((result, index) => {
        report += `${index + 1}. ${result.hymn}\n`;
        
        if (result.status === 'success') {
            report += `   ✅ Sucesso - ${result.videos.length} vídeos encontrados:\n`;
            result.videos.forEach(video => {
                report += `      • ${video.url} (${video.matchPercentage?.toFixed(1)}%)\n`;
            });
        } else if (result.status === 'no_videos') {
            report += `   ❌ Nenhum vídeo encontrado\n`;
        } else if (result.status === 'failed') {
            report += `   ⚠️  Vídeos encontrados mas não verificados (${result.searched} buscados)\n`;
        } else if (result.status === 'error') {
            report += `   🚫 Erro: ${result.error}\n`;
        }
        
        if (result.searched) {
            report += `   📊 Buscou em ${result.searched} vídeos\n`;
        }
        
        report += `\n`;
    });
    
    return report;
}

// Função para ler e parsear o arquivo de hinos
function parseHymnsFile() {
    try {
        // Abre o arquivo como módulo JavaScript
        delete require.cache[require.resolve('./hinos.js')];
        const hymnsModule = require('./hinos.js');
        return hymnsModule.hymns || hymnsModule;
    } catch (error) {
        // Se falhar, tenta método alternativo com eval
        console.log('Tentando carregar como JavaScript...');
        
        const hymnsData = fs.readFileSync('./hinos.js', 'utf8');
        
        // Remove o const e executa como código
        const code = hymnsData.replace('const hymns = ', 'hymns = ');
        
        // Cria um contexto seguro para eval
        const context = { hymns: null };
        
        // Executa o código no contexto
        const vm = require('vm');
        vm.createContext(context);
        vm.runInContext(code, context);
        
        return context.hymns;
    }
}

// Função para testar com um hino específico
async function testSingleHymn(hymnIndex) {
    try {
        const hymns = parseHymnsFile();
        
        const hymn = hymns[hymnIndex];
        console.log(`Testando hino ${hymnIndex + 1}: ${hymn.title}`);
        
        const allLyrics = [...hymn.verses.flat()];
        if (hymn.coro) {
            allLyrics.push(...hymn.coro);
        }
        
        const keyPhrases = extractKeyPhrases(hymn.verses, hymn.coro);
        console.log('Frases-chave:', keyPhrases);
        
        // Busca vídeos
        const searchQuery = `"${hymn.title}" hinário letra`;
        const videos = await searchYouTube(searchQuery);
        
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
    searchYouTube,
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
        console.log('  node video_finder_web.js test [index] - Testa um hino específico');
        console.log('  node video_finder_web.js all - Processa todos os hinos');
        console.log('\nEste sistema usa web scraping e não requer API key.');
    }
}
