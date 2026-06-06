import { DEFAULT_BACKGROUNDS } from './src/constants/defaults.js';
import { broadcast, broadcastState, setupBroadcastListeners, remoteChannel } from './src/services/broadcastService.js';
import { cacheService } from './src/services/cacheService.js';
import { settingsService } from './src/services/settingsService.js';
import { uiUtils } from './src/utils/uiUtils.js';
import { audioUtils } from './src/utils/audioUtils.js';
import { audioPlayer } from './src/components/audioPlayer.js';
import { hinoLoader } from './src/utils/hinoLoader.js';
import { hinoRenderer } from './src/components/hinoRenderer.js';
import { obsService } from './src/services/obsService.js';
import { state } from './src/state.js';
import { searchLogic } from './src/utils/searchLogic.js';

// --- Globals ---
let BACKGROUNDS = [...DEFAULT_BACKGROUNDS];
let countdownInterval = null;
let cachedJsonCount = 0;
let cachedMp3Count = 0;
let cacheVersion = '1.0.1'; // Atualizado para forçar refresh dos hinos com vídeos
const APP_VERSION = window.APP_VERSION || '2026.04.17.1';
const fullscreenWarningTimeout = { current: null };

// Auto-scroll variables
let autoScrollInterval = null;
let autoScrollStartTime = 0;
let autoScrollDelay = 0;
const AUTO_SCROLL_TITLE_DELAY = 2000; // 2 segundos para mostrar título

// Playlist timeout tracking
let playlistTimeouts = [];

const clearAllPlaylistTimeouts = () => {
    console.log('DEBUG: Limpando', playlistTimeouts.length, 'timeouts pendentes');
    playlistTimeouts.forEach(id => clearTimeout(id));
    playlistTimeouts = [];
};

const saveSettings = () => localStorage.setItem('hinario_settings', JSON.stringify(state.settings));

const applySettings = () => {
    const body = document.body;
    body.classList.toggle('dark', state.settings.darkMode);

    // Ajustar cores padrão baseado no tema se não houver cor personalizada manual
    if (state.settings.darkMode) {
        // Modo escuro: texto claro, fundo escuro
        if (state.settings.fontColor === '#000000') state.settings.fontColor = '#FFFFFF';
        if (state.settings.bgColor === '#FFFFFF') state.settings.bgColor = '#000000';
    } else {
        // Modo claro: texto escuro, fundo claro
        if (state.settings.fontColor === '#FFFFFF') state.settings.fontColor = '#000000';
        if (state.settings.bgColor === '#000000') state.settings.bgColor = '#FFFFFF';
    }

    const $btnToggleBg = $('#btn-toggle-bg');
    if (state.settings.showBackground) {
        $btnToggleBg.css('background-color', '').addClass('bg-orange-dark').removeClass('bg-gray-500');
    } else {
        $btnToggleBg.css('background-color', '#6b7280').addClass('bg-gray-500').removeClass('bg-orange-dark');
    }

    $('#slide-content').css({
        'font-family': state.settings.fontFamily,
        'font-size': `${state.settings.fontSize}rem`,
        'line-height': state.settings.lineHeight,
        'color': state.settings.fontColor,
        'font-weight': 600
    });

    $('#slide-content h1').css({
        'font-size': `${(state.settings.fontSize || 1.5) * 1.3}rem`
    });

    $('#font-size-display').text(`${(Number(state.settings.fontSize) || 1.5).toFixed(2)}rem`);
    $('#line-height-display').text(state.settings.lineHeight || 1.4);
    $('#font-family-select').val(state.settings.fontFamily);
    $('#font-color-picker').val(state.settings.fontColor);
    $('#bg-color-picker').val(state.settings.bgColor || '#000000');
    $('#check-completo').prop('checked', state.settings.isCompleto);

    if (state.settings.showBackground) {
        const bgUrl = BACKGROUNDS[state.settings.bgIndex || 0];
        $('#slide-bg').removeClass('hidden').css({
            'background-image': `url('${bgUrl}')`,
            'background-color': 'transparent'
        });
        $('#slide-bg-overlay').removeClass('hidden');
        $('#slide-content').css('text-shadow', '2px 2px 8px rgba(0,0,0,0.9), 0px 0px 10px rgba(0,0,0,0.5)');
    } else {
        $('#slide-bg').addClass('hidden');
        $('#slide-bg-overlay').addClass('hidden');
        $('#slide-preview').css('background-color', state.settings.bgColor || '#000000');
        $('#slide-content').css('text-shadow', 'none');
    }
};

const loadSettings = () => {
    const saved = localStorage.getItem('hinario_settings');
    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state.settings, parsed);
    }
    
    // Garantir que customBackgrounds seja um array válido
    if (!Array.isArray(state.settings.customBackgrounds)) {
        state.settings.customBackgrounds = [];
    }
    
    BACKGROUNDS = [...DEFAULT_BACKGROUNDS, ...state.settings.customBackgrounds];
    applySettings();
    
    // Atualizar a lista de fundos customizados na UI se o elemento existir
    const $list = $('#custom-bg-list');
    if ($list.length) {
        $list.empty();
        state.settings.customBackgrounds.forEach((bg, index) => {
            const $item = $(`
                <div class="flex items-center justify-between bg-gray-100 p-2 rounded-lg group">
                    <span class="truncate text-xs flex-1 mr-2">${bg}</span>
                    <button class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1" onclick="window.removeCustomBg(${index})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `);
            $list.append($item);
        });
    }

    if (state.audioCtx) audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters);
};

// --- Orquestração de Áudio ---
const initAudio = () => {
    if (state.audioCtx) return;
    const ctxData = audioUtils.initAudioContext(state, {
        applyFilters: audioUtils.applyAudioFilters
    });
    if (ctxData) Object.assign(state, ctxData);
};

const loadAudio = (numero) => {
    return audioPlayer.loadAudio(numero, state, {
        updateDisplay: () => {
            cacheService.initializeCounters().then(counts => {
                cachedJsonCount = counts.json;
                cachedMp3Count = counts.mp3;
                uiUtils.updateCacheDisplay(cachedJsonCount, cachedMp3Count);
            });
        },
        applyFilters: () => audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters),
        broadcastFilters: () => broadcast('audioFiltersState', state.settings.audioFilters)
    });
};

