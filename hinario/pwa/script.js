import { DEFAULT_BACKGROUNDS } from './src/constants/defaults.js';
import { broadcast, broadcastState, setupBroadcastListeners } from './src/services/broadcastService.js';
import { cacheService } from './src/services/cacheService.js';
import { settingsService } from './src/services/settingsService.js';
import { uiUtils } from './src/utils/uiUtils.js';
import { audioUtils } from './src/utils/audioUtils.js';
import { audioPlayer } from './src/components/audioPlayer.js';
import { hinoLoader } from './src/utils/hinoLoader.js';
import { hinoRenderer } from './src/components/hinoRenderer.js';
import { state } from './src/state.js';

// --- Globals ---
let BACKGROUNDS = [...DEFAULT_BACKGROUNDS];
let countdownInterval = null;
let cachedJsonCount = 0;
let cachedMp3Count = 0;
let cacheVersion = '1.0.0';
let APP_VERSION = '2026.04.09.1';
const fullscreenWarningTimeout = { current: null };

const saveSettings = () => localStorage.setItem('hinario_settings', JSON.stringify(state.settings));

const applySettings = () => {
    const body = document.body;
    body.classList.toggle('dark', state.settings.darkMode);

    $('#slide-content').css({
        'font-family': state.settings.fontFamily,
        'font-size': `${state.settings.fontSize}rem`,
        'line-height': state.settings.lineHeight,
        'color': state.settings.fontColor,
        'font-weight': 600
    });

    // Ajustar o título para ser no máximo 30% maior que a fonte configurada
    $('#slide-content h1').css({
        'font-size': `${state.settings.fontSize * 1.3}rem`
    });

    $('#font-size-display').text(`${state.settings.fontSize.toFixed(2)}rem`);
    $('#line-height-display').text(state.settings.lineHeight);
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
        $('#slide-content').css('text-shadow', '2px 2px 8px rgba(0,0,0,0.9), 0px 0px 10px rgba(0,0,0,0.5)');
    } else {
        $('#slide-bg').addClass('hidden');
        $('#slide-preview').css('background-color', state.settings.bgColor || '#000000');
        $('#slide-content').css('text-shadow', 'none');
    }
};

