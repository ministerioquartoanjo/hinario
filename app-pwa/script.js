import { DEFAULT_BACKGROUNDS } from './src/constants/defaults.js';
import { broadcast, broadcastState, setupBroadcastListeners, remoteChannel } from './src/services/broadcastService.js';
import { cacheService } from './src/services/cacheService.js';
import { settingsService } from './src/services/settingsService.js';
import { createPlayHistory } from './src/services/playHistoryService.js';
import { uiUtils } from './src/utils/uiUtils.js';
import { audioUtils } from './src/utils/audioUtils.js';
import { audioPlayer } from './src/components/audioPlayer.js';
import { hinoLoader } from './src/utils/hinoLoader.js';
import { hinoRenderer } from './src/components/hinoRenderer.js';
import { obsService } from './src/services/obsService.js';
import { state } from './src/state.js';
import { searchLogic } from './src/utils/searchLogic.js';
import { applyTranslations, setInterfaceLanguage, setHymnLanguage, getInterfaceLanguage, getHymnLanguage, getHymnPathPrefix, t } from './src/utils/i18n.js';
import { BACKGROUNDS, createSettings } from './src/core/settings.js';
import { createNavigation, navState } from './src/core/navigation.js';
import { createPlaylist, playlistState } from './src/core/playlist.js';
import { createSync } from './src/core/sync.js';
import { setupEvents } from './src/core/events.js';

let cachedJsonCount = 0;
let cachedMp3Count = 0;
let cacheVersion = '1.0.2';
const APP_VERSION = window.APP_VERSION || '2026.04.17.1';
const fullscreenWarningTimeout = { current: null };
const AUTO_SCROLL_TITLE_DELAY = 2000;
const appState = { countdownInterval: null };

const settings = createSettings({ state, DEFAULT_BACKGROUNDS, broadcast, setInterfaceLanguage, setHymnLanguage, applyTranslations, audioUtils });
const { saveSettings, applySettings, loadSettings, setBackgrounds } = settings;
const renderHino = () => hinoRenderer.renderHino(state, { applySettings });
const initAudio = () => {
    if (state.audioCtx) return;
    const ctxData = audioUtils.initAudioContext(state, { applyFilters: audioUtils.applyAudioFilters });
    if (ctxData) Object.assign(state, ctxData);
};
const loadAudio = (numero) => audioPlayer.loadAudio(numero, state, {
    updateDisplay: () => cacheService.initializeCounters().then(counts => {
        cachedJsonCount = counts.json;
        cachedMp3Count = counts.mp3;
        uiUtils.updateCacheDisplay(cachedJsonCount, cachedMp3Count);
    }),
    applyFilters: () => audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters),
    broadcastFilters: () => broadcast('audioFiltersState', state.settings.audioFilters)
});

let navigation;
const playlist = createPlaylist({
    state,
    selectHino: (...args) => navigation.selectHino(...args),
    renderHino,
    applySettings,
    AUTO_SCROLL_TITLE_DELAY
});
const { clearAllPlaylistTimeouts, stopAutoScroll, startAutoScroll, initPlaylistAutoScroll, playlistNextRandom, randomHino } = playlist;
navigation = createNavigation({
    state, renderHino, loadAudio, hinoLoader, uiUtils, getHymnPathPrefix, hinoRenderer,
    initPlaylistAutoScroll: (...args) => initPlaylistAutoScroll(...args),
    playlistNextRandom: (...args) => playlistNextRandom(...args),
    stopAutoScroll
});
const { nextSlide, prevSlide, nextHino, prevHino, scrollUp, scrollDown, selectHino } = navigation;
const playHistory = createPlayHistory({ selectHino, initAudio });
window.__playlistNextRandom = playlistNextRandom;

const sync = createSync({
    state, getHymnPathPrefix, cacheService, uiUtils, t,
    getCachedCounts: () => ({ json: cachedJsonCount, mp3: cachedMp3Count }),
    setCachedCounts: ({ json = cachedJsonCount, mp3 = cachedMp3Count }) => { cachedJsonCount = json; cachedMp3Count = mp3; }
});
const { downloadJSONs, downloadMP3s, handleDownload } = sync;