// --- Navegação ---
const renderHino = () => hinoRenderer.renderHino(state, { applySettings });

const nextSlide = () => {
    if (!state.currentHino) return;
    if (state.settings.isCompleto) {
        if (state.currentSlide === 0) { state.currentSlide = 1; renderHino(); }
        return;
    }
    if (state.currentSlide < state.currentHino.letras.length - 1) {
        state.currentSlide++;
        renderHino();
    } else if (state.isPlaylistActive) {
        playlistNextRandom();
    }
};

const prevSlide = () => {
    if (!state.currentHino || state.currentSlide <= 0) return;
    state.currentSlide--;
    renderHino();
};

const nextHino = () => {
    const idx = state.hinos.findIndex(h => h.numero === state.currentHino?.numero);
    return selectHino(state.hinos[(idx + 1) % state.hinos.length]);
};

const prevHino = () => {
    const idx = state.hinos.findIndex(h => h.numero === state.currentHino?.numero);
    return selectHino(state.hinos[(idx - 1 + state.hinos.length) % state.hinos.length]);
};

const scrollUp = () => {
    stopAutoScroll();
    if (state.settings.isCompleto) {
        const container = $('#slide-content > div');
        if (container.length) {
            container.scrollTop(container.scrollTop() - 100);
        }
    } else {
        prevSlide();
    }
};

const scrollDown = () => {
    stopAutoScroll();
    if (state.settings.isCompleto) {
        const container = $('#slide-content > div');
        if (container.length) {
            container.scrollTop(container.scrollTop() + 100);
        }
    } else {
        nextSlide();
    }
};

const playlistNextRandom = async () => {
    if (state.hinos.length === 0) return;
    const randIdx = Math.floor(Math.random() * state.hinos.length);
    await selectHino(state.hinos[randIdx]);
};

const randomHino = async () => {
    if (state.hinos.length === 0) return;
    const randIdx = Math.floor(Math.random() * state.hinos.length);
    await selectHino(state.hinos[randIdx]);
};

// Expor para uso no broadcast listener
window.__playlistNextRandom = playlistNextRandom;

// --- Auto-scroll Functions ---
const stopAutoScroll = () => {
    console.log('DEBUG: stopAutoScroll executado, interval:', autoScrollInterval);
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
        console.log('DEBUG: Interval limpo');
    }
};

const startAutoScroll = (scrollDuration) => {
    console.log('DEBUG: startAutoScroll chamado, duration:', scrollDuration, 'isPlaylistActive:', state.isPlaylistActive);
    
    // Só executar se a playlist estiver ativa
    if (!state.isPlaylistActive) {
        console.log('DEBUG: Playlist não está ativa, cancelando startAutoScroll');
        return;
    }
    
    stopAutoScroll();

    const container = $('#slide-content > div');
    if (!container.length) return;

    const scrollHeight = container[0].scrollHeight - container[0].clientHeight;
    if (scrollHeight <= 0) return;

    const scrollStep = scrollHeight / (scrollDuration * 60); // 60fps
    let currentScroll = 0;

    autoScrollInterval = setInterval(() => {
        // Verificar se playlist ainda está ativa
        if (!state.isPlaylistActive) {
            stopAutoScroll();
            return;
        }
        currentScroll += scrollStep;
        if (currentScroll >= scrollHeight) {
            currentScroll = scrollHeight;
            stopAutoScroll();
        }
        container.scrollTop(currentScroll);
    }, 1000 / 60);
};

const initPlaylistAutoScroll = async () => {
    if (!state.isPlaylistActive || !state.currentHino) return;

    const player = document.getElementById('audio-player');
    if (!player) return;

    // Aguardar o áudio estar pronto para obter a duração
    const waitForDuration = () => new Promise((resolve) => {
        if (player.duration && !isNaN(player.duration)) {
            resolve(player.duration);
            return;
        }
        const checkDuration = () => {
            if (player.duration && !isNaN(player.duration)) {
                player.removeEventListener('loadedmetadata', checkDuration);
                resolve(player.duration);
            }
        };
        player.addEventListener('loadedmetadata', checkDuration);
        setTimeout(() => resolve(player.duration || 180), 5000);
    });

    const duration = await waitForDuration();

    // Passo 1: Aguardar 2 segundos (slide de apresentação do título)
    const titleTimeout = setTimeout(() => {
        if (!state.isPlaylistActive || !state.currentHino) return;

        // Passo 2: Mudar para modo completo (mostrar letra inteira)
        state.settings.isCompleto = true;
        state.currentSlide = 1;
        renderHino();
        applySettings();

        // Passo 3: Verificar se há contador de introdução
        const hasIntroCountdown = state.currentHino.introducao && state.currentHino.introducao > 0;

        if (hasIntroCountdown) {
            // Aguardar o contador de introdução terminar
            const introSeconds = state.currentHino.introducao;

            const checkIntroComplete = setInterval(() => {
                if (!state.isPlaylistActive) {
                    clearInterval(checkIntroComplete);
                    return;
                }

                const currentTime = player.currentTime || 0;
                const introRemaining = introSeconds - currentTime;

                // Quando o contador acabar (currentTime >= introducao), iniciar rolagem
                if (currentTime >= introSeconds || introRemaining <= 0) {
                    clearInterval(checkIntroComplete);

                    const remainingDuration = duration - currentTime;
                    // Subtrair 2% para terminar antes do final
                    const scrollDuration = remainingDuration * 0.98;

                    if (scrollDuration > 5) {
                        const scrollTimeout = setTimeout(() => {
                            if (state.isPlaylistActive) startAutoScroll(scrollDuration);
                        }, 100);
                        playlistTimeouts.push(scrollTimeout);
                    }
                }
            }, 100);
        } else {
            // Sem contador: iniciar rolagem imediatamente
            // Subtrair 2% para terminar antes do final
            const scrollDuration = duration * 0.98;

            if (scrollDuration > 5) {
                const scrollTimeout = setTimeout(() => {
                    if (state.isPlaylistActive) startAutoScroll(scrollDuration);
                }, 100);
                playlistTimeouts.push(scrollTimeout);
            }
        }
    }, AUTO_SCROLL_TITLE_DELAY);
    
    playlistTimeouts.push(titleTimeout);
};

