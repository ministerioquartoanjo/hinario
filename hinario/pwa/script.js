const DEFAULT_BACKGROUNDS = [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=1920&q=80'
];

const DEFAULT_AUDIO_FILTERS = {
    gain: 1.2,
    bass: 0,
    mid: -5,
    treble: 12
};

let BACKGROUNDS = [...DEFAULT_BACKGROUNDS];

// --- Estado da Aplicação ---
const state = {
    hinos: [], // Carregado de hinos.js
    currentHino: null,
    currentSlide: 0,
    isPlaylistActive: false,
    settings: {
        fontSize: 1.5,
        lineHeight: 1.4,
        fontFamily: 'Inter',
        fontColor: '#FFFFFF',
        showBackground: true,
        darkMode: false,
        isCompleto: false,
        bgIndex: 0,
        customBackgrounds: [],
        bgColor: '#000000',
        audioFilters: { ...DEFAULT_AUDIO_FILTERS }
    }
};

// --- Web Audio API ---
let audioCtx = null;
let source = null;
let gainNode = null;
let bassNode = null;
let midNode = null;
let trebleNode = null;
let countdownInterval = null;

const initAudioContext = () => {
    if (audioCtx) return;

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const player = document.getElementById('audio-player');
        source = audioCtx.createMediaElementSource(player);

        // Nodes
        gainNode = audioCtx.createGain();
        bassNode = audioCtx.createBiquadFilter();
        midNode = audioCtx.createBiquadFilter();
        trebleNode = audioCtx.createBiquadFilter();

        // EQ Config
        bassNode.type = 'lowshelf';
        bassNode.frequency.value = 200;

        midNode.type = 'peaking';
        midNode.frequency.value = 1000;
        midNode.Q.value = 1.0;

        trebleNode.type = 'highshelf';
        trebleNode.frequency.value = 3000;

        // Chain: Source -> Bass -> Mid -> Treble -> Gain -> Destination
        source.connect(bassNode);
        bassNode.connect(midNode);
        midNode.connect(trebleNode);
        trebleNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        applyAudioFilters();
        audioCtx.resume();
        console.log("Web Audio API inicializada com sucesso.");
    } catch (e) {
        console.error("Erro ao inicializar Web Audio API:", e);
    }
};

const applyAudioFilters = () => {
    if (!audioCtx) return;
    const f = state.settings.audioFilters;

    // Suavizar mudanças de parâmetro
    const now = audioCtx.currentTime;
    gainNode.gain.setTargetAtTime(f.gain, now, 0.05);
    bassNode.gain.setTargetAtTime(f.bass, now, 0.05);
    midNode.gain.setTargetAtTime(f.mid, now, 0.05);
    trebleNode.gain.setTargetAtTime(f.treble, now, 0.05);

    // Update UI
    $('#range-gain').val(f.gain);
    $('#label-gain').text(f.gain.toFixed(1) + 'x');
    $('#eq-bass').val(f.bass);
    $('#eq-mid').val(f.mid);
    $('#eq-treble').val(f.treble);

    // Update dB Labels
    $('#val-bass').text((f.bass >= 0 ? '+' : '') + f.bass + 'dB');
    $('#val-mid').text((f.mid >= 0 ? '+' : '') + f.mid + 'dB');
    $('#val-treble').text((f.treble >= 0 ? '+' : '') + f.treble + 'dB');
};

const updateBackgroundsList = () => {
    BACKGROUNDS = [...DEFAULT_BACKGROUNDS, ...state.settings.customBackgrounds];
};

// --- Utilitários ---
const saveSettings = () => localStorage.setItem('hinario_settings', JSON.stringify(state.settings));
const loadSettings = () => {
    const saved = localStorage.getItem('hinario_settings');
    if (saved) {
        Object.assign(state.settings, JSON.parse(saved));
    }
    updateBackgroundsList();
    applySettings();
    // Audio filters might need a refresh if context already exists
    if (audioCtx) applyAudioFilters();
};

const applySettings = () => {
    const root = document.documentElement;
    const body = document.body;

    // Tema
    if (state.settings.darkMode) {
        body.classList.add('dark');
    } else {
        body.classList.remove('dark');
    }

    // Font family display
    $('#slide-content').css({
        'font-family': state.settings.fontFamily,
        'font-size': `${state.settings.fontSize}rem`,
        'line-height': state.settings.lineHeight,
        'color': state.settings.fontColor,
        'font-weight': 600 // Semibold
    });

    // Displays
    $('#font-size-display').text(`${state.settings.fontSize.toFixed(2)}rem`);
    $('#line-height-display').text(state.settings.lineHeight);
    $('#font-family-select').val(state.settings.fontFamily);
    $('#font-color-picker').val(state.settings.fontColor);
    $('#bg-color-picker').val(state.settings.bgColor || '#000000');
    $('#check-completo').prop('checked', state.settings.isCompleto);

    // Background
    if (state.settings.showBackground) {
        const bgUrl = BACKGROUNDS[state.settings.bgIndex || 0];
        console.log("Background atual:", bgUrl);
        $('#slide-bg').removeClass('hidden').css({
            'background-image': `url('${bgUrl}')`,
            'background-color': 'transparent'
        });
        $('#slide-content').css('text-shadow', '2px 2px 8px rgba(0,0,0,0.9), 0px 0px 10px rgba(0,0,0,0.5)');
    } else {
        // Fundo Sólido
        $('#slide-bg').addClass('hidden');
        $('#slide-preview').css('background-color', state.settings.bgColor || '#000000');
        $('#slide-content').css('text-shadow', 'none');
    }
};

