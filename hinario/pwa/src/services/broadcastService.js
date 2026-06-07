export const remoteChannel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('hinario_remote')
    : null;

export const broadcast = (action, value) => {
    remoteChannel?.postMessage({ action, value, source: 'main' });
};

export const broadcastState = (state, player) => {
    if (!remoteChannel) return;
    
    const isPlaying = player ? !player.paused && !player.ended && player.readyState > 2 : false;
    

    broadcast('fullscreenState', !!document.fullscreenElement);
    broadcast('playlistState', state.isPlaylistActive);
    broadcast('playState', isPlaying);
    broadcast('speedState', player ? player.playbackRate : 1.0);
    broadcast('audioFiltersState', state.settings.audioFilters);
    broadcast('backgroundState', state.settings.showBackground);
    broadcast('completeState', state.settings.isCompleto);
    
    // Transmitir estado do OBS se o serviço estiver disponível
    if (state.obsConnected !== undefined) {
        broadcast('obsState', state.obsEnabled && state.obsConnected);
        broadcast('obsConnected', state.obsConnected);
    }
};

export const setupBroadcastListeners = (actions, state) => {
    if (!remoteChannel) return;

    remoteChannel.onmessage = (event) => {
        const { action, source, ...data } = event.data || {};
        
        // Ignorar mensagens que não vêm do remote
        if (source !== 'remote') return;

        switch (action) {
            case 'requestFullscreenState':
                broadcast('fullscreenState', !!document.fullscreenElement);
                break;
            case 'requestAudioFilters':
                broadcast('audioFiltersState', state.settings.audioFilters);
                break;
            case 'requestBackgroundState':
                broadcast('backgroundState', state.settings.showBackground);
                break;
            case 'requestCompleteState':
                broadcast('completeState', state.settings.isCompleto);
                break;
            case 'requestObsState':
                if (state.obsConnected !== undefined) {
                    broadcast('obsState', state.obsEnabled && state.obsConnected);
                    broadcast('obsConnected', state.obsConnected);
                }
                break;
            case 'requestPlayState':
                const player = document.getElementById('audio-player');
                const isPlaying = player ? !player.paused && !player.ended && player.readyState > 2 : false;
                broadcast('playState', isPlaying);
                break;
            case 'requestThemeState':
                broadcast('themeState', state.settings.darkMode);
                break;
            case 'selectHino':
                if (data.numero) actions.selectHino(data.numero);
                break;
            case 'toggleObs':
                if (actions.toggleObs) actions.toggleObs();
                break;
            case 'updateAudioFilters':
                if (actions.updateAudioFilters) {
                    // Extrair os filtros dos dados (pode vir como propriedades individuais)
                    const filters = {
                        gain: data.gain,
                        bass: data.bass,
                        mid: data.mid,
                        treble: data.treble
                    };
                    // Remover undefined
                    Object.keys(filters).forEach(key => {
                        if (filters[key] === undefined) delete filters[key];
                    });
                    actions.updateAudioFilters(filters);
                }
                break;
            case 'saveObsSettings':
                if (actions.saveObsSettings) actions.saveObsSettings(data);
                break;
            default:
                if (actions[action]) actions[action]();
        }
    };
};