const selectHino = async (hinoOrIndex) => {
    const numero = typeof hinoOrIndex === 'number' ? hinoOrIndex : hinoOrIndex?.numero;
    if (!numero) return;
    const hino = state.hinos.find(h => h.numero === numero);
    if (!hino) return;

    if (!hino.loaded) {
        uiUtils.showDownloadStatus(true);
        const numStr = hino.numero.toString().padStart(3, '0');
        const url = `data/hinos/${numStr}.json`;
        
        try {
            let res;
            if ('caches' in window) {
                const cache = await caches.open('json-cache');
                res = await cache.match(url);
                if (!res) {
                    res = await fetch(url);
                    if (res.ok) await cache.put(url, res.clone());
                }
            } else {
                res = await fetch(url);
            }

            const rawData = await res.json();
            const transformed = hinoLoader.transformHinos([rawData])[0];
            Object.assign(hino, transformed, { loaded: true });
        } catch (e) {
            console.error("Erro ao carregar hino:", e);
        } finally {
            uiUtils.showDownloadStatus(false);
        }
    }

    state.currentHino = hino;
    state.currentSlide = 0;
    renderHino();
    await loadAudio(hino.numero);
    $('#hino-search').val(`${hino.numero} - ${hino.titulo}`).blur();
    hinoRenderer.updateVideos(hino);
    document.getElementById('slide-preview').scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Iniciar rolagem automática em modo playlist
    if (state.isPlaylistActive) {
        initPlaylistAutoScroll();
    }
};

// --- Busca ---
const setupSearch = () => {
    const $input = $("#hino-search");
    const $results = $("#search-results");
    let selectedIndex = -1;
    let filteredHinos = [];

    const renderResults = (hinos) => {
        filteredHinos = hinos;
        if (hinos.length === 0) return $results.addClass('hidden');
        
        $results.html(hinos.map((h, i) => `
            <div class="search-item p-3 cursor-pointer transition-colors border-b last:border-0 dark:border-gray-700 ${i === selectedIndex ? 'bg-orange-dark text-white' : 'hover:bg-orange-100 dark:hover:bg-orange-900/30'}" data-index="${i}">
                <div class="font-bold flex justify-between items-center">
                    <span>${h.numero} - ${h.titulo}</span>
                    <span class="text-[10px] opacity-50">#${h.numero}</span>
                </div>
            </div>
        `).join('')).removeClass('hidden');
    };

    $input.on('input', function() {
        const matches = searchLogic.filterHinos(state.hinos, $(this).val());
        selectedIndex = -1;
        renderResults(matches);
    });

    $input.on('keydown', function(e) {
        if ($results.hasClass('hidden')) return;

        const prevIndex = selectedIndex;
        selectedIndex = searchLogic.handleKeyboardNavigation(e, selectedIndex, filteredHinos.length);

        if (e.key === 'Escape') {
            $results.addClass('hidden');
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const hino = selectedIndex > -1 ? filteredHinos[selectedIndex] : filteredHinos[0];
            if (hino) selectHino(hino);
            $results.addClass('hidden');
        } else if (prevIndex !== selectedIndex) {
            renderResults(filteredHinos);
        }
    });

    $results.on('click', '.search-item', function() {
        selectHino(filteredHinos[$(this).data('index')]);
        $results.addClass('hidden');
    });
};