const setupSearch = () => {
    const $input = $('#hino-search');
    const $results = $('#search-results');
    let selectedIndex = -1;
    let filteredHinos = [];
    const renderResults = (hinos) => {
        filteredHinos = hinos;
        if (hinos.length === 0) return $results.addClass('hidden');
        $results.html(hinos.map((h, i) => `
            <div class="search-item p-3 cursor-pointer transition-colors border-b last:border-0 dark:border-gray-700 ${i === selectedIndex ? 'bg-orange-dark text-white' : 'hover:bg-orange-100 dark:hover:bg-orange-900/30'}" data-index="${i}">
                <div class="font-bold flex justify-between items-center"><span>${h.numero} - ${h.titulo}</span><span class="text-[10px] opacity-50">#${h.numero}</span></div>
            </div>`).join('')).removeClass('hidden');
    };
    $input.on('input', function() { selectedIndex = -1; renderResults(searchLogic.filterHinos(state.hinos, $(this).val())); });
    $input.on('keydown', function(e) {
        if ($results.hasClass('hidden')) return;
        const previousIndex = selectedIndex;
        selectedIndex = searchLogic.handleKeyboardNavigation(e, selectedIndex, filteredHinos.length);
        if (e.key === 'Escape') $results.addClass('hidden');
        else if (e.key === 'Enter') { e.preventDefault(); const hino = selectedIndex > -1 ? filteredHinos[selectedIndex] : filteredHinos[0]; if (hino) selectHino(hino); $results.addClass('hidden'); }
        else if (previousIndex !== selectedIndex) renderResults(filteredHinos);
    });
    $results.on('click', '.search-item', function() { selectHino(filteredHinos[$(this).data('index')]); $results.addClass('hidden'); });
};

const actions = {
    state, saveSettings, applySettings, loadSettings, selectHino, nextSlide, prevSlide, nextHino, prevHino,
    scrollUp, scrollDown, randomHino, stopAutoScroll, startAutoScroll, clearAllPlaylistTimeouts,
    downloadJSONs, downloadMP3s, handleDownload, initAudio, loadAudio, renderHino, playlistNextRandom,
    hinoRenderer, audioUtils, broadcast, broadcastState, t, settingsService, hinoLoader, setupSearch,
    getInterfaceLanguage, getHymnLanguage, setInterfaceLanguage, setHymnLanguage, applyTranslations,
    getBackgrounds: () => BACKGROUNDS, setBackgrounds, DEFAULT_BACKGROUNDS, navState, playlistState, appState
};

