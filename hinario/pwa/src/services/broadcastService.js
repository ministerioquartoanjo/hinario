export const remoteChannel = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('hinario_remote')
    : null;

export const broadcast = (action, value) => {
    remoteChannel?.postMessage({ action, value, source: 'main' });
};

export const broadcastState = (state, player) => {
    if (!remoteChannel) return;
    
    const isPlaying = player ? !player.paused && !player.ended && player.readyState > 2 : false;
    
    console.log('Broadcasting state:', { 
        playing: isPlaying, 
        playlist: state.isPlaylistActive,
        fullscreen: !!document.fullscreenElement 
    });

    broadcast('fullscreenState', !!document.fullscreenElement);
    broadcast('playlistState', state.isPlaylistActive);
    broadcast('playState', isPlaying);
    broadcast('speedState', player ? player.playbackRate : 1.0);
    broadcast('audioFiltersState', state.settings.audioFilters);
    broadcast('backgroundState', state.settings.showBackground);
    broadcast('completeState', state.settings.isCompleto);
};

export const setupBroadcastListeners = (actions, state) => {
    if (!remoteChannel) return;

    remoteChannel.onmessage = (event) => {
        const { action, source, ...data } = event.data || {};
        
        // Ignorar mensagens que não vêm do remote
        if (source !== 'remote') return;

        console.log('Remote action received:', action, data);

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
            case 'selectHino':
                if (data.numero) actions.selectHino(data.numero);
                break;
            default:
                if (actions[action]) {
                    actions[action]();
                } else {
                    console.warn(`Ação remota desconhecida: ${action}`);
                }
        }
    };
};