const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

// --- Lógica de Hinos ---
const initHinos = async () => {
    try {
        const response = await fetch('data/hymns-index.json');
        if (!response.ok) throw new Error('Falha ao carregar índice de hinos');
        const indexData = await response.json();

        // Populate state.hinos with lightweight objects from the index
        // The index already has 'numero' and clean 'titulo'
        state.hinos = indexData.map(h => ({
            numero: h.numero,
            titulo: h.titulo,
            loaded: false,
            letras: []
        }));

        setupSearch();
        console.log(`Sucesso: Índice de ${state.hinos.length} hinos carregado.`);
    } catch (e) {
        console.error("Erro ao inicializar hinos:", e);
    }
};

const transformHinos = (rawHymns) => {
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
                            // Verifica se o coro é um array de múltiplos coros (variações)
                            if (Array.isArray(h.coro) && Array.isArray(h.coro[0])) {
                                if (h.coro[index]) {
                                    const textoRefrão = h.coro[index].join('\n');
                                    letras.push({ tipo: 'refrão', texto: textoRefrão });
                                } else if (h.coro.length > 0) {
                                    // Fallback: se não houver variação específica, repete o último disponível
                                    const textoRefrão = h.coro[h.coro.length - 1].join('\n');
                                    letras.push({ tipo: 'refrão', texto: textoRefrão });
                                }
                            } else {
                                // Coro único (array de strings ou string)
                                const textoRefrão = Array.isArray(h.coro) ? h.coro.join('\n') : h.coro;
                                letras.push({ tipo: 'refrão', texto: textoRefrão });
                            }
                        }
                    }
                });
            }

            // Caso especial: Hino sem 'verses' mas com 'coro'
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

            // Garantir que temos letras
            if (letras.length === 0) {
                letras.push({ tipo: 'estrofe', texto: '(Hino sem letra disponível)' });
            }

            // Adicionar Slide de Capa (Título e Autor)
            letras.unshift({
                tipo: 'capa',
                titulo: h.title, // Título completo com número
                autor: h.author || 'Autor Desconhecido'
            });

            return { numero, titulo, letras, audioFilters: h.audioFilters, introducao: h.introducao };
        } catch (e) {
            console.error("Erro ao transformar hino:", h, e);
            return null;
        }
    }).filter(h => h !== null);
};

const setupSearch = () => {
    const $input = $("#hino-search");
    const $results = $("#search-results");
    const $clearBtn = $("#btn-clear-search");
    let selectedIndex = -1;
    let filteredHinos = [];

    const renderResults = (hinos) => {
        filteredHinos = hinos;
        if (hinos.length === 0) {
            $results.addClass('hidden').empty();
            return;
        }

        const html = hinos.map((h, index) => {
            const letraPreview = h.letras && h.letras[0] ? h.letras[0].texto.substring(0, 45).replace(/\n/g, ' ') : '';
            return `
                <div class="search-item p-3 cursor-pointer transition-colors border-b last:border-0 dark:border-gray-700 ${index === selectedIndex ? 'bg-orange-dark text-white' : 'hover:bg-orange-100 dark:hover:bg-orange-900/30'}" data-index="${index}">
                    <div class="font-bold flex justify-between items-center">
                        <span>${h.numero} - ${h.titulo}</span>
                        <span class="text-[10px] opacity-50">#${h.numero}</span>
                    </div>
                    <div class="text-[11px] opacity-70 truncate mt-1">${letraPreview}...</div>
                </div>
            `;
        }).join('');

        $results.html(html).removeClass('hidden');
    };

    $input.on('input', function () {
        const term = $(this).val().toLowerCase();

        if (term.length > 0) {
            $clearBtn.removeClass('hidden');
        } else {
            $clearBtn.addClass('hidden');
        }

        if (term.length < 1) {
            $results.addClass('hidden').empty();
            return;
        }

        const matches = state.hinos.filter(h =>
            h.numero.toString().includes(term) ||
            (h.titulo && h.titulo.toLowerCase().includes(term)) ||
            (h.letras && h.letras.some(l => l && l.texto && l.texto.toLowerCase().includes(term)))
        ).slice(0, 10);

        selectedIndex = -1;
        renderResults(matches);
    });

    $input.on('keydown', function (e) {
        const items = $results.find('.search-item');
        if (!$results.hasClass('hidden') && items.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % items.length;
                renderResults(filteredHinos);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                renderResults(filteredHinos);
            } else if (e.key === 'Enter') {
                if (selectedIndex > -1) {
                    e.preventDefault();
                    selectHino(filteredHinos[selectedIndex]);
                    $results.addClass('hidden');
                } else if (filteredHinos.length > 0) {
                    e.preventDefault();
                    selectHino(filteredHinos[0]);
                    $results.addClass('hidden');
                }
            }
        }

        if (e.key === 'Escape') {
            $results.addClass('hidden');
            $input.blur();
        }
    });

    $results.on('click', '.search-item', function () {
        const index = $(this).data('index');
        selectHino(filteredHinos[index]);
        $results.addClass('hidden');
    });

    $clearBtn.on('click', () => {
        $input.val('').focus();
        $results.addClass('hidden').empty();
        $clearBtn.addClass('hidden');
    });

    $(document).on('click', function (e) {
        if (!$(e.target).closest('#hino-search, #search-results').length) {
            $results.addClass('hidden');
        }
    });
};