// --- Eventos ---
const setupEvents = () => {
    $('#btn-clear-search').on('click', () => {
        $('#hino-search').val('').focus();
        $('#search-results').addClass('hidden');
        
        // Limpar o hino carregado da tela
        state.currentHino = null;
        state.currentSlide = 0;
        $('#slide-content').empty();
        $('#video-list').empty();
        $('#video-section').addClass('hidden');
        
        // Parar o áudio se estiver tocando
        const player = document.getElementById('audio-player');
        if (player) {
            player.pause();
            player.currentTime = 0;
            $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
            if (countdownInterval) clearInterval(countdownInterval);
            $('#intro-countdown').addClass('hidden');
            broadcastState(state, player);
        }

        // Resetar o fundo se não estiver no modo background fixo
        if (!state.settings.showBackground) {
            $('#slide-bg').addClass('hidden');
        }
    });

    // Clique duplo no campo de busca para limpar tudo
    $('#hino-search').on('dblclick', () => {
        $('#btn-clear-search').click();
    });

    $('#btn-prev').on('click', () => { stopAutoScroll(); prevSlide(); });
    $('#btn-next').on('click', () => { stopAutoScroll(); nextSlide(); });
    $('#btn-random-hino').on('click', () => {
        if (!state.hinos.length) return;
        const randIdx = Math.floor(Math.random() * state.hinos.length);
        selectHino(state.hinos[randIdx]);
    });
    $('#btn-font-inc').on('click', () => { state.settings.fontSize += 0.1; applySettings(); saveSettings(); });
    $('#btn-font-dec').on('click', () => { state.settings.fontSize = Math.max(0.5, state.settings.fontSize - 0.1); applySettings(); saveSettings(); });
    
    $('#btn-line-inc').on('click', () => { state.settings.lineHeight = Number((state.settings.lineHeight + 0.1).toFixed(1)); applySettings(); saveSettings(); });
    $('#btn-line-dec').on('click', () => { state.settings.lineHeight = Math.max(1, Number((state.settings.lineHeight - 0.1).toFixed(1))); applySettings(); saveSettings(); });

    $('#font-family-select').on('change', function() {
        state.settings.fontFamily = $(this).val();
        applySettings();
        saveSettings();
    });

    $('#font-color-picker').on('input', function() {
        state.settings.fontColor = $(this).val();
        applySettings();
        saveSettings();
    });

    $('#bg-color-picker').on('input', function() {
        state.settings.bgColor = $(this).val();
        state.settings.showBackground = false; 
        applySettings();
        saveSettings();
    });

    $('#menu-manage-videos').on('click', (e) => {
        e.preventDefault();
        $('#video-section').toggleClass('hidden');
    });

    // Toggle Aparência no Mobile
    $('#toggle-appearance').on('click', () => {
        if (window.innerWidth < 768) {
            const content = $('#appearance-content');
            const icon = $('#appearance-icon');
            content.toggleClass('hidden');
            icon.toggleClass('rotate-180');
        }
    });

    $('#btn-toggle-theme').on('click', () => {
        state.settings.darkMode = !state.settings.darkMode;
        applySettings();
        saveSettings();
    });

    $('#btn-change-bg, #btn-fs-change-bg').on('click', () => {
        console.log('DEBUG: btn-change-bg clicked');
        console.log('DEBUG: BACKGROUNDS.length =', BACKGROUNDS.length);
        console.log('DEBUG: current bgIndex =', state.settings.bgIndex);
        state.settings.bgIndex = (state.settings.bgIndex + 1) % BACKGROUNDS.length;
        state.settings.showBackground = true;
        console.log('DEBUG: new bgIndex =', state.settings.bgIndex);
        console.log('DEBUG: new bgUrl =', BACKGROUNDS[state.settings.bgIndex]);
        applySettings();
        saveSettings();
        const player = document.getElementById('audio-player');
        broadcastState(state, player);
    });

    $('#btn-toggle-bg').on('click', () => {
        state.settings.showBackground = !state.settings.showBackground;
        applySettings();
        saveSettings();
        const player = document.getElementById('audio-player');
        broadcastState(state, player);
    });

    $('#btn-fullscreen').on('click', () => {
        const elem = document.getElementById('slide-preview');
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    });

    $('#check-completo').on('change', function() {
        state.settings.isCompleto = $(this).is(':checked');
        renderHino();
        saveSettings();
        broadcast('completeState', state.settings.isCompleto);
    });

    const player = document.getElementById('audio-player');
    $('#btn-play-pause, #btn-fs-play-pause').on('click', () => {
        if (!state.currentHino) return alert("Selecione um hino primeiro.");
        initAudio();
        player.paused ? player.play() : player.pause();
    });

    $('#btn-stop, #btn-fs-stop').on('click', () => {
        player.pause();
        player.currentTime = 0;
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
        if (countdownInterval) clearInterval(countdownInterval);
        $('#intro-countdown').addClass('hidden');
        broadcastState(state, player);
    });

    $('#btn-fs-restart').on('click', () => {
        player.currentTime = 0;
        player.play();
        broadcastState(state, player);
    });

    $('#btn-fs-exit').on('click', () => {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    });

    $('#btn-fs-speed-dec, #btn-speed-slow').on('click', () => {
        player.playbackRate = Math.max(0.5, player.playbackRate - 0.1);
        $('#speed-display, #fs-speed-display').text(player.playbackRate.toFixed(1) + 'x');
        broadcast('speedState', player.playbackRate);
    });

    $('#btn-fs-speed-inc, #btn-speed-fast').on('click', () => {
        player.playbackRate = Math.min(2.0, player.playbackRate + 0.1);
        $('#speed-display, #fs-speed-display').text(player.playbackRate.toFixed(1) + 'x');
        broadcast('speedState', player.playbackRate);
    });

    $('#btn-audio-filters').on('click', () => {
        $('#modal-audio-filters').removeClass('hidden');
    });

    // Gerenciamento de Vídeos
    $('#btn-add-video').on('click', () => {
        if (!state.currentHino) return alert("Selecione um hino primeiro.");
        $('#modal-add-video').removeClass('hidden');
    });

    $('#btn-save-video').on('click', () => {
        const url = $('#video-url-input').val().trim();
        if (!url) return alert("Insira uma URL do YouTube.");

        const hinoNum = state.currentHino.numero;
        const videos = JSON.parse(localStorage.getItem(`videos_hino_${hinoNum}`) || '[]');
        
        if (videos.some(v => v.url === url)) return alert("Este vídeo já foi adicionado.");

        videos.push({ url, title: "Vídeo Personalizado" });
        localStorage.setItem(`videos_hino_${hinoNum}`, JSON.stringify(videos));
        
        $('#video-url-input').val('');
        $('#modal-add-video').addClass('hidden');
        hinoRenderer.updateVideos(state.currentHino);
    });

    $('.btn-close-modal').on('click', function() {
        $(this).closest('.fixed').addClass('hidden');
    });

    $('#btn-download-current').on('click', handleDownload);

    // Playlist Automática
    $('#btn-playlist-toggle').on('click', async function() {
        if (state.isPlaylistActive) {
            $('#btn-playlist-stop').click();
            return;
        }
        
        initAudio();
        if (state.hinos.length === 0) return;

        state.isPlaylistActive = true;
        $(this).addClass('text-green-600').removeClass('text-gray-400');
        $('#btn-playlist-stop').addClass('text-gray-400').removeClass('text-red-600');
        $('#btn-fs-skip-next').removeClass('hidden');
        broadcast('playlistState', true);

        // Entrar em Tela Cheia (antes do await para manter o gesto do usuário válido)
        const elem = document.getElementById('slide-preview');
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.error(`Erro ao tentar entrar em tela cheia: ${err.message}`);
            });
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }

        // Selecionar Hino Aleatório
        const randIdx = Math.floor(Math.random() * state.hinos.length);
        await selectHino(state.hinos[randIdx]);

        // Tocar áudio (loadAudio já foi aguardado dentro de selectHino)
        const plPlayer = document.getElementById('audio-player');
        if (plPlayer) {
            plPlayer.currentTime = 0;
            plPlayer.play().catch(e => console.warn("Autoplay bloqueado ou falhou:", e));
        }
    });

    $('#btn-playlist-next, #btn-fs-skip-next').on('click', async () => {
        await nextHino();
        
        // loadAudio já foi aguardado dentro de selectHino/nextHino
        const plPlayer = document.getElementById('audio-player');
        if (plPlayer) {
            plPlayer.play().catch(e => console.warn("Autoplay ao avançar playlist falhou:", e));
        }
    });

    $('#btn-playlist-stop').on('click', function() {
        state.isPlaylistActive = false;
        $(this).addClass('text-red-600').removeClass('text-gray-400');
        $('#btn-playlist-toggle').addClass('text-gray-400').removeClass('text-green-600');
        $('#btn-fs-skip-next').addClass('hidden');
        
        // Parar o áudio imediatamente ao parar a playlist
        const player = document.getElementById('audio-player');
        if (player) {
            player.pause();
            player.currentTime = 0;
            // Atualizar ícones imediatamente
            $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
            if (countdownInterval) clearInterval(countdownInterval);
            $('#intro-countdown').addClass('hidden');
        }
        
        broadcast('playlistState', false);
    });

    // Atalhos de Teclado
    $(document).on('keydown', (e) => {
        if ($(e.target).is('input, textarea, select')) return;

        switch (e.key) {
            case 'ArrowRight':
            case ' ':
                e.preventDefault();
                stopAutoScroll(); // Parar rolagem automática
                nextSlide();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                stopAutoScroll(); // Parar rolagem automática
                prevSlide();
                break;
            case 'ArrowUp':
                stopAutoScroll(); // Parar rolagem automática
                if (state.settings.isCompleto) {
                    const container = $('#slide-content > div');
                    container.scrollTop(container.scrollTop() - 50);
                } else {
                    prevHino();
                }
                break;
            case 'ArrowDown':
                stopAutoScroll(); // Parar rolagem automática
                if (state.settings.isCompleto) {
                    const container = $('#slide-content > div');
                    container.scrollTop(container.scrollTop() + 50);
                } else {
                    nextHino();
                }
                break;
            case 'Home':
                stopAutoScroll(); // Parar rolagem automática
                state.currentSlide = 0;
                renderHino();
                break;
            case 'End':
                stopAutoScroll(); // Parar rolagem automática
                if (state.currentHino) {
                    state.currentSlide = state.currentHino.letras.length - 1;
                    renderHino();
                }
                break;
            case 'f':
            case 'F':
                $('#btn-toggle-bg').click();
                break;
            case 'b':
            case 'B':
                $('#btn-change-bg').click();
                break;
            case 'c':
            case 'C':
                $('#check-completo').click();
                break;
            case 'r':
            case 'R':
                if (e.altKey) {
                    localStorage.removeItem('hinario_settings');
                    location.reload();
                }
                break;
            case 'F8':
                e.preventDefault();
                $('#menu-remote-control').click();
                break;
            case 'Escape':
                $('.btn-close-modal').click();
                if (document.fullscreenElement) document.exitFullscreen();
                break;
        }
    });

    // Swipe Gestures
    let touchstartX = 0;
    let touchendX = 0;
    const preview = document.getElementById('slide-preview');

    preview.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
    }, { passive: true });

    preview.addEventListener('touchend', e => {
        touchendX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    const handleSwipe = () => {
        const threshold = 50;
        if (touchendX < touchstartX - threshold) { stopAutoScroll(); nextSlide(); }
        if (touchendX > touchstartX + threshold) { stopAutoScroll(); prevSlide(); }
    };

    // Filtros de Áudio (Equalizador)
    $('#range-gain').on('input', function() {
        initAudio();
        state.settings.audioFilters.gain = parseFloat($(this).val());
        audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters);
        broadcast('audioFiltersState', state.settings.audioFilters);
    });

    $('#eq-bass, #eq-mid, #eq-treble').on('input', function() {
        initAudio();
        const type = $(this).attr('id').split('-')[1]; // bass, mid, treble
        state.settings.audioFilters[type] = parseInt($(this).val());
        audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters);
        broadcast('audioFiltersState', state.settings.audioFilters);
    });

    $('#btn-reset-filters').on('click', () => {
        state.settings.audioFilters = { gain: 1.2, bass: 0, mid: -5, treble: 12 };
        audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters);
        broadcast('audioFiltersState', state.settings.audioFilters);
    });

    $('.btn-close-modal').on('click', function() {
        $(this).closest('.fixed').addClass('hidden');
    });

    player.onplay = () => {
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-play').addClass('fa-pause');
        broadcastState(state, player);

        // Contagem Regressiva da Introdução
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
        broadcastState(state, player);
        if (countdownInterval) clearInterval(countdownInterval);
        $('#intro-countdown').addClass('hidden');
    };

    player.onended = () => {
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
        if (countdownInterval) clearInterval(countdownInterval);
        $('#intro-countdown').addClass('hidden');
        stopAutoScroll(); // Parar rolagem automática

        if (state.isPlaylistActive) {
            playlistNextRandom();
        } else {
            broadcastState(state, player);
        }
    };

    player.onstop = () => {
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
        if (countdownInterval) clearInterval(countdownInterval);
        $('#intro-countdown').addClass('hidden');
        // Não para a rolagem automática - apenas pausa o áudio
        broadcastState(state, player);
    };

    player.onabort = () => {
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
        if (countdownInterval) clearInterval(countdownInterval);
        $('#intro-countdown').addClass('hidden');
        // Não para a rolagem automática - apenas pausa o áudio
        broadcastState(state, player);
    };

    const $audioProgressBar = $('#audio-progress-bar');
    const $audioSeeker = $('#audio-seeker');
    const $fsProgressBar = $('#fs-progress-bar');
    const $fsAudioSeeker = $('#fs-audio-seeker');
    const $currentTime = $('#current-time');
    const $totalDuration = $('#total-duration');

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    player.ontimeupdate = () => {
        const percent = (player.currentTime / player.duration) * 100 || 0;
        $audioProgressBar.css('width', `${percent}%`);
        $audioSeeker.val(percent);
        $fsProgressBar.css('width', `${percent}%`);
        $fsAudioSeeker.val(percent);
        $currentTime.text(formatTime(player.currentTime));
        if (!isNaN(player.duration)) {
            $totalDuration.text(formatTime(player.duration));
        }
    };

    $audioSeeker.on('input', function() {
        const time = (this.value / 100) * player.duration;
        if (!isNaN(time)) player.currentTime = time;
    });

    $fsAudioSeeker.on('input', function() {
        const time = (this.value / 100) * player.duration;
        if (!isNaN(time)) player.currentTime = time;
    });

    $('#btn-export-settings').on('click', settingsService.exportData);
    $('#btn-import-settings').on('click', () => $('#import-file').click());
    $('#import-file').on('change', (e) => settingsService.importData(e.target.files[0]));

    // Sincronização
    $('#menu-download-mp3').on('click', (e) => {
        e.preventDefault();
        downloadMP3s();
    });
    $('#menu-download-json').on('click', (e) => {
        e.preventDefault();
        if (confirm('Deseja baixar todos os arquivos JSON dos hinos?')) downloadJSONs();
    });
    $('#btn-download-current').on('click', handleDownload);

    // Menus
    $('#btn-menu').on('click', (e) => {
        e.stopPropagation();
        $('#menu-dropdown').toggleClass('hidden');
    });

    $('#menu-info').on('click', () => {
        $('#modal-info').removeClass('hidden');
        $('#menu-dropdown').addClass('hidden');
    });

    $('#menu-remote-control').on('click', () => {
        const rand = Math.floor(Math.random() * 1000000);
        window.open(`remote-control.html?r=${rand}`, 'remote_control', 'width=400,height=700');
        $('#menu-dropdown').addClass('hidden');
    });

    $('#btn-remote').on('click', () => {
        const rand = Math.floor(Math.random() * 1000000);
        window.open(`remote-control.html?r=${rand}`, 'remote_control', 'width=400,height=700');
    });

    $('#menu-custom-backgrounds').on('click', () => {
        $('#custom-bg-textarea').val(state.settings.customBackgrounds.join('\n'));
        $('#modal-custom-backgrounds').removeClass('hidden');
        $('#menu-dropdown').addClass('hidden');
    });

    $('#btn-save-custom-bg').on('click', () => {
        const text = $('#custom-bg-textarea').val();
        const urls = text.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        state.settings.customBackgrounds = urls;
        BACKGROUNDS = [...DEFAULT_BACKGROUNDS, ...urls];
        saveSettings();
        applySettings();
        $('#modal-custom-backgrounds').addClass('hidden');
    });

    $('#btn-check-updates').on('click', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(reg => {
                reg.update();
                alert('Verificando atualizações...');
            });
        }
    });

    $(document).on('click', (e) => {
        if (!$(e.target).closest('#menu-dropdown, #btn-menu').length) {
            $('#menu-dropdown').addClass('hidden');
        }
    });

    // Monitorar saída de tela cheia para resetar playlist
    $(document).on('fullscreenchange webkitfullscreenchange', () => {
        const content = $('#slide-content');
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            content.removeClass('max-w-2xl').addClass('max-w-[90vw]');
        } else {
            content.removeClass('max-w-[90vw]').addClass('max-w-2xl');
            
            // Se saiu da tela cheia, para a playlist se estiver ativa
            if (state.isPlaylistActive) {
                $('#btn-playlist-stop').click();
            }
            
            // Também garante que o player pare ao sair da tela cheia (comportamento original)
            const player = document.getElementById('audio-player');
            if (player) {
                player.pause();
                player.currentTime = 0;
            }
        }
    });

    // Clique duplo para avançar (estilo apresentação)
    $('#slide-preview').on('dblclick', (e) => {
        // Evita zoom acidental em dispositivos móveis
        e.preventDefault();
        stopAutoScroll(); // Parar rolagem automática
        nextSlide();
    });
};

