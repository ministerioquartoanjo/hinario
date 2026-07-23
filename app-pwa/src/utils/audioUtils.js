/**
 * Web Audio API utilities for Hinario PWA
 */
export const audioUtils = {
    initAudioContext(state, options = {}) {
        const { applyFilters } = options;
        const player = document.getElementById('audio-player');
        if (!player) return null;

        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(player);

            const gainNode = audioCtx.createGain();
            const bassNode = audioCtx.createBiquadFilter();
            const midNode = audioCtx.createBiquadFilter();
            const trebleNode = audioCtx.createBiquadFilter();

            bassNode.type = 'lowshelf';
            bassNode.frequency.value = 200;
            midNode.type = 'peaking';
            midNode.frequency.value = 1000;
            midNode.Q.value = 1.0;
            trebleNode.type = 'highshelf';
            trebleNode.frequency.value = 3000;

            source.connect(bassNode);
            bassNode.connect(midNode);
            midNode.connect(trebleNode);
            trebleNode.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const nodes = { gainNode, bassNode, midNode, trebleNode };
            if (applyFilters) applyFilters(audioCtx, nodes, state.settings.audioFilters);
            
            return { audioCtx, source, ...nodes };
        } catch (e) {
            console.error("Erro ao inicializar Web Audio API:", e);
            return null;
        }
    },

    applyAudioFilters(audioCtx, nodes, filters) {
        if (!audioCtx || !nodes || !nodes.gainNode) return;
        
        const { gainNode, bassNode, midNode, trebleNode } = nodes;
        const now = audioCtx.currentTime;
        
        gainNode.gain.setTargetAtTime(filters.gain, now, 0.05);
        bassNode.gain.setTargetAtTime(filters.bass, now, 0.05);
        midNode.gain.setTargetAtTime(filters.mid, now, 0.05);
        trebleNode.gain.setTargetAtTime(filters.treble, now, 0.05);

        // Update UI components
        $('#range-gain').val(filters.gain);
        $('#label-gain').text(filters.gain.toFixed(1) + 'x');
        $('#eq-bass').val(filters.bass);
        $('#eq-mid').val(filters.mid);
        $('#eq-treble').val(filters.treble);
        $('#val-bass').text((filters.bass >= 0 ? '+' : '') + filters.bass + 'dB');
        $('#val-mid').text((filters.mid >= 0 ? '+' : '') + filters.mid + 'dB');
        $('#val-treble').text((filters.treble >= 0 ? '+' : '') + filters.treble + 'dB');
    }
};
