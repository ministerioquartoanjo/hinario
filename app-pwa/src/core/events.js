import { setupKeyboard } from './keyboard.js';

export const setupEvents = (actions) => {
    const {
        state, saveSettings, applySettings, selectHino, nextSlide, prevSlide, nextHino, prevHino,
        randomHino, stopAutoScroll, downloadJSONs, downloadMP3s, handleDownload, initAudio,
        renderHino, hinoRenderer, audioUtils, broadcast, broadcastState, t, settingsService,
        hinoLoader, setupSearch, getInterfaceLanguage, getHymnLanguage, setInterfaceLanguage,
        setHymnLanguage, applyTranslations, getBackgrounds, setBackgrounds, DEFAULT_BACKGROUNDS,
        navState, appState
    } = actions;

    $('#btn-clear-search').on('click', () => {
        $('#hino-search').val('').focus();
        $('#search-results').addClass('hidden');
        state.currentHino = null;
        state.currentSlide = 0;
        $('#slide-content').empty();
        $('#video-list').empty();
        $('#video-section').addClass('hidden');
        const player = document.getElementById('audio-player');
        if (player) {
            player.pause();
            player.currentTime = 0;
            $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
            if (appState.countdownInterval) clearInterval(appState.countdownInterval);
            $('#intro-countdown').addClass('hidden');
            broadcastState(state, player);
        }
        if (!state.settings.showBackground) $('#slide-bg').addClass('hidden');
    });

    $('#hino-search').on('dblclick', () => $('#btn-clear-search').click());
    $('#btn-prev').on('click', () => { stopAutoScroll(); prevSlide(); });
    $('#btn-next').on('click', () => { stopAutoScroll(); nextSlide(); });
    $('#btn-prev-hino-main').on('click', () => { stopAutoScroll(); prevHino(); });
    $('#btn-next-hino-main').on('click', () => { stopAutoScroll(); nextHino(); });
    $('#btn-random-hino').on('click', () => {
        if (!state.hinos.length) return;
        selectHino(state.hinos[Math.floor(Math.random() * state.hinos.length)]);
    });
    $('#btn-font-inc').on('click', () => { state.settings.fontSize += 0.1; applySettings(); saveSettings(); });
    $('#btn-font-dec').on('click', () => { state.settings.fontSize = Math.max(0.5, state.settings.fontSize - 0.1); applySettings(); saveSettings(); });
    $('#btn-line-inc').on('click', () => { state.settings.lineHeight = Number((state.settings.lineHeight + 0.1).toFixed(1)); applySettings(); saveSettings(); });
    $('#btn-line-dec').on('click', () => { state.settings.lineHeight = Math.max(1, Number((state.settings.lineHeight - 0.1).toFixed(1))); applySettings(); saveSettings(); });

    $('#font-family-select').on('change', function() { state.settings.fontFamily = $(this).val(); applySettings(); saveSettings(); });
    $('#font-color-picker').on('input', function() { state.settings.fontColor = $(this).val(); applySettings(); saveSettings(); });
    $('#bg-color-picker').on('input', function() { state.settings.bgColor = $(this).val(); state.settings.showBackground = false; applySettings(); saveSettings(); });
    $('#menu-manage-videos').on('click', (e) => { e.preventDefault(); $('#video-section').toggleClass('hidden'); });

    $('#toggle-appearance').on('click', () => {
        if (window.innerWidth < 768) {
            $('#appearance-content').toggleClass('hidden');
            $('#appearance-icon').toggleClass('rotate-180');
        }
    });

    $('#btn-toggle-theme').on('click', () => {
        state.settings.darkMode = !state.settings.darkMode;
        applySettings();
        saveSettings();
        broadcast('themeState', state.settings.darkMode);
    });

    $('#btn-change-bg, #btn-fs-change-bg').on('click', () => {
        const backgrounds = getBackgrounds();
        console.log('DEBUG: btn-change-bg clicked');
        console.log('DEBUG: BACKGROUNDS.length =', backgrounds.length);
        console.log('DEBUG: current bgIndex =', state.settings.bgIndex);
        state.settings.bgIndex = (state.settings.bgIndex + 1) % backgrounds.length;
        state.settings.showBackground = true;
        console.log('DEBUG: new bgIndex =', state.settings.bgIndex);
        console.log('DEBUG: new bgUrl =', backgrounds[state.settings.bgIndex]);
        applySettings();
        saveSettings();
        broadcastState(state, document.getElementById('audio-player'));
    });

    $('#btn-toggle-bg').on('click', () => {
        state.settings.showBackground = !state.settings.showBackground;
        applySettings();
        saveSettings();
        broadcastState(state, document.getElementById('audio-player'));
    });

    $('#btn-fullscreen').on('click', () => {
        const elem = document.getElementById('slide-preview');
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        } else if (document.exitFullscreen) document.exitFullscreen();
    });

    $('#check-completo').on('change', function() {
        state.settings.isCompleto = $(this).is(':checked');
        renderHino();
        saveSettings();
        broadcast('completeState', state.settings.isCompleto);
    });

    const player = document.getElementById('audio-player');
    $('#btn-play-pause, #btn-fs-play-pause').on('click', () => {
        if (!state.currentHino) return alert(t('selectHinoFirst'));
        initAudio();
        player.paused ? player.play() : player.pause();
    });
    $('#btn-stop, #btn-fs-stop').on('click', () => {
        player.pause(); player.currentTime = 0;
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
        if (appState.countdownInterval) clearInterval(appState.countdownInterval);
        $('#intro-countdown').addClass('hidden');
        broadcastState(state, player);
    });
    $('#btn-fs-restart').on('click', () => { player.currentTime = 0; player.play(); broadcastState(state, player); });
    $('#btn-fs-exit').on('click', () => { if (document.exitFullscreen) document.exitFullscreen(); else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); });
    $('#btn-fs-speed-dec, #btn-speed-slow').on('click', () => { player.playbackRate = Math.max(0.5, player.playbackRate - 0.1); $('#speed-display, #fs-speed-display').text(player.playbackRate.toFixed(1) + 'x'); broadcast('speedState', player.playbackRate); });
    $('#btn-fs-speed-inc, #btn-speed-fast').on('click', () => { player.playbackRate = Math.min(2.0, player.playbackRate + 0.1); $('#speed-display, #fs-speed-display').text(player.playbackRate.toFixed(1) + 'x'); broadcast('speedState', player.playbackRate); });
    $('#btn-audio-filters').on('click', () => $('#modal-audio-filters').removeClass('hidden'));

    $('#btn-add-video').on('click', () => { if (!state.currentHino) return alert(t('selectHinoFirst')); $('#modal-add-video').removeClass('hidden'); });
    $('#btn-save-video').on('click', () => {
        const url = $('#video-url-input').val().trim();
        if (!url) return alert(t('addVideoUrlError'));
        const hinoNum = state.currentHino.numero;
        const videos = JSON.parse(localStorage.getItem(`videos_hino_${hinoNum}`) || '[]');
        if (videos.some(v => v.url === url)) return alert(t('videoAlreadyAdded'));
        videos.push({ url, title: 'Vídeo Personalizado' });
        localStorage.setItem(`videos_hino_${hinoNum}`, JSON.stringify(videos));
        $('#video-url-input').val('');
        $('#modal-add-video').addClass('hidden');
        hinoRenderer.updateVideos(state.currentHino);
    });
    $('.btn-close-modal').on('click', function() { $(this).closest('.fixed').addClass('hidden'); });
    $('#btn-download-current').on('click', handleDownload);

    $('#btn-playlist-toggle').on('click', async function() {
        if (state.isPlaylistActive) { $('#btn-playlist-stop').click(); return; }
        initAudio();
        if (state.hinos.length === 0) return;
        state.isPlaylistActive = true;
        $(this).addClass('text-green-600').removeClass('text-gray-400');
        $('#btn-playlist-stop').addClass('text-gray-400').removeClass('text-red-600');
        $('#btn-fs-skip-next').removeClass('hidden');
        broadcast('playlistState', true);
        const elem = document.getElementById('slide-preview');
        if (elem.requestFullscreen) elem.requestFullscreen().catch(err => console.error(`Erro ao tentar entrar em tela cheia: ${err.message}`));
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        await selectHino(state.hinos[Math.floor(Math.random() * state.hinos.length)]);
        const plPlayer = document.getElementById('audio-player');
        if (plPlayer) { plPlayer.currentTime = 0; plPlayer.play().catch(e => console.warn('Autoplay bloqueado ou falhou:', e)); }
    });
    $('#btn-playlist-next, #btn-fs-skip-next').on('click', async () => {
        await nextHino();
        const plPlayer = document.getElementById('audio-player');
        if (plPlayer) plPlayer.play().catch(e => console.warn('Autoplay ao avançar playlist falhou:', e));
    });
    $('#btn-playlist-stop').on('click', function() {
        state.isPlaylistActive = false;
        $(this).addClass('text-red-600').removeClass('text-gray-400');
        $('#btn-playlist-toggle').addClass('text-gray-400').removeClass('text-green-600');
        $('#btn-fs-skip-next').addClass('hidden');
        if (player) {
            player.pause(); player.currentTime = 0;
            $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');
            if (appState.countdownInterval) clearInterval(appState.countdownInterval);
            $('#intro-countdown').addClass('hidden');
        }
        broadcast('playlistState', false);
    });

    setupKeyboard(actions);

    let touchstartX = 0;
    let touchendX = 0;
    const preview = document.getElementById('slide-preview');
    preview.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; }, { passive: true });
    preview.addEventListener('touchend', e => { touchendX = e.changedTouches[0].screenX; if (touchendX < touchstartX - 50) { stopAutoScroll(); nextSlide(); } if (touchendX > touchstartX + 50) { stopAutoScroll(); prevSlide(); } }, { passive: true });

    $('#range-gain').on('input', function() { initAudio(); state.settings.audioFilters.gain = parseFloat($(this).val()); audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters); broadcast('audioFiltersState', state.settings.audioFilters); });
    $('#eq-bass, #eq-mid, #eq-treble').on('input', function() { initAudio(); const type = $(this).attr('id').split('-')[1]; state.settings.audioFilters[type] = parseInt($(this).val()); audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters); broadcast('audioFiltersState', state.settings.audioFilters); });
    $('#btn-reset-filters').on('click', () => { state.settings.audioFilters = { gain: 1.2, bass: 0, mid: -5, treble: 12 }; audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters); broadcast('audioFiltersState', state.settings.audioFilters); });

    player.onplay = () => {
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-play').addClass('fa-pause');
        broadcastState(state, player);
        if (appState.countdownInterval) clearInterval(appState.countdownInterval);
        if (navState.introTransitionTimeout) clearTimeout(navState.introTransitionTimeout);
        const $countdown = $('#intro-countdown');
        if (state.currentHino && state.currentHino.introducao > 0 && player.currentTime < state.currentHino.introducao) {
            const introSeconds = state.currentHino.introducao;
            const previewSeconds = state.settings.introPreviewSeconds ?? 3;
            $countdown.removeClass('hidden').find('span').text(Math.ceil(introSeconds - player.currentTime));
            if (!navState.userManuallyNavigated && state.currentSlide === 0) {
                const transitionAt = introSeconds > previewSeconds ? previewSeconds : introSeconds;
                navState.introTransitionTimeout = setTimeout(() => {
                    if (!navState.userManuallyNavigated && state.currentHino && state.currentSlide === 0 && !player.paused) {
                        state.currentSlide = 1; renderHino(); broadcast('slideState', state.currentSlide);
                    }
                }, Math.max(0, (transitionAt - player.currentTime) * 1000));
            }
            appState.countdownInterval = setInterval(() => {
                const remaining = introSeconds - player.currentTime;
                if (remaining <= 0 || player.paused) { clearInterval(appState.countdownInterval); $countdown.addClass('hidden'); }
                else $countdown.find('span').text(Math.ceil(remaining));
            }, 100);
        } else $countdown.addClass('hidden');
    };
    const stopCountdown = () => { if (appState.countdownInterval) clearInterval(appState.countdownInterval); if (navState.introTransitionTimeout) clearTimeout(navState.introTransitionTimeout); $('#intro-countdown').addClass('hidden'); };
    player.onpause = () => { $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play'); broadcastState(state, player); stopCountdown(); };
    player.onended = () => { $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play'); stopCountdown(); stopAutoScroll(); if (state.isPlaylistActive) actions.playlistNextRandom(); else broadcastState(state, player); };
    player.onstop = () => { $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play'); stopCountdown(); broadcastState(state, player); };
    player.onabort = () => { $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play'); stopCountdown(); broadcastState(state, player); };

    const $audioProgressBar = $('#audio-progress-bar'); const $audioSeeker = $('#audio-seeker'); const $fsProgressBar = $('#fs-progress-bar'); const $fsAudioSeeker = $('#fs-audio-seeker'); const $currentTime = $('#current-time'); const $totalDuration = $('#total-duration');
    const formatTime = (seconds) => { if (isNaN(seconds)) return '0:00'; const min = Math.floor(seconds / 60); const sec = Math.floor(seconds % 60); return `${min}:${sec.toString().padStart(2, '0')}`; };
    player.ontimeupdate = () => { const percent = (player.currentTime / player.duration) * 100 || 0; $audioProgressBar.css('width', `${percent}%`); $audioSeeker.val(percent); $fsProgressBar.css('width', `${percent}%`); $fsAudioSeeker.val(percent); $currentTime.text(formatTime(player.currentTime)); if (!isNaN(player.duration)) $totalDuration.text(formatTime(player.duration)); };
    $audioSeeker.on('input', function() { const time = (this.value / 100) * player.duration; if (!isNaN(time)) player.currentTime = time; });
    $fsAudioSeeker.on('input', function() { const time = (this.value / 100) * player.duration; if (!isNaN(time)) player.currentTime = time; });

    $('#btn-export-settings').on('click', settingsService.exportData);
    $('#btn-import-settings').on('click', () => $('#import-file').click());
    $('#import-file').on('change', (e) => settingsService.importData(e.target.files[0]));
    $('#menu-download-mp3').on('click', (e) => { e.preventDefault(); downloadMP3s(); });
    $('#menu-download-json').on('click', (e) => { e.preventDefault(); if (confirm('Deseja baixar todos os arquivos JSON dos hinos?')) downloadJSONs(); });
    $('#btn-download-current').on('click', handleDownload);

    $('#btn-menu').on('click', (e) => { e.stopPropagation(); $('#menu-dropdown').toggleClass('hidden'); });
    $('#menu-info').on('click', () => { $('#modal-info').removeClass('hidden'); $('#menu-dropdown').addClass('hidden'); });
    $('#menu-remote-control').on('click', () => { window.open(`remote-control.html?r=${Math.floor(Math.random() * 1000000)}`, 'remote_control', 'width=250,height=500'); $('#menu-dropdown').addClass('hidden'); });
    $('#btn-remote').on('click', () => window.open(`remote-control.html?r=${Math.floor(Math.random() * 1000000)}`, 'remote_control', 'width=250,height=500'));
    $('#menu-custom-backgrounds').on('click', () => { $('#custom-bg-textarea').val(state.settings.customBackgrounds.join('\n')); $('#modal-custom-backgrounds').removeClass('hidden'); $('#menu-dropdown').addClass('hidden'); });
    $('#btn-save-custom-bg').on('click', () => { const urls = $('#custom-bg-textarea').val().split('\n').map(u => u.trim()).filter(u => u.length > 0); state.settings.customBackgrounds = urls; setBackgrounds([...DEFAULT_BACKGROUNDS, ...urls]); saveSettings(); applySettings(); $('#modal-custom-backgrounds').addClass('hidden'); });
    $('#btn-check-updates').on('click', () => { if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then(reg => { reg.update(); alert(t('checkingUpdates')); }); });
    $(document).on('click', (e) => { if (!$(e.target).closest('#menu-dropdown, #btn-menu').length) $('#menu-dropdown').addClass('hidden'); });
    $(document).on('fullscreenchange webkitfullscreenchange', () => { const content = $('#slide-content'); if (document.fullscreenElement || document.webkitFullscreenElement) content.removeClass('max-w-none').addClass('max-w-[90vw]'); else { content.removeClass('max-w-[90vw]').addClass('max-w-none'); if (state.isPlaylistActive) $('#btn-playlist-stop').click(); if (player) { player.pause(); player.currentTime = 0; } } });
    $('#slide-preview').on('dblclick', (e) => { e.preventDefault(); stopAutoScroll(); nextSlide(); });

    $('#select-interface-language').val(getInterfaceLanguage()).on('change', function() { const lang = $(this).val(); setInterfaceLanguage(lang); state.settings.interfaceLanguage = lang; saveSettings(); applyTranslations(); });
    $('#select-hymn-language').val(getHymnLanguage()).on('change', async function() { const lang = $(this).val(); setHymnLanguage(lang); state.settings.hymnLanguage = lang; saveSettings(); await hinoLoader.loadIndex(state, lang); setupSearch(); if (state.currentHino) { const current = state.currentHino; current.loaded = false; current.letras = []; await selectHino(current.numero); } });
    $('#input-intro-preview').val(state.settings.introPreviewSeconds ?? 3).on('change', function() { const value = parseInt($(this).val(), 10); state.settings.introPreviewSeconds = isNaN(value) || value < 0 ? 3 : value; saveSettings(); });

    (() => {
        const $resizeHandle = $('#slide-preview-resize-handle');
        const $preview = $('#slide-preview');
        if (!$resizeHandle.length || !$preview.length) return;

        const getClientPos = (ev) => {
            const oe = ev.originalEvent || ev;
            if (oe.touches && oe.touches.length) return { x: oe.touches[0].clientX, y: oe.touches[0].clientY };
            return { x: ev.clientX, y: ev.clientY };
        };

        const updatePreviewAndHandle = (w, h) => {
            const handleW = $resizeHandle.outerWidth();
            const handleH = $resizeHandle.outerHeight();
            const offset = 4;
            $preview.css({ width: `${w}px`, height: `${h}px` });
            $resizeHandle.css({
                left: `${Math.max(0, w - handleW - offset)}px`,
                top: `${Math.max(0, h - handleH - offset)}px`,
                right: 'auto',
                bottom: 'auto'
            });
        };

        let isResizing = false;
        const startResize = (e) => {
            isResizing = true;
            e.preventDefault();

            const startPos = getClientPos(e);
            const previewRect = $preview[0].getBoundingClientRect();
            const startW = previewRect.width;
            const startH = previewRect.height;

            const onMove = (ev) => {
                if (!isResizing) return;
                const { x, y } = getClientPos(ev);
                let w = startW + (x - startPos.x);
                let h = startH + (y - startPos.y);
                w = Math.max(120, Math.min(w, window.innerWidth - previewRect.left));
                h = Math.max(120, Math.min(h, window.innerHeight - previewRect.top));
                updatePreviewAndHandle(w, h);
            };

            const onEnd = () => {
                if (!isResizing) return;
                isResizing = false;
                $(document).off('mousemove.slide-preview-resize touchmove.slide-preview-resize mouseup.slide-preview-resize touchend.slide-preview-resize');
                state.settings.slidePreviewWidth = $preview.css('width');
                state.settings.slidePreviewHeight = $preview.css('height');
                saveSettings();
            };

            $(document).on('mousemove.slide-preview-resize touchmove.slide-preview-resize', onMove);
            $(document).on('mouseup.slide-preview-resize touchend.slide-preview-resize', onEnd);
        };

        $resizeHandle.on('mousedown touchstart', startResize);
    })();
};
