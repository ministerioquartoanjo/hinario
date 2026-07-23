import { INITIAL_STATE } from './constants/defaults.js';

/**
 * Global application state
 */
export const state = { 
    ...INITIAL_STATE,
    // Runtime state (not persisted)
    isPlaylistActive: false,
    currentPlaylist: [],
    audioCtx: null,
    source: null,
    // OBS State
    obsConnected: false,
    obsEnabled: false,
    // Merge runtime settings with persisted settings
    settings: {
        ...INITIAL_STATE.settings,
        gainNode: null,
        bassNode: null,
        midNode: null,
        trebleNode: null,
        fullscreenWarningTimeout: null
    }
};
