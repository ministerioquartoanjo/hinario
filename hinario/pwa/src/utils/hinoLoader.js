/**
 * Utility for loading and transforming hymn data
 */
export const hinoLoader = {
    transformHinos(rawHymns) {
        if (!Array.isArray(rawHymns)) return [];

        return rawHymns.map(h => {
            if (!h || !h.title) return null;
            try {
                // Extrair número e título (ex: "1 - A Ceia do Senhor")
                const parts = h.title.split(' - ');
                const numero = parts.length > 0 ? parseInt(parts[0]) : 0;
                const titulo = parts.length > 1 ? parts[1] : h.title;

                const letras = [];

                // Processar Versos e Coro intercalados
                if (h.verses && Array.isArray(h.verses)) {
                    h.verses.forEach((v, index) => {
                        if (v) {
                            const texto = Array.isArray(v) ? v.join('\n') : v;
                            letras.push({ tipo: 'estrofe', texto: texto });

                            // Adicionar coro após cada estrofe se existir
                            if (h.coro) {
                                if (Array.isArray(h.coro) && Array.isArray(h.coro[0])) {
                                    if (h.coro[index]) {
                                        const textoRefrão = h.coro[index].join('\n');
                                        letras.push({ tipo: 'refrão', texto: textoRefrão });
                                    } else if (h.coro.length > 0) {
                                        const textoRefrão = h.coro[h.coro.length - 1].join('\n');
                                        letras.push({ tipo: 'refrão', texto: textoRefrão });
                                    }
                                } else {
                                    const textoRefrão = Array.isArray(h.coro) ? h.coro.join('\n') : h.coro;
                                    letras.push({ tipo: 'refrão', texto: textoRefrão });
                                }
                            }
                        }
                    });
                }

                if (letras.length === 0 && h.coro) {
                    if (Array.isArray(h.coro) && Array.isArray(h.coro[0])) {
                        h.coro.forEach(c => {
                            letras.push({ tipo: 'refrão', texto: c.join('\n') });
                        });
                    } else {
                        const textoRefrão = Array.isArray(h.coro) ? h.coro.join('\n') : h.coro;
                        letras.push({ tipo: 'refrão', texto: textoRefrão });
                    }
                }

                if (letras.length === 0) {
                    letras.push({ tipo: 'estrofe', texto: '(Hino sem letra disponível)' });
                }

                // Adicionar Slide de Capa
                letras.unshift({
                    tipo: 'capa',
                    titulo: h.title,
                    autor: h.author || 'Autor Desconhecido'
                });

                return { 
                    numero, 
                    titulo, 
                    letras, 
                    audioFilters: h.audioFilters, 
                    introducao: h.introducao,
                    videos: h.videos || []
                };
            } catch (e) {
                console.error("Erro ao transformar hino:", h, e);
                return null;
            }
        }).filter(h => h !== null);
    },

    async loadIndex(state) {
        try {
            const response = await fetch('data/hymns-index.json');
            if (!response.ok) throw new Error('Falha ao carregar índice de hinos');
            const indexData = await response.json();

            state.hinos = indexData.map(h => ({
                numero: h.numero,
                titulo: h.titulo,
                loaded: false,
                letras: []
            }));
            
            return true;
        } catch (e) {
            console.error("Erro ao inicializar hinos:", e);
            return false;
        }
    }
};