const selectHino = async (hinoOrIndex) => {
    const hino = state.hinos.find(h => h.numero === hinoOrIndex.numero);
    if (!hino) return;

    if (!hino.loaded) {
        try {
            const loading = document.getElementById('audio-loading'); // Reusing existing loading indicator
            loading.classList.remove('hidden');

            const numStr = hino.numero.toString().padStart(3, '0');
            const res = await fetch(`data/hinos/${numStr}.json`);
            if (!res.ok) throw new Error('Erro ao carregar hino');

            const rawData = await res.json();
            // Transform the raw data (which contains verses array) into our structure
            const transformed = transformHinos([rawData]);

            if (transformed && transformed.length > 0) {
                const details = transformed[0];
                hino.letras = details.letras;
                hino.audioFilters = details.audioFilters;
                hino.introducao = details.introducao;
                hino.loaded = true;
            }
            loading.classList.add('hidden');
        } catch (e) {
            console.error("Erro ao carregar detalhes do hino:", e);
            alert("Não foi possível carregar a letra deste hino.");
            document.getElementById('audio-loading').classList.add('hidden');
            return;
        }
    }

    state.currentHino = hino;
    state.currentSlide = 0;
    renderHino();
    loadAudio(hino.numero);
    scrollToSlide();
    $("#hino-search").val(`${hino.numero} - ${hino.titulo}`).blur();

    // Update video section
    updateVideos(hino);
};

const fetchWithRetry = async (url, maxRetries = 3, initialDelay = 1000) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const delay = retryAfter ? parseInt(retryAfter) * 1000 : initialDelay * Math.pow(2, attempt);
                console.warn(`Rate limit atingido para ${url}. Tentativa ${attempt + 1}/${maxRetries}. Aguardando ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            if (!response.ok) throw new Error(`Status ${response.status}`);
            return response;
        } catch (error) {
            lastError = error;
            const delay = initialDelay * Math.pow(2, attempt);
            console.warn(`Erro ao buscar ${url}. Tentativa ${attempt + 1}/${maxRetries}. Aguardando ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};