// --- Funções de Sincronização (JSON/MP3) ---
const downloadJSONs = async () => {
    const total = 196;
    const cache = await caches.open('json-cache');
    uiUtils.showDownloadStatus(true);
    
    for (let i = 1; i <= total; i++) {
        const numStr = i.toString().padStart(3, '0');
        const url = `data/hinos/${numStr}.json`;
        try {
            const response = await fetch(url);
            if (response.ok) await cache.put(url, response.clone());
        } catch (e) { console.error(e); }
        if (i % 10 === 0) uiUtils.updateCacheDisplay(i, cachedMp3Count);
    }
    
    await cacheService.updateCacheVersion();
    uiUtils.showDownloadStatus(false);
    alert('Letras sincronizadas!');
};

const downloadMP3s = async () => {
    const total = 196;
    const mp3Cache = await caches.open('mp3-cache');
    uiUtils.showDownloadStatus(true);
    
    const chunkSize = 5; 
    const delayBetweenChunks = 300; 

    // Loop correto para processar todos os hinos de 1 a 196
    for (let i = 1; i <= total; ) {
        const chunk = [];
        for (let j = 0; j < chunkSize && (i + j) <= total; j++) {
            chunk.push(i + j);
        }

        console.log(`Baixando lote: ${chunk[0]} até ${chunk[chunk.length-1]}`);

        // Executa o lote atual em paralelo
        await Promise.all(chunk.map(async (num) => {
            const numStr = num.toString().padStart(3, '0');
            const primaryUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/${numStr}-piano.mp3`;
            const fallbackUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/main/media/${numStr}-piano.mp3`;
            
            // Chave ÚNICA E SIMPLES: garante 196 hinos cravados
            const storageKey = `hino_mp3_${numStr}`;

            try {
                const { response, url } = await cacheService.downloadWithFallback(primaryUrl, fallbackUrl);
                console.log(`Hino ${num} baixado de: ${url}`);
                await mp3Cache.put(storageKey, response.clone());
                console.log(`Hino ${num} salvo no cache com chave única: ${storageKey}`);
            } catch (e) { 
                console.error(`FALHA hino ${num}:`, e); 
            }
        }));

        // Incrementa i pelo tamanho do lote processado
        i += chunk.length;

        // Atualiza o contador visual baseado nas chaves VÁLIDAS do cache
        const keys = await mp3Cache.keys();
        const validCount = keys.filter(key => key.url.includes('hino_mp3_')).length;
        uiUtils.updateCacheDisplay(cachedJsonCount, validCount);

        // Pequena pausa entre lotes
        if (i <= total) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
        }
    }
    
    // Verificação final rigorosa
    const finalKeys = await mp3Cache.keys();
    cachedMp3Count = finalKeys.filter(key => key.url.includes('hino_mp3_')).length;
    uiUtils.updateCacheDisplay(cachedJsonCount, cachedMp3Count);
    
    uiUtils.showDownloadStatus(false);
    
    if (cachedMp3Count < total) {
        alert(`Sincronização parcial: ${cachedMp3Count} de ${total} áudios baixados. Tente sincronizar novamente para completar.`);
    } else {
        alert(`Sincronização completa! Todos os ${total} áudios estão no cache.`);
    }
};