const loadSettings = () => {
    const saved = localStorage.getItem('hinario_settings');
    if (saved) Object.assign(state.settings, JSON.parse(saved));
    BACKGROUNDS = [...DEFAULT_BACKGROUNDS, ...state.settings.customBackgrounds];
    applySettings();
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
    audioPlayer.loadAudio(numero, state, {
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
        nextHino();
    }
};

const prevSlide = () => {
    if (!state.currentHino || state.currentSlide <= 0) return;
    state.currentSlide--;
    renderHino();
};

const nextHino = () => {
    const idx = state.hinos.findIndex(h => h.numero === state.currentHino?.numero);
    selectHino(state.hinos[(idx + 1) % state.hinos.length]);
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
    loadAudio(hino.numero);
    $('#hino-search').val(`${hino.numero} - ${hino.titulo}`).blur();
    hinoRenderer.updateVideos(hino);
    document.getElementById('slide-preview').scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                <div class="font-bold">${h.numero} - ${h.titulo}</div>
            </div>
        `).join('')).removeClass('hidden');
    };

    $input.on('input', function() {
        const term = $(this).val().toLowerCase();
        if (term.length < 1) return $results.addClass('hidden');
        
        const matches = state.hinos.filter(h => 
            h.numero.toString().includes(term) || h.titulo.toLowerCase().includes(term)
        ).slice(0, 10);
        
        selectedIndex = -1;
        renderResults(matches);
    });

    $input.on('keydown', function(e) {
        if ($results.hasClass('hidden')) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % filteredHinos.length;
            renderResults(filteredHinos);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + filteredHinos.length) % filteredHinos.length;
            renderResults(filteredHinos);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex > -1) {
                selectHino(filteredHinos[selectedIndex]);
            } else if (filteredHinos.length > 0) {
                selectHino(filteredHinos[0]);
            }
            $results.addClass('hidden');
        } else if (e.key === 'Escape') {
            $results.addClass('hidden');
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

    $('#btn-prev').on('click', prevSlide);
    $('#btn-next').on('click', nextSlide);
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

    $('#btn-toggle-theme').on('click', () => {
        state.settings.darkMode = !state.settings.darkMode;
        applySettings();
        saveSettings();
    });

    $('#btn-change-bg, #btn-fs-change-bg').on('click', () => {
        state.settings.bgIndex = (state.settings.bgIndex + 1) % BACKGROUNDS.length;
        state.settings.showBackground = true;
        applySettings();
        saveSettings();
        broadcast('backgroundState', true);
    });

    $('#btn-toggle-bg').on('click', () => {
        state.settings.showBackground = !state.settings.showBackground;
        applySettings();
        saveSettings();
        broadcast('backgroundState', state.settings.showBackground);
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

        // Selecionar Hino Aleatório
        const randIdx = Math.floor(Math.random() * state.hinos.length);
        await selectHino(state.hinos[randIdx]);

        // Entrar em Tela Cheia
        const elem = document.getElementById('slide-preview');
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.error(`Erro ao tentar entrar em tela cheia: ${err.message}`);
            });
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }

        // Tocar áudio
        setTimeout(() => {
            const player = document.getElementById('audio-player');
            if (player) {
                player.currentTime = 0;
                player.play().catch(e => console.warn("Autoplay bloqueado ou falhou:", e));
            }
        }, 1000);
    });

    $('#btn-playlist-next, #btn-fs-skip-next').on('click', async () => {
        const loading = document.getElementById('audio-loading');
        if (loading) loading.classList.remove('hidden');
        
        await nextHino();
        
        // O selectHino chamado por nextHino já chama loadAudio.
        // Precisamos garantir que o play seja chamado após o carregamento.
        setTimeout(() => {
            const player = document.getElementById('audio-player');
            if (player) {
                player.play().catch(e => console.warn("Autoplay ao avançar playlist falhou:", e));
            }
            if (loading) loading.classList.add('hidden');
        }, 800);
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
            // O evento onpause/onstop já cuidará de atualizar os ícones e o broadcast
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
                nextSlide();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevSlide();
                break;
            case 'ArrowUp':
                if (state.settings.isCompleto) {
                    const container = $('#slide-content > div');
                    container.scrollTop(container.scrollTop() - 50);
                } else {
                    prevHino();
                }
                break;
            case 'ArrowDown':
                if (state.settings.isCompleto) {
                    const container = $('#slide-content > div');
                    container.scrollTop(container.scrollTop() + 50);
                } else {
                    nextHino();
                }
                break;
            case 'Home':
                state.currentSlide = 0;
                renderHino();
                break;
            case 'End':
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
        if (touchendX < touchstartX - threshold) nextSlide();
        if (touchendX > touchstartX + threshold) prevSlide();
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
        
        if (state.isPlaylistActive) {
            nextHino();
        } else {
            broadcastState(state, player);
        }
    };

    player.onstop = () => {
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
        if (countdownInterval) clearInterval(countdownInterval);
        $('#intro-countdown').addClass('hidden');
        broadcastState(state, player);
    };

    player.onabort = () => {
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
        if (countdownInterval) clearInterval(countdownInterval);
        $('#intro-countdown').addClass('hidden');
        broadcastState(state, player);
    };

    player.onerror = () => {
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
        if (countdownInterval) clearInterval(countdownInterval);
        $('#intro-countdown').addClass('hidden');
        broadcastState(state, player);
    };

    player.onratechange = () => {
        broadcast('speedState', player.playbackRate);
    };

    player.ontimeupdate = () => {
        if (!player.duration) return;
        const progress = (player.currentTime / player.duration) * 100;
        $('#audio-progress-bar').css('width', `${progress}%`);
        $('#current-time').text(uiUtils.formatTime?.(player.currentTime) || '0:00');

        // Lógica de Auto-Scroll/Avanço na Introdução (Modo Playlist)
        if (state.isPlaylistActive && state.currentHino) {
            const introTime = (typeof state.currentHino.introducao === 'number') ? state.currentHino.introducao : 8;
            
            // Avanço automático da Capa -> Primeiro Verso após a introdução
            if (state.currentSlide === 0 && player.currentTime > introTime) {
                nextSlide();
            }
        }
    };

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
        window.open('remote-control.html', 'remote_control', 'width=400,height=700');
        $('#menu-dropdown').addClass('hidden');
    });

    $('#btn-remote').on('click', () => {
        window.open('remote-control.html', 'remote_control', 'width=400,height=700');
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
    const cache = await caches.open('mp3-cache');
    uiUtils.showDownloadStatus(true);

    for (let i = 1; i <= total; i++) {
        const numStr = i.toString().padStart(3, '0');
        const primaryUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/main/media/${numStr}-piano.mp3`;
        const fallbackUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/${numStr}-piano.mp3`;

        try {
            const { response, url } = await cacheService.downloadWithFallback(primaryUrl, fallbackUrl);
            await cache.put(url, response.clone());
        } catch (e) { console.error(e); }
        if (i % 5 === 0) uiUtils.updateCacheDisplay(cachedJsonCount, i);
    }
    
    uiUtils.showDownloadStatus(false);
    alert('Áudios sincronizados!');
};

const handleDownload = async () => {
    if (!state.currentHino) return alert("Selecione um hino.");
    const numStr = state.currentHino.numero.toString().padStart(3, '0');
    const audioUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/${numStr}-piano.mp3`;
    window.open(audioUrl, '_blank');
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
        nextHino,
        prevHino: () => {
            const idx = state.hinos.findIndex(h => h.numero === state.currentHino?.numero);
            if (idx > 0) selectHino(state.hinos[idx - 1]);
        },
        selectHino,
        togglePlay: () => $('#btn-play-pause').click(),
        stopAudio: () => $('#btn-stop').click(),
        restartAudio: () => $('#btn-fs-restart').click(),
        speedUp: () => $('#btn-speed-fast').click(),
        speedDown: () => $('#btn-speed-slow').click(),
        toggleFullscreen: () => $('#btn-fullscreen').click(),
        toggleBg: () => $('#btn-toggle-bg').click(),
        toggleComplete: () => $('#btn-check-completo').click(),
        randomHino: () => $('#btn-random-hino').click(),
        toggleRandomPlaylist: () => $('#btn-playlist-toggle').click(),
        scrollUp: () => {
            if (state.settings.isCompleto) {
                const container = $('#slide-content > div');
                container.scrollTop(container.scrollTop() - 100);
            }
        },
        scrollDown: () => {
            if (state.settings.isCompleto) {
                const container = $('#slide-content > div');
                container.scrollTop(container.scrollTop() + 100);
            }
        },
        scrollToTop: () => {
            if (state.settings.isCompleto) {
                const container = $('#slide-content > div');
                container.scrollTop(0);
            }
        }
    }, state);
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