const setupObs = () => {
    const $modalObs = $('#modal-obs-settings');
    const $obsIndicator = $('#obs-status-indicator');
    const $obsStatusText = $('#obs-status-text');
    const $btnObsConnect = $('#btn-obs-connect');
    const $btnObsDisconnect = $('#btn-obs-disconnect');
    const $btnObsCreateSource = $('#btn-obs-create-source');
    const updateObsUI = async () => {
        console.log('Atualizando UI do OBS...', { connected: obsService.connected });
        state.obsConnected = obsService.connected;
        broadcast('obsConnected', state.obsConnected);
        if (obsService.connected) {
            $obsIndicator.removeClass('bg-red-500').addClass('bg-green-500'); $obsStatusText.text(t('connected'));
            $btnObsConnect.addClass('hidden'); $btnObsDisconnect.removeClass('hidden'); $('#btn-obs-stream').addClass('text-blue-500').removeClass('text-gray-500');
            try {
                const status = await obsService.getSourceStatus();
                state.obsEnabled = status ? status.enabled : false;
                broadcast('obsState', state.obsEnabled && state.obsConnected);
                if (status && status.exists) {
                    const icon = status.enabled ? 'fa-eye text-white' : 'fa-eye-slash text-gray-400';
                    const text = status.enabled ? t('sourceVisible') : t('sourceHidden');
                    $btnObsCreateSource.html(`<i class="fas ${icon} mr-2"></i> ${text}`).removeClass('bg-blue-600 bg-gray-600 bg-green-700 bg-gray-500 hidden').addClass(status.enabled ? 'bg-green-600' : 'bg-gray-500').css('display', 'flex').data('action', 'toggle').data('enabled', status.enabled);
                } else $btnObsCreateSource.html(`<i class="fas fa-plus-circle mr-2"></i> ${t('createObsSource')}`).removeClass('bg-green-600 bg-gray-500 bg-green-700 bg-gray-600 hidden').addClass('bg-blue-600').css('display', 'flex').data('action', 'create');
            } catch (err) { console.error('Erro ao processar status da fonte na UI:', err); }
        } else {
            $obsIndicator.removeClass('bg-green-500').addClass('bg-red-500'); $obsStatusText.text(t('disconnected'));
            $btnObsConnect.removeClass('hidden'); $btnObsDisconnect.addClass('hidden'); $('#btn-obs-stream').addClass('text-gray-500').removeClass('text-blue-500');
        }
    };
    ['Identified', 'ConnectionClosed', 'SceneItemEnableStateChanged', 'CurrentProgramSceneChanged', 'SceneItemCreated', 'SceneItemRemoved', 'InputConfigPropChanged'].forEach(event => obsService.obs.on(event, updateObsUI));
    obsService.obs.on('InputSettingsChanged', data => { if (data.inputName === obsService.config.sourceName) updateObsUI(); });
    remoteChannel.addEventListener('message', async (event) => { const { action, source } = event.data || {}; if (source === 'remote' && action === 'requestObsState') { const status = await obsService.getSourceStatus(); state.obsConnected = obsService.connected; state.obsEnabled = status ? status.enabled : false; broadcast('obsState', state.obsEnabled && state.obsConnected); } });
    $('#menu-obs-settings, #btn-obs-stream').on('click', () => { $('#obs-address').val(obsService.config.address); $('#obs-password').val(obsService.config.password); $('#obs-source-name').val(obsService.config.sourceName); updateObsUI(); $modalObs.removeClass('hidden'); });
    $('#obs-password').on('input', () => { obsService.config.password = $('#obs-password').val(); obsService.saveConfig(); });
    $('#obs-address').on('input', () => { obsService.config.address = $('#obs-address').val(); obsService.saveConfig(); });
    $('#obs-source-name').on('input', () => { obsService.config.sourceName = $('#obs-source-name').val()?.trim() || 'Hinario'; obsService.saveConfig(); });
    $btnObsCreateSource.on('click', async () => { const action = $btnObsCreateSource.data('action'); if (action === 'create') { const originalText = $btnObsCreateSource.html(); $btnObsCreateSource.prop('disabled', true).text(t('creating')); try { await obsService.createSource(); uiUtils.showToast(t('sourceCreated'), 'success'); await updateObsUI(); } catch (e) { uiUtils.showToast(e.message, 'error'); $btnObsCreateSource.html(originalText); } finally { $btnObsCreateSource.prop('disabled', false); } } else { await obsService.toggleSource(!$btnObsCreateSource.data('enabled')); updateObsUI(); } });
    $btnObsConnect.on('click', async () => { const address = $('#obs-address').val(); const password = $('#obs-password').val(); let sourceName = $('#obs-source-name').val()?.trim(); if (!sourceName) { sourceName = 'Hinario'; $('#obs-source-name').val(sourceName); } obsService.config = { address, password, sourceName }; $btnObsConnect.text(t('connecting')).prop('disabled', true); try { await obsService.connect(); uiUtils.showToast(t('connectedObs'), 'success'); updateObsUI(); } catch (e) { console.error('Erro na UI ao conectar OBS:', e); uiUtils.showToast(e.message, 'error'); $obsStatusText.text(e.message); } finally { $btnObsConnect.prop('disabled', false).text(t('connect')); } });
    $btnObsDisconnect.on('click', async () => { await obsService.disconnect(); updateObsUI(); uiUtils.showToast(t('disconnectedObs')); });
    return updateObsUI;
};