const handleDownload = async () => {
    if (!state.currentHino) return alert("Selecione um hino.");
};

// --- Inicialização ---
$(document).ready(() => {
loadSettings();
hinoLoader.loadIndex(state).then(() => setupSearch());
setupEvents();
uiUtils.setupZoom(() => state.settings.isCompleto);
    
cacheService.initializeCounters().then(counts => {
cachedJsonCount = counts.json;
cachedMp3Count = counts.mp3;
uiUtils.updateCacheDisplay(cachedJsonCount, cachedMp3Count);
});
    cacheService.initializeCounters().then(counts => {
        cachedJsonCount = counts.json;
        cachedMp3Count = counts.mp3;
        uiUtils.updateCacheDisplay(cachedJsonCount, cachedMp3Count);
    });

    cacheService.checkCacheVersion(cacheVersion).then(updated => {
        if (updated) console.log('Cache limpo devido a nova versão');
    });
    
    setInterval(async () => {
        const counts = await cacheService.initializeCounters();
        cachedJsonCount = counts.json;
        cachedMp3Count = counts.mp3;
        uiUtils.updateCacheDisplay(counts.json, counts.mp3);
    }, 10000);

    // Inicializar listeners do BroadcastChannel (Controle Remoto)
    setupBroadcastListeners({
        prevSlide,
        nextSlide,
        scrollUp,
        scrollDown,
        toggleFullscreen: () => {
            const elem = document.getElementById('slide-preview');
            if (!document.fullscreenElement) {
                if (elem.requestFullscreen) elem.requestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        },
        exitFullscreen: () => {
            if (document.fullscreenElement) {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        },
        stopAutoScroll: () => {
            console.log('DEBUG: stopAutoScroll chamado via broadcast');
            stopAutoScroll();
        },
        randomHino: () => {
            randomHino();
        },
        openObsSettings: () => {
            $('#menu-obs-settings').click();
        },
        clearSlide: () => {
            // Limpar todos os timeouts pendentes da playlist
            clearAllPlaylistTimeouts();
            
            // Limpar o hino carregado da tela
            state.currentHino = null;
            state.currentSlide = 0;
            $('#slide-content').empty().append('<p class="text-2xl md:text-3xl lg:text-4xl text-white font-semibold leading-relaxed">Selecione um hino para começar</p>');
            $('#video-list').empty();
            $('#video-section').addClass('hidden');
            
            // Parar o áudio
            const player = document.getElementById('audio-player');
            if (player) {
                player.pause();
                player.currentTime = 0;
            }
            
            // Resetar ícones
            $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
            if (countdownInterval) clearInterval(countdownInterval);
            $('#intro-countdown').addClass('hidden');
        },
        togglePlay: () => {
            initAudio();
            const player = document.getElementById('audio-player');
            if (player.paused) player.play();
            else player.pause();
        },
        stopAudio: () => {
            const player = document.getElementById('audio-player');
            player.pause();
            player.currentTime = 0;
        },
        restartAudio: () => {
            const player = document.getElementById('audio-player');
            player.currentTime = 0;
            player.play();
        },
        speedUp: () => {
            const player = document.getElementById('audio-player');
            player.playbackRate = Math.min(player.playbackRate + 0.1, 2.0);
            broadcast('speedState', player.playbackRate);
        },
        speedDown: () => {
            const player = document.getElementById('audio-player');
            player.playbackRate = Math.max(player.playbackRate - 0.1, 0.5);
            broadcast('speedState', player.playbackRate);
        },
        toggleBg: () => $('#btn-toggle-bg').click(),
        toggleComplete: () => $('#check-completo').click(),
        shuffleBackground: () => $('#btn-change-bg').click(),
        toggleRandomPlaylist: () => $('#btn-playlist-toggle').click(),
        playlistNextRandom: () => {
            console.log('DEBUG main: playlistNextRandom called, isPlaylistActive =', state.isPlaylistActive);
            if (state.isPlaylistActive) {
                // Chama a função original definida no escopo global
                window.__playlistNextRandom();
            } else {
                nextSlide();
            }
        },
        selectHino: (numero) => selectHinoByNumber(numero),
        scrollToTop: () => {
            if (state.settings.isCompleto) {
                const container = $('#slide-content > div');
                if (container.length) {
                    container.scrollTop(0);
                } else {
                    $('#slide-content').scrollTop(0);
                }
            } else {
                state.currentSlide = 0;
                renderHino();
            }
            broadcastState(state, document.getElementById('audio-player'));
        },
        toggleObs: async () => {
            console.log('Ação toggleObs disparada via Controle Remoto');
            const status = await obsService.getSourceStatus();
            if (status && status.exists) {
                console.log('Alternando visibilidade da fonte OBS para:', !status.enabled);
                await obsService.toggleSource(!status.enabled);
                await updateObsUI();
            } else {
                console.warn('Não foi possível alternar OBS: Fonte não existe ou não detectada.');
            }
        }
    }, state);

    // --- OBS Settings ---
    const $modalObs = $('#modal-obs-settings');
    const $obsIndicator = $('#obs-status-indicator');
    const $obsStatusText = $('#obs-status-text');
    const $btnObsConnect = $('#btn-obs-connect');
    const $btnObsDisconnect = $('#btn-obs-disconnect');
    const $btnObsCreateSource = $('#btn-obs-create-source');

    const updateObsUI = async () => {
        console.log('Atualizando UI do OBS...', { connected: obsService.connected });
        state.obsConnected = obsService.connected;
        
        // NOTIFICAR CONEXÃO DO OBS PARA O CONTROLE REMOTO
        broadcast('obsConnected', state.obsConnected);
        
        if (obsService.connected) {
            $obsIndicator.removeClass('bg-red-500').addClass('bg-green-500');
            $obsStatusText.text('Conectado');
            $btnObsConnect.addClass('hidden');
            $btnObsDisconnect.removeClass('hidden');
            $('#btn-obs-stream').addClass('text-blue-500').removeClass('text-gray-500');
            
            try {
                const status = await obsService.getSourceStatus();
                console.log('Status da fonte recebido:', status);
                state.obsEnabled = status ? status.enabled : false;
                
                // NOTIFICAÇÃO CRUCIAL PARA O CONTROLE REMOTO
                broadcast('obsState', state.obsEnabled && state.obsConnected);
                
                if (status && status.exists) {
                    console.log('Fonte existe. Configurando Switch...');
                    const icon = status.enabled ? 'fa-eye text-white' : 'fa-eye-slash text-gray-400';
                    const text = status.enabled ? 'FONTE VISÍVEL NO OBS' : 'FONTE OCULTA NO OBS';
                    
                    $btnObsCreateSource.html(`<i class="fas ${icon} mr-2"></i> ${text}`)
                        .removeClass('bg-blue-600 bg-gray-600 bg-green-700 bg-gray-500 hidden')
                        .addClass(status.enabled ? 'bg-green-600' : 'bg-gray-500')
                        .css('display', 'flex') // Garantir que o flex do tailwind funcione
                        .data('action', 'toggle')
                        .data('enabled', status.enabled);
                } else {
                    console.log('Fonte não existe. Configurando botão de criação...');
                    $btnObsCreateSource.html('<i class="fas fa-plus-circle mr-2"></i> CRIAR FONTE NO OBS STUDIO')
                        .removeClass('bg-green-600 bg-gray-500 bg-green-700 bg-gray-600 hidden')
                        .addClass('bg-blue-600')
                        .css('display', 'flex')
                        .data('action', 'create');
                }
            } catch (err) {
                console.error('Erro ao processar status da fonte na UI:', err);
            }
        } else {
            $obsIndicator.removeClass('bg-green-500').addClass('bg-red-500');
            $obsStatusText.text('Desconectado');
            $btnObsConnect.removeClass('hidden');
            $btnObsDisconnect.addClass('hidden');
            $('#btn-obs-stream').addClass('text-gray-500').removeClass('text-blue-500');
        }
    };

    // Escutar eventos globais do OBS Service para atualizar a UI
    obsService.obs.on('Identified', () => {
        updateObsUI();
    });

    obsService.obs.on('ConnectionClosed', () => {
        updateObsUI();
    });

    // Monitorar mudanças de cena ou itens para atualizar o switch
    obsService.obs.on('SceneItemEnableStateChanged', () => {
        updateObsUI();
    });

    // Responder a requisições de estado inicial do OBS
    remoteChannel.addEventListener('message', async (event) => {
        const { action, source } = event.data || {};
        if (source === 'remote' && action === 'requestObsState') {
            const status = await obsService.getSourceStatus();
            state.obsConnected = obsService.connected;
            state.obsEnabled = status ? status.enabled : false;
            broadcast('obsState', state.obsEnabled && state.obsConnected);
        }
    });

    // Sincronização em Tempo Real com OBS
    obsService.obs.on('CurrentProgramSceneChanged', () => updateObsUI()); // Mudou a cena no OBS
    obsService.obs.on('SceneItemCreated', () => updateObsUI());           // Criou algo no OBS
    obsService.obs.on('SceneItemRemoved', () => updateObsUI());           // Deletou algo no OBS
    obsService.obs.on('InputConfigPropChanged', () => updateObsUI());     // Mudou config de entrada
    obsService.obs.on('InputSettingsChanged', (data) => {                 // Mudou nome ou settings
        if (data.inputName === obsService.config.sourceName) updateObsUI();
    });

    $('#menu-obs-settings, #btn-obs-stream').on('click', () => {
        $('#obs-address').val(obsService.config.address);
        $('#obs-password').val(obsService.config.password);
        $('#obs-source-name').val(obsService.config.sourceName);
        updateObsUI();
        $modalObs.removeClass('hidden');
    });

    // Salvar senha automaticamente quando digitada
    $('#obs-password').on('input', () => {
        const password = $('#obs-password').val();
        obsService.config.password = password;
        obsService.saveConfig();
    });

    // Salvar endereço automaticamente quando alterado
    $('#obs-address').on('input', () => {
        const address = $('#obs-address').val();
        obsService.config.address = address;
        obsService.saveConfig();
    });

    // Salvar nome da fonte automaticamente quando alterado
    $('#obs-source-name').on('input', () => {
        const sourceName = $('#obs-source-name').val()?.trim() || 'Hinario';
        obsService.config.sourceName = sourceName;
        obsService.saveConfig();
    });

    $btnObsCreateSource.on('click', async () => {
        const action = $btnObsCreateSource.data('action');
        
        if (action === 'create') {
            const originalText = $btnObsCreateSource.html();
            $btnObsCreateSource.prop('disabled', true).text('Criando...');
            try {
                await obsService.createSource();
                uiUtils.showToast('Fonte criada com sucesso!', 'success');
                await updateObsUI();
            } catch (e) {
                uiUtils.showToast(e.message, 'error');
                $btnObsCreateSource.html(originalText);
            } finally {
                $btnObsCreateSource.prop('disabled', false);
            }
        } else {
            const currentState = $btnObsCreateSource.data('enabled');
            await obsService.toggleSource(!currentState);
            updateObsUI();
        }
    });

    $btnObsConnect.on('click', async () => {
        const address = $('#obs-address').val();
        const password = $('#obs-password').val();
        let sourceName = $('#obs-source-name').val()?.trim();
        
        if (!sourceName) {
            sourceName = 'Hinario';
            $('#obs-source-name').val(sourceName);
        }

        obsService.config = { address, password, sourceName };
        $btnObsConnect.text('Conectando...').prop('disabled', true);
        try {
            await obsService.connect();
            uiUtils.showToast('Conectado ao OBS!', 'success');
            updateObsUI();
        } catch (e) {
            console.error('Erro na UI ao conectar OBS:', e);
            uiUtils.showToast(e.message, 'error');
            $obsStatusText.text(e.message);
        } finally {
            $btnObsConnect.prop('disabled', false).text('Conectar');
        }
    });

    $btnObsDisconnect.on('click', async () => {
        await obsService.disconnect();
        updateObsUI();
        uiUtils.showToast('Desconectado do OBS');
    });
});

// Expose globals for legacy compatibility
window.removeVideo = (num, url) => {
    let videos = JSON.parse(localStorage.getItem(`videos_hino_${num}`) || '[]');
    localStorage.setItem(`videos_hino_${num}`, JSON.stringify(videos.filter(v => v.url !== url)));
    if (state.currentHino?.numero === num) hinoRenderer.updateVideos(state.currentHino);
};

// Expose cache update functions for developers
window.forceCacheUpdate = () => cacheService.forceCacheUpdate();
window.clearJsonCache = () => cacheService.clearJsonCache();

