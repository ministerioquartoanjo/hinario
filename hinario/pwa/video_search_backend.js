const express = require('express');
const { JSDOM } = require('jsdom');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

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

// Buscar vídeos no YouTube via web scraping
async function searchYouTubeVideos(query) {
    try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        console.log(`Buscando: ${query}`);
        
        const html = await makeRequest(searchUrl);
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        const videos = [];
        
        // Procura por scripts com dados de vídeos
        const scripts = document.querySelectorAll('script');
        
        for (const script of scripts) {
            const scriptText = script.textContent;
            
            // Procura por dados de vídeo no script
            if (scriptText.includes('videoDetails') || scriptText.includes('ytInitialData')) {
                try {
                    // Extrai videoIds usando regex
                    const videoIdRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
                    const titleRegex = /"title":"([^"]+)"/g;
                    const thumbnailRegex = /"url":"https:\/\/i\.ytimg\.com\/[^"]+"/g;
                    
                    const videoIds = [...scriptText.matchAll(videoIdRegex)].map(match => match[1]);
                    const titles = [...scriptText.matchAll(titleRegex)].map(match => match[1]);
                    const thumbnails = [...scriptText.matchAll(thumbnailRegex)].map(match => match[0].split('"')[3]);
                    
                    // Combina os dados
                    for (let i = 0; i < Math.min(videoIds.length, 10); i++) {
                        if (videoIds[i] && titles[i]) {
                            const videoId = videoIds[i];
                            const title = titles[i].replace(/\\u/g, '').replace(/\\/g, '');
                            const thumbnail = thumbnails[i] || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                            
                            // Evita duplicados
                            if (!videos.find(v => v.videoId === videoId)) {
                                videos.push({
                                    videoId,
                                    title: title.substring(0, 100), // Limita tamanho do título
                                    thumbnail,
                                    url: `https://youtu.be/${videoId}`
                                });
                            }
                        }
                    }
                    
                    if (videos.length > 0) break;
                    
                } catch (error) {
                    console.log('Erro ao parsear script:', error.message);
                }
            }
        }
        
        // Se não encontrou com script, tenta regex direto
        if (videos.length === 0) {
            const videoRegex = /watch\?v=([a-zA-Z0-9_-]{11})/g;
            let match;
            const foundIds = new Set();
            
            while ((match = videoRegex.exec(html)) !== null && foundIds.size < 10) {
                const videoId = match[1];
                if (!foundIds.has(videoId)) {
                    foundIds.add(videoId);
                    videos.push({
                        videoId,
                        title: `Vídeo ${videoId}`,
                        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                        url: `https://youtu.be/${videoId}`
                    });
                }
            }
        }
        
        console.log(`Encontrados ${videos.length} vídeos`);
        return videos.slice(0, 10); // Limita a 10 resultados
        
    } catch (error) {
        console.error('Erro na busca:', error.message);
        return [];
    }
}

// API endpoint para buscar vídeos
app.post('/api/search-videos', async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query é obrigatória' });
        }
        
        const videos = await searchYouTubeVideos(query);
        res.json({ videos });
        
    } catch (error) {
        console.error('Erro no endpoint:', error);
        res.status(500).json({ error: 'Erro ao buscar vídeos' });
    }
});

// API endpoint para salvar hinos
app.post('/api/save-hymns', async (req, res) => {
    try {
        const { hymns } = req.body;
        
        if (!hymns) {
            return res.status(400).json({ error: 'Hinos são obrigatórios' });
        }
        
        // Salva no arquivo
        const content = `const hymns = ${JSON.stringify(hymns, null, 4)};\n\nmodule.exports = { hymns };`;
        fs.writeFileSync('./hinos.js', content, 'utf8');
        
        res.json({ success: true, message: 'Hinos salvos com sucesso' });
        
    } catch (error) {
        console.error('Erro ao salvar hinos:', error);
        res.status(500).json({ error: 'Erro ao salvar hinos' });
    }
});

// API endpoint para carregar hinos
app.get('/api/hymns', (req, res) => {
    try {
        const hymnsData = fs.readFileSync('./hinos.js', 'utf8');
        
        // Extrai o JSON do arquivo
        const jsonMatch = hymnsData.match(/const\s+hymns\s*=\s*(\[[\s\S]*\]);?\s*$/);
        if (jsonMatch) {
            const hymns = JSON.parse(jsonMatch[1]);
            res.json({ hymns });
        } else {
            res.status(500).json({ error: 'Formato do arquivo inválido' });
        }
        
    } catch (error) {
        console.error('Erro ao carregar hinos:', error);
        res.status(500).json({ error: 'Erro ao carregar hinos' });
    }
});

// Serve o arquivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'video_selector.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📱 Abra http://localhost:${PORT}/video_selector.html no navegador`);
});

module.exports = app;