$(document).ready(() => {
    loadSettings();
    hinoLoader.loadIndex(state, getHymnLanguage()).then(() => setupSearch());
    setupEvents(actions);
    playHistory.render();
    document.getElementById('audio-player')?.addEventListener('play', () => playHistory.record(state.currentHino));
    uiUtils.setupZoom(() => state.settings.isCompleto);
    cacheService.initializeCounters().then(counts => { cachedJsonCount = counts.json; cachedMp3Count = counts.mp3; uiUtils.updateCacheDisplay(cachedJsonCount, cachedMp3Count); });
    cacheService.initializeCounters().then(counts => { cachedJsonCount = counts.json; cachedMp3Count = counts.mp3; uiUtils.updateCacheDisplay(cachedJsonCount, cachedMp3Count); });
    cacheService.checkCacheVersion(cacheVersion).then(updated => { if (updated) console.log('Cache limpo devido a nova versão'); });
    setInterval(async () => { const counts = await cacheService.initializeCounters(); cachedJsonCount = counts.json; cachedMp3Count = counts.mp3; uiUtils.updateCacheDisplay(counts.json, counts.mp3); }, 10000);
    const updateObsUI = setupObs();
    setupBroadcastListeners({
        prevSlide, nextSlide, prevHino, nextHino, scrollUp, scrollDown,
        toggleFullscreen: () => { const elem = document.getElementById('slide-preview'); if (!document.fullscreenElement) { if (elem.requestFullscreen) elem.requestFullscreen(); } else if (document.exitFullscreen) document.exitFullscreen(); },
        exitFullscreen: () => { if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); else if (document.webkitExitFullscreen) document.webkitExitFullscreen(); } },
        stopAutoScroll: () => stopAutoScroll(), randomHino: () => randomHino(), openObsSettings: () => $('#menu-obs-settings').click(),
        clearSlide: () => { clearAllPlaylistTimeouts(); state.currentHino = null; state.currentSlide = 0; $('#slide-content').empty().append('<p class="text-xl md:text-2xl lg:text-3xl text-white font-semibold leading-relaxed">Selecione um hino para começar</p>'); $('#video-list').empty(); $('#video-section').addClass('hidden'); const player = document.getElementById('audio-player'); if (player) { player.pause(); player.currentTime = 0; } $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play'); if (appState.countdownInterval) clearInterval(appState.countdownInterval); $('#intro-countdown').addClass('hidden'); },
        togglePlay: () => { initAudio(); const player = document.getElementById('audio-player'); if (player.paused) player.play(); else player.pause(); }, stopAudio: () => { const player = document.getElementById('audio-player'); player.pause(); player.currentTime = 0; }, playAudio: () => { const player = document.getElementById('audio-player'); if (player) player.play(); }, restartAudio: () => { const player = document.getElementById('audio-player'); player.currentTime = 0; player.play(); },
        speedUp: () => { const player = document.getElementById('audio-player'); player.playbackRate = Math.min(player.playbackRate + 0.1, 2.0); broadcast('speedState', player.playbackRate); }, speedDown: () => { const player = document.getElementById('audio-player'); player.playbackRate = Math.max(player.playbackRate - 0.1, 0.5); broadcast('speedState', player.playbackRate); },
        fontInc: () => { state.settings.fontSize += 0.1; applySettings(); saveSettings(); }, fontDec: () => { state.settings.fontSize = Math.max(0.5, state.settings.fontSize - 0.1); applySettings(); saveSettings(); }, toggleBg: () => $('#btn-toggle-bg').click(), toggleComplete: () => $('#check-completo').click(), shuffleBackground: () => $('#btn-change-bg').click(), toggleRandomPlaylist: () => $('#btn-playlist-toggle').click(), playlistNextRandom: () => { if (state.isPlaylistActive) window.__playlistNextRandom(); else nextSlide(); }, selectHino: data => { const numero = typeof data === 'number' ? data : data?.numero; if (numero) selectHino(numero); }, scrollToTop: () => { if (state.settings.isCompleto) { const container = $('#slide-content > div'); if (container.length) container.scrollTop(0); else $('#slide-content').scrollTop(0); } else { state.currentSlide = 0; renderHino(); } broadcastState(state, document.getElementById('audio-player')); },
        toggleObs: async () => { const status = await obsService.getSourceStatus(); if (status && status.exists) { await obsService.toggleSource(!status.enabled); await updateObsUI(); } }, saveObsSettings: data => { if (data.address !== undefined) { $('#obs-address').val(data.address); obsService.config.address = data.address; } if (data.password !== undefined) { $('#obs-password').val(data.password); obsService.config.password = data.password; } if (data.sourceName !== undefined) { const sourceName = data.sourceName?.trim() || 'Hinario'; $('#obs-source-name').val(sourceName); obsService.config.sourceName = sourceName; } obsService.saveConfig(); $('#btn-obs-connect').click(); }, connectObs: () => $('#btn-obs-connect').click(), disconnectObs: () => $('#btn-obs-disconnect').click(), createObsSource: () => $('#btn-obs-create-source').click(), updateAudioFilters: filters => { initAudio(); ['gain', 'bass', 'mid', 'treble'].forEach(type => { if (filters[type] !== undefined) state.settings.audioFilters[type] = type === 'gain' ? parseFloat(filters[type]) : parseInt(filters[type]); }); $('#range-gain').val(state.settings.audioFilters.gain); $('#label-gain').text(state.settings.audioFilters.gain.toFixed(1) + 'x'); ['bass', 'mid', 'treble'].forEach(type => { $(`#eq-${type}`).val(state.settings.audioFilters[type]); $('#val-' + type).text((state.settings.audioFilters[type] > 0 ? '+' : '') + state.settings.audioFilters[type] + 'dB'); }); audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters); broadcast('audioFiltersState', state.settings.audioFilters); }
    }, state);
});

window.removeVideo = (num, url) => { const videos = JSON.parse(localStorage.getItem(`videos_hino_${num}`) || '[]'); localStorage.setItem(`videos_hino_${num}`, JSON.stringify(videos.filter(v => v.url !== url))); if (state.currentHino?.numero === num) hinoRenderer.updateVideos(state.currentHino); };
window.forceCacheUpdate = () => cacheService.forceCacheUpdate();
window.clearJsonCache = () => cacheService.clearJsonCache();