const loadAudio = async (numero) => {
    const player = document.getElementById('audio-player');
    const loading = document.getElementById('audio-loading');
    const numStr = numero.toString().padStart(3, '0');
    // URL format: https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/001-piano.mp3
    const audioUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/${numStr}-piano.mp3`;

    loading.classList.remove('hidden');

    // Aplicar velocidade individual salva
    const savedSpeed = localStorage.getItem(`speed_hino_${numero}`);
    const targetSpeed = savedSpeed ? parseFloat(savedSpeed) : 1.0;

    // Aplicar filtros individuais
    const hinoData = state.hinos.find(h => h.numero === numero);
    const savedFilters = localStorage.getItem(`audio_filters_hino_${numero}`);

    if (savedFilters) {
        state.settings.audioFilters = JSON.parse(savedFilters);
    } else if (hinoData && hinoData.audioFilters) {
        state.settings.audioFilters = { ...hinoData.audioFilters };
    } else {
        state.settings.audioFilters = { ...DEFAULT_AUDIO_FILTERS };
    }
    applyAudioFilters();

    // Check Cache API
    if ('caches' in window) {
        const cache = await caches.open('mp3-cache');
        const cachedResponse = await cache.match(audioUrl);
        if (cachedResponse) {
            const blob = await cachedResponse.blob();
            player.src = URL.createObjectURL(blob);
            player.load();
            player.playbackRate = targetSpeed;
            $('#speed-display').text(targetSpeed.toFixed(1) + 'x');
            loading.classList.add('hidden');
            return;
        }
    }

    player.src = audioUrl;
    player.load();
    player.playbackRate = targetSpeed;
    $('#speed-display, #fs-speed-display').text(targetSpeed.toFixed(1) + 'x');

    player.oncanplay = () => {
        loading.classList.add('hidden');
        player.playbackRate = targetSpeed; // Reforçar caso perca no carregamento
    };

    player.onerror = () => {
        console.warn("Falha ao carregar áudio. Tentando carregar diretamente via fetch...");
        loading.classList.add('hidden');
    };
};

const renderHino = () => {
    if (!state.currentHino) return;

    const content = $('#slide-content');
    const counter = $('#slide-counter');
    const currentSlideData = state.currentHino.letras[state.currentSlide];

    // Verificar se é Slide de Capa
    if (currentSlideData && currentSlideData.tipo === 'capa') {
        const [num, ...rest] = currentSlideData.titulo.split(' - ');
        const tituloSemNum = rest.join(' - ');

        content.html(`
            <div class="flex flex-col items-center justify-center h-full animate-fade-in">
                <h1 class="text-4xl md:text-6xl font-black mb-6 text-center leading-tight drop-shadow-lg text-white">
                    ${currentSlideData.titulo}
                </h1>
                <p class="text-xl md:text-2xl font-light italic opacity-80 mt-4 text-white">
                    ${currentSlideData.autor}
                </p>
                <p class="text-sm mt-8 opacity-50 hidden md:block">(Clique duas vezes para iniciar)</p>
            </div>
        `);
        counter.addClass('hidden');
        return;
    }

    if (state.settings.isCompleto) {
        // Modo Completo (Texto Corrido)
        // Ignora o slide 0 (capa) na renderização do texto corrido
        const fullText = state.currentHino.letras
            .filter(l => l.tipo !== 'capa')
            .map(l =>
                `<div class="mb-4 ${l.tipo === 'refrão' ? 'font-bold italic' : ''}" ${l.tipo === 'refrão' ? 'style="color: #fde047;"' : ''}>${l.texto.replace(/\n/g, '<br>')}</div>`
            ).join('');
        content.html(`<div class="overflow-y-auto max-h-full w-full px-4 text-left custom-scrollbar pb-12">${fullText}</div>`);
        counter.addClass('hidden');
    } else {
        // Modo Slides (Versos/Coros)
        const letra = currentSlideData;
        content.html(`
            <div class="${letra.tipo === 'refrão' ? 'font-bold italic scale-105' : ''} transition-all duration-300"
                 ${letra.tipo === 'refrão' ? 'style="color: #fde047;"' : ''}>
                ${letra.texto.replace(/\n/g, '<br>')}
            </div>
        `);

        // Ajustar contador (subtrair 1 pois o 0 é capa)
        const totalSlidesReal = state.currentHino.letras.length - 1;
        const currentReal = state.currentSlide;
        counter.removeClass('hidden').text(`${currentReal}/${totalSlidesReal}`);
    }

    applySettings();
};

const nextSlide = () => {
    if (!state.currentHino) return;

    // Lógica Especial para Modo Completo: Capa (0) -> Texto (1)
    if (state.settings.isCompleto) {
        if (state.currentSlide === 0) {
            state.currentSlide = 1;
            renderHino();
        }
        return;
    }

    if (state.currentSlide < state.currentHino.letras.length - 1) {
        state.currentSlide++;
        renderHino();
    } else if (state.isPlaylistActive) {
        nextHino();
    }
};

const prevSlide = () => {
    if (!state.currentHino) return;

    // Lógica Especial para Modo Completo: Texto (1) -> Capa (0)
    if (state.settings.isCompleto) {
        if (state.currentSlide > 0) {
            state.currentSlide = 0;
            renderHino();
        }
        return;
    }

    if (state.currentSlide > 0) {
        state.currentSlide--;
        renderHino();
    }
};

const nextHino = () => {
    const currentIdx = state.hinos.findIndex(h => h.numero === state.currentHino?.numero);
    const nextIdx = (currentIdx + 1) % state.hinos.length;
    selectHino(state.hinos[nextIdx]);
};

const prevHino = () => {
    const currentIdx = state.hinos.findIndex(h => h.numero === state.currentHino?.numero);
    const prevIdx = (currentIdx - 1 + state.hinos.length) % state.hinos.length;
    selectHino(state.hinos[prevIdx]);
};

const scrollToSlide = () => {
    const preview = document.getElementById('slide-preview');
    preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// --- Vídeos ---
const updateVideos = (hino) => {
    const videoSection = $('#video-section');
    const videoList = $('#video-list');

    videoSection.removeClass('hidden');
    videoList.empty();

    // Em um sistema real, aqui buscaríamos vídeos do localStorage ou API
    // Para demo, vamos simular vídeos baseados no número do hino
    const videos = JSON.parse(localStorage.getItem(`videos_hino_${hino.numero}`) || '[]');

    if (videos.length === 0) {
        videoList.append('<p class="text-sm text-gray-400 italic">Nenhum vídeo personalizado adicionado.</p>');
    } else {
        videos.forEach(v => {
            const videoId = extractVideoId(v.url);
            videoList.append(`
                <div class="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg flex gap-3 items-center">
                    <img src="https://img.youtube.com/vi/${videoId}/default.jpg" class="w-20 rounded" alt="Thumbnail">
                    <div class="flex-grow">
                        <a href="${v.url}" target="_blank" class="text-sm font-semibold hover:text-orange-dark line-clamp-1">${v.title || 'Vídeo no YouTube'}</a>
                        <button class="text-xs text-red-500 mt-1" onclick="removeVideo(${hino.numero}, '${v.url}')">Remover</button>
                    </div>
                </div>
            `);
        });
    }
};

const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// --- Eventos ---
const setupEvents = () => {
    // Busca
    $('#btn-clear-search').on('click', () => {
        $('#hino-search').val('').focus();
    });

    // Navegação
    $('#btn-prev').on('click', prevSlide);
    $('#btn-next').on('click', nextSlide);
    $('#btn-random-hino').on('click', () => {
        const randIdx = Math.floor(Math.random() * state.hinos.length);
        selectHino(state.hinos[randIdx]);
    });

    // Configurações
    $('#btn-font-inc').on('click', () => { state.settings.fontSize += 0.1; applySettings(); saveSettings(); });
    $('#btn-font-dec').on('click', () => { state.settings.fontSize = Math.max(0.5, state.settings.fontSize - 0.1); applySettings(); saveSettings(); });

    $('#btn-line-inc').on('click', () => { state.settings.lineHeight = Number((state.settings.lineHeight + 0.1).toFixed(1)); applySettings(); saveSettings(); });
    $('#btn-line-dec').on('click', () => { state.settings.lineHeight = Math.max(1, Number((state.settings.lineHeight - 0.1).toFixed(1))); applySettings(); saveSettings(); });

    $('#font-family-select').on('change', function () {
        state.settings.fontFamily = $(this).val();
        applySettings();
        saveSettings();
    });

    $('#font-color-picker').on('input', function () {
        state.settings.fontColor = $(this).val();
        applySettings();
        saveSettings();
    });

    $('#bg-color-picker').on('input', function () {
        state.settings.bgColor = $(this).val();
        state.settings.showBackground = false; // Desativa fundo de imagem ao escolher cor
        applySettings();
        saveSettings();
    });

    $('#check-completo').on('change', function () {
        state.settings.isCompleto = $(this).checked;
        state.settings.isCompleto = $('#check-completo').is(':checked');
        renderHino();
        saveSettings();
        renderHino();
        saveSettings();
    });

    // Double click to advance (fullscreen/presentation feel)
    $('#slide-preview').on('dblclick', (e) => {
        // Prevent accidental zooms on mobile
        e.preventDefault();
        nextSlide();
    });

    $('#btn-toggle-bg').on('click', () => {
        state.settings.showBackground = !state.settings.showBackground;
        applySettings();
        saveSettings();
    });

    $('#btn-change-bg').on('click', () => {
        state.settings.bgIndex = (state.settings.bgIndex + 1) % BACKGROUNDS.length;
        state.settings.showBackground = true; // Forçar exibir se mudar
        applySettings();
        saveSettings();
    });

    $('#btn-toggle-theme').on('click', () => {
        state.settings.darkMode = !state.settings.darkMode;
        applySettings();
        saveSettings();
    });

    // Áudio
    const player = document.getElementById('audio-player');
    $('#btn-play-pause').on('click', () => {
        initAudioContext();
        if (player.paused) {
            player.play();
        } else {
            player.pause();
        }
    });

    player.onplay = () => {
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-play').addClass('fa-pause');

        // Intro Countdown
        if (countdownInterval) clearInterval(countdownInterval);
        const $countdown = $('#intro-countdown');
        if (state.currentHino && state.currentHino.introducao > 0 && player.currentTime < state.currentHino.introducao) {
            let count = Math.ceil(state.currentHino.introducao - player.currentTime);
            $countdown.removeClass('hidden').find('span').text(count);

            countdownInterval = setInterval(() => {
                const remaining = state.currentHino.introducao - player.currentTime;
                if (remaining <= 0 || player.paused) {
                    clearInterval(countdownInterval);
                    $countdown.addClass('hidden');
                } else {
                    $countdown.find('span').text(Math.ceil(remaining));
                }
            }, 100);
        } else {
            $countdown.addClass('hidden');
        }
    };

    player.onpause = () => {
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
        if (countdownInterval) clearInterval(countdownInterval);
        $('#intro-countdown').addClass('hidden');
    };

    $('#btn-stop').on('click', () => {
        player.pause();
        player.currentTime = 0;
        if (countdownInterval) clearInterval(countdownInterval);
        $('#intro-countdown').addClass('hidden');
    });

    // Barra de Progresso e Tempo
    player.ontimeupdate = () => {
        if (!player.duration) return;
        const progress = (player.currentTime / player.duration) * 100;
        $('#audio-progress-bar').css('width', `${progress}%`);
        $('#audio-seeker').val(progress);
        $('#current-time').text(formatTime(player.currentTime));

        // Playlist Auto-Scroll Logic (Modo Completo)
        if (state.isPlaylistActive && state.settings.isCompleto && state.currentHino) {
            const introTime = (typeof state.currentHino.introducao === 'number') ? state.currentHino.introducao : 8;

            // Auto-advance Cover -> Text
            if (state.currentSlide === 0 && player.currentTime > introTime) {
                nextSlide();
            }

            // Scroll Calculation (somente se estiver mostrando o texto)
            if (state.currentSlide > 0) {
                const container = $('#slide-content > div');
                if (container.length) {
                    const scrollHeight = container[0].scrollHeight;
                    const clientHeight = container[0].clientHeight;
                    const maxScroll = scrollHeight - clientHeight;

                    if (maxScroll > 0) {
                        // Calcular progresso relativo ao tempo de texto (pós-intro)
                        const textDuration = Math.max(1, player.duration - introTime);
                        const textCurrent = Math.max(0, player.currentTime - introTime);
                        const scrollProgress = textCurrent / textDuration;

                        // Rolar suavemente proporcional ao tempo restante
                        const targetScroll = maxScroll * Math.min(1, scrollProgress);
                        container.scrollTop(targetScroll);
                    }
                }
            }
        }
    };

    player.onloadedmetadata = () => {
        $('#total-duration').text(formatTime(player.duration));
        $('#current-time').text("0:00");
    };

    $('#audio-seeker').on('input', function () {
        const seekTo = (player.duration * $(this).val()) / 100;
        player.currentTime = seekTo;
        // Atualizar visualmente durante o deslizar para feedback imediato
        const progress = $(this).val();
        $('#audio-progress-bar').css('width', `${progress}%`);
        $('#current-time').text(formatTime(seekTo));
    });

    $('#btn-speed-fast, #btn-fs-speed-inc').on('click', () => {
        player.playbackRate = Math.min(2.0, player.playbackRate + 0.1);
        $('#speed-display, #fs-speed-display').text(player.playbackRate.toFixed(1) + 'x');
        if (state.currentHino) {
            localStorage.setItem(`speed_hino_${state.currentHino.numero}`, player.playbackRate.toFixed(1));
        }
    });

    $('#btn-speed-slow, #btn-fs-speed-dec').on('click', () => {
        player.playbackRate = Math.max(0.5, player.playbackRate - 0.1);
        $('#speed-display, #fs-speed-display').text(player.playbackRate.toFixed(1) + 'x');
        if (state.currentHino) {
            localStorage.setItem(`speed_hino_${state.currentHino.numero}`, player.playbackRate.toFixed(1));
        }
    });

    // Audio Filters Listeners
    $('#btn-audio-filters').on('click', () => {
        $('#modal-audio-filters').removeClass('hidden');
    });

    $('#range-gain').on('input', function () {
        initAudioContext();
        state.settings.audioFilters.gain = parseFloat($(this).val());
        applyAudioFilters();
        if (state.currentHino) {
            localStorage.setItem(`audio_filters_hino_${state.currentHino.numero}`, JSON.stringify(state.settings.audioFilters));
        }
    });

    $('#eq-bass, #eq-mid, #eq-treble').on('input', function () {
        initAudioContext();
        state.settings.audioFilters.bass = parseFloat($('#eq-bass').val());
        state.settings.audioFilters.mid = parseFloat($('#eq-mid').val());
        state.settings.audioFilters.treble = parseFloat($('#eq-treble').val());
        applyAudioFilters();
        if (state.currentHino) {
            localStorage.setItem(`audio_filters_hino_${state.currentHino.numero}`, JSON.stringify(state.settings.audioFilters));
        }
    });

    $('#btn-reset-audio').on('click', () => {
        state.settings.audioFilters = { ...DEFAULT_AUDIO_FILTERS };
        applyAudioFilters();
        if (state.currentHino) {
            localStorage.removeItem(`audio_filters_hino_${state.currentHino.numero}`);
        }
    });

    // Playlist
    // Playlist Iniciar (Aleatório + Fullscreen)
    $('#btn-playlist-toggle').on('click', async () => {
        initAudioContext();

        if (state.hinos.length === 0) return;

        state.isPlaylistActive = true;
        $('#btn-playlist-toggle').addClass('text-green-600').removeClass('text-gray-400');
        $('#btn-fs-skip-next').removeClass('hidden');

        // Selecionar Hino Aleatório
        const randIdx = Math.floor(Math.random() * state.hinos.length);
        await selectHino(state.hinos[randIdx]);

        // Entrar em Tela Cheia
        const elem = document.getElementById('slide-preview');
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }

        // Iniciar Áudio (com leve delay para garantir carregamento)
        setTimeout(() => {
            const player = document.getElementById('audio-player');
            if (player) {
                player.currentTime = 0;
                player.play().catch(e => console.warn("Autoplay bloqueado ou falhou:", e));
            }
        }, 1000);
    });

    $('#btn-playlist-stop').on('click', () => {
        state.isPlaylistActive = false;
        $('#btn-playlist-toggle').removeClass('text-green-600').addClass('text-gray-400');
        $('#btn-fs-skip-next').addClass('hidden');
    });

    player.onended = () => {
        if (state.isPlaylistActive) {
            nextHino();
            setTimeout(() => player.play(), 2000); // Delay entre hinos
        }
    };

    // Modais
    $('#btn-info').on('click', () => $('#modal-info').removeClass('hidden'));
    $('#btn-add-video').on('click', () => $('#modal-add-video').removeClass('hidden'));
    $('.btn-close-modal').on('click', () => {
        $('.glass-overlay').addClass('hidden');
    });

    $('#btn-save-video').on('click', () => {
        const url = $('#video-url-input').val();
        if (url && state.currentHino) {
            const videos = JSON.parse(localStorage.getItem(`videos_hino_${state.currentHino.numero}`) || '[]');
            videos.push({ url, title: 'Vídeo Carregado' });
            localStorage.setItem(`videos_hino_${state.currentHino.numero}`, JSON.stringify(videos));
            updateVideos(state.currentHino);
            $('#modal-add-video').addClass('hidden');
            $('#video-url-input').val('');
        }
    });

    // Custom Backgrounds
    $('#menu-custom-backgrounds').on('click', () => {
        $('#custom-bg-textarea').val(state.settings.customBackgrounds.join('\n'));
        $('#modal-custom-backgrounds').removeClass('hidden');
    });

    $('#btn-save-custom-bg').on('click', () => {
        const text = $('#custom-bg-textarea').val();
        const urls = text.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        state.settings.customBackgrounds = urls;
        updateBackgroundsList();
        saveSettings();
        applySettings();
        $('#modal-custom-backgrounds').addClass('hidden');
    });

    $('#btn-check-updates').on('click', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.update();
                alert('Verificando atualizações... Se houver uma nova versão, você será avisado.');
            });
        }
    });

    // Menus
    $('#btn-menu').on('click', (e) => {
        e.stopPropagation();
        $('#menu-dropdown').toggleClass('hidden');
    });

    $(document).on('click', () => {
        $('#menu-dropdown').addClass('hidden');
    });

    // Fullscreen Controls logic
    $('#btn-fs-play-pause').on('click', () => $('#btn-play-pause').click());
    $('#btn-fs-stop').on('click', () => $('#btn-stop').click());
    $('#btn-fs-restart').on('click', () => {
        player.currentTime = 0;
        player.play();
    });
    $('#btn-fs-change-bg').on('click', () => $('#btn-change-bg').click());
    $('#btn-fs-skip-next').on('click', () => {
        if (state.isPlaylistActive) {
            nextHino();
            setTimeout(() => {
                const player = document.getElementById('audio-player');
                if (player) player.play();
            }, 500);
        }
    });
    $('#btn-fs-exit').on('click', () => {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    });

    // Fullscreen Toggle
    $('#btn-fullscreen').on('click', () => {
        const elem = document.getElementById('slide-preview');
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    });

    // Monitor Fullscreen changes to adjust width & Stop Audio on Exit
    $(document).on('fullscreenchange webkitfullscreenchange mozfullscreenchange MSFullscreenChange', () => {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

        // Adjust Width
        const content = $('#slide-content');
        if (isFullscreen) {
            content.removeClass('max-w-2xl').addClass('max-w-[90vw]');
        } else {
            content.removeClass('max-w-[90vw]').addClass('max-w-2xl');

            // Stop Audio on Exit
            const player = document.getElementById('audio-player');
            if (player) {
                player.pause();
                player.currentTime = 0;
                $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
                if (typeof countdownInterval !== 'undefined' && countdownInterval) clearInterval(countdownInterval);
                $('#intro-countdown').addClass('hidden');
            }

            // Stop Playlist on Exit functionality
            if (state.isPlaylistActive) {
                state.isPlaylistActive = false;
                $('#btn-playlist-toggle').removeClass('text-green-600').addClass('text-gray-400');
                $('#btn-fs-skip-next').addClass('hidden');
            }
        }
    });

    // Teclado
    $(document).on('keydown', (e) => {
        if ($('input:focus').length) return;

        switch (e.key) {
            case 'ArrowRight': nextSlide(); break;
            case 'ArrowLeft': prevSlide(); break;
            case 'PageDown': nextHino(); break;
            case 'PageUp': prevHino(); break;
            case 'f': case 'F': $('#btn-toggle-bg').click(); break;
            case 'c': case 'C': $('#check-completo').click(); break;
            case '+': $('#btn-font-inc').click(); break;
            case '-': $('#btn-font-dec').click(); break;
            case 'ArrowUp': $('#btn-line-inc').click(); break;
            case 'ArrowDown': $('#btn-line-dec').click(); break;
            case 'b': case 'B': $('#btn-change-bg').click(); break;
            case 'Escape': $('.btn-close-modal').click(); break;
        }

        if (e.altKey && (e.key === 'r' || e.key === 'R')) {
            localStorage.removeItem('hinario_settings');
            location.reload();
        }
    });

    // Remote Control listener
    const bc = new BroadcastChannel('hinario_remote');
    bc.onmessage = (ev) => {
        const { action } = ev.data;

        switch (action) {
            case 'nextSlide': nextSlide(); break;
            case 'prevSlide': prevSlide(); break;
            case 'nextHino': nextHino(); break;
            case 'prevHino': prevHino(); break;
            case 'togglePlay': $('#btn-play-pause').click(); break;
            case 'stopAudio': $('#btn-stop').click(); break;
            case 'toggleFullscreen': $('#btn-fullscreen').click(); break;
            case 'toggleBg': $('#btn-toggle-bg').click(); break;
            case 'toggleComplete': $('#check-completo').click(); break;
        }
    };

    $('#btn-remote').on('click', () => {
        window.open('remote-control.html', 'remote_control', 'width=400,height=700');
    });

    // Exibir funções globais se necessário
    const exportData = () => {
        const data = {
            settings: JSON.parse(localStorage.getItem('hinario_settings') || '{}'),
            hinoSpeeds: {},
            hinoVideos: {},
            hinoFilters: {}
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('speed_hino_')) {
                data.hinoSpeeds[key] = localStorage.getItem(key);
            } else if (key.startsWith('videos_hino_')) {
                data.hinoVideos[key] = JSON.parse(localStorage.getItem(key));
            } else if (key.startsWith('audio_filters_hino_')) {
                data.hinoFilters[key] = JSON.parse(localStorage.getItem(key));
            }
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hinario-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.settings) localStorage.setItem('hinario_settings', JSON.stringify(data.settings));
                if (data.hinoSpeeds) {
                    Object.entries(data.hinoSpeeds).forEach(([key, val]) => localStorage.setItem(key, val));
                }
                if (data.hinoVideos) {
                    Object.entries(data.hinoVideos).forEach(([key, val]) => localStorage.setItem(key, JSON.stringify(val)));
                }
                if (data.hinoFilters) {
                    Object.entries(data.hinoFilters).forEach(([key, val]) => localStorage.setItem(key, JSON.stringify(val)));
                }
                alert('Dados importados com sucesso! Recarregando...');
                location.reload();
            } catch (err) {
                alert('Erro ao importar arquivo. Verifique se o formato está correto.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    $('#btn-export-settings').on('click', exportData);
    $('#btn-import-settings').on('click', () => $('#import-file').click());
    $('#import-file').on('change', importData);

    // Download MP3
    $('#btn-download-current').on('click', handleDownload);
    $('#menu-download-mp3').on('click', (e) => {
        e.preventDefault();
        downloadMP3s();
    });

    setupZoom();
};

// Download MP3
const downloadMP3s = async () => {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressContainer = document.getElementById('download-progress');

    if (!('caches' in window)) {
        alert("Seu navegador não suporta cache offline.");
        return;
    }

    progressContainer.classList.remove('hidden');
    const cache = await caches.open('mp3-cache');

    // Vamos sincronizar os primeiros 196 hinos (ajustável conforme hinos.js)
    const total = 196;
    let downloaded = 0;

    const BATCH_SIZE = 5;
    const BATCH_DELAY = 1000;

    for (let i = 1; i <= total; i += BATCH_SIZE) {
        const batch = [];
        for (let j = i; j < i + BATCH_SIZE && j <= total; j++) {
            const numStr = j.toString().padStart(3, '0');
            const url = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/${numStr}-piano.mp3`;
            batch.push(url);
        }

        await Promise.all(batch.map(async (url) => {
            try {
                const cachedResponse = await cache.match(url);
                if (!cachedResponse) {
                    const response = await fetchWithRetry(url, 3, 1000);
                    const blob = await response.blob();
                    await cache.put(url, new Response(blob, {
                        headers: { 'date': new Date().toUTCString(), 'content-type': 'audio/mpeg' }
                    }));
                }
            } catch (e) {
                console.error(`Erro ao baixar ${url}:`, e);
            } finally {
                downloaded++;
                const percent = Math.round((downloaded / total) * 100);
                if (progressBar) progressBar.style.width = `${percent}%`;
                if (progressText) progressText.textContent = `${downloaded}/${total}`;
            }
        }));

        if (i + BATCH_SIZE <= total) {
            await new Promise(r => setTimeout(r, BATCH_DELAY));
        }
    }

    setTimeout(() => {
        progressContainer.classList.add('hidden');
        alert("Sincronização de hinos concluída!");
    }, 1000);
};

