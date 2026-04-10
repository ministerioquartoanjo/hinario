import { INITIAL_STATE } from './constants/defaults.js';

/**
 * Global application state
 */
export const state = { 
    ...INITIAL_STATE,
    // Runtime state (not persisted)
    audioCtx: null,
    source: null,
    gainNode: null,
    bassNode: null,
    midNode: null,
    trebleNode: null,
    fullscreenWarningTimeout: null
};