const handleDownload = async () => {
    if (!state.currentHino) {
        alert("Por favor, selecione um hino primeiro.");
        return;
    }

    const hino = state.currentHino;
    const numStr = hino.numero.toString().padStart(3, '0');
    const audioUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/${numStr}-piano.mp3`;
    const filename = `${numStr} - ${hino.titulo}.mp3`;

    const btn = $('#btn-download-current');
    const originalIcon = btn.find('i').attr('class');

    try {
        btn.find('i').attr('class', 'fas fa-spinner fa-spin');

        // Tenta pegar do cache primeiro se existir
        let blob;
        if ('caches' in window) {
            const cache = await caches.open('mp3-cache');
            const cachedResponse = await cache.match(audioUrl);
            if (cachedResponse) {
                blob = await cachedResponse.blob();
            }
        }

        if (!blob) {
            const response = await fetch(audioUrl);
            if (!response.ok) throw new Error('Falha no download');
            blob = await response.blob();
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error("Erro ao baixar áudio:", error);
        window.open(audioUrl, '_blank');
    } finally {
        btn.find('i').attr('class', originalIcon);
    }
};

// Zoom functionality (Shift + hover)
const setupZoom = () => {
    $(document).on('mouseover', '#slide-content *', function (e) {
        if (e.shiftKey && state.settings.isCompleto) {
            $(this).addClass('zoom-effect');
        }
    }).on('mouseout', '#slide-content *', function () {
        $(this).removeClass('zoom-effect');
    });
};

// CSS for zoom
$('<style>').text(`
    .zoom-effect {
        display: inline-block;
        transform: scale(1.6);
        transition: transform 0.2s;
        z-index: 50;
        position: relative;
        background: rgba(234, 88, 12, 0.4);
        padding: 0 4px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
`).appendTo('head');

// --- Inicialização ---
$(document).ready(() => {
    loadSettings();
    initHinos();
    setupEvents();
});

// Expor funções globais se necessário
window.removeVideo = (hinoNum, url) => {
    let videos = JSON.parse(localStorage.getItem(`videos_hino_${hinoNum}`) || '[]');
    videos = videos.filter(v => v.url !== url);
    localStorage.setItem(`videos_hino_${hinoNum}`, JSON.stringify(videos));
    if (state.currentHino && state.currentHino.numero === hinoNum) {
        updateVideos(state.currentHino);
    }
};
