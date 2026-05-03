import { broadcast } from '../services/broadcastService.js';

/**
 * Audio Player component logic
 */
export const audioPlayer = {
    async loadAudio(numero, state, options = {}) {
        const { updateDisplay, applyFilters, broadcastFilters } = options;
        const player = document.getElementById('audio-player');
        const loading = document.getElementById('audio-loading');
        
        if (!player || !loading) return;

        // Reset play button immediately when loading new audio
        $('#btn-play-pause i, #btn-fs-play-pause i').removeClass('fa-pause').addClass('fa-play');

        // Helper: wait for audio to be ready to play
        const waitForReady = () => new Promise((resolve) => {
            if (player.readyState >= 3 && player.src) {
                // Add small delay to ensure player is fully initialized
                setTimeout(resolve, 50);
                return;
            }
            const onReady = () => {
                player.removeEventListener('canplaythrough', onReady);
                player.removeEventListener('canplay', onReady);
                player.removeEventListener('loadeddata', onReady);
                // Add small delay to ensure player is fully initialized
                setTimeout(resolve, 50);
            };
            player.addEventListener('canplaythrough', onReady);
            player.addEventListener('canplay', onReady);
            player.addEventListener('loadeddata', onReady);
        });
        
        const numStr = numero.toString().padStart(3, '0');
        const audioUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/${numStr}-piano.mp3`;
        const altUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/main/media/${numStr}-piano.mp3`;

        loading.classList.remove('hidden');

        const savedSpeed = localStorage.getItem(`speed_hino_${numero}`);
        const targetSpeed = savedSpeed ? parseFloat(savedSpeed) : 1.0;

        const hinoData = state.hinos.find(h => h.numero === numero);
        const savedFilters = localStorage.getItem(`audio_filters_hino_${numero}`);

        if (savedFilters) {
            state.settings.audioFilters = JSON.parse(savedFilters);
        } else if (hinoData && hinoData.audioFilters) {
            state.settings.audioFilters = { ...hinoData.audioFilters };
        }
        
        if (applyFilters) applyFilters();

        // Check Cache API
        if ('caches' in window) {
            const cache = await caches.open('mp3-cache');
            
            // Busca pela nova chave única primeiro, depois pelas URLs antigas para compatibilidade
            const uniqueKey = `hino_mp3_${numStr}`;
            const cachedResponse = await cache.match(uniqueKey) || 
                                 await cache.match(audioUrl) || 
                                 await cache.match(altUrl);
                                 
            if (cachedResponse) {
                const blob = await cachedResponse.blob();
                player.src = URL.createObjectURL(blob);
                player.load();
                player.playbackRate = targetSpeed;
                $('#speed-display, #fs-speed-display').text(targetSpeed.toFixed(1) + 'x');
                await waitForReady();
                loading.classList.add('hidden');
                return;
            }
        }

        // Fetch & Cache
        try {
            const response = await fetch(audioUrl);
            if (response.ok) {
                if ('caches' in window) {
                    const cache = await caches.open('mp3-cache');
                    await cache.put(audioUrl, response.clone());
                    if (updateDisplay) updateDisplay();
                }
                const blob = await response.blob();
                player.src = URL.createObjectURL(blob);
                player.load();
                player.playbackRate = targetSpeed;
                $('#speed-display, #fs-speed-display').text(targetSpeed.toFixed(1) + 'x');
                await waitForReady();
                loading.classList.add('hidden');
                if (broadcastFilters) broadcastFilters();
                return;
            }
        } catch (e) {
            console.warn('Fetch failed, using direct src:', e);
        }

        // Fallback
        player.src = audioUrl;
        player.load();
        player.playbackRate = targetSpeed;
        $('#speed-display, #fs-speed-display').text(targetSpeed.toFixed(1) + 'x');

        try {
            await waitForReady();
            loading.classList.add('hidden');
            player.playbackRate = targetSpeed;
            if (broadcastFilters) broadcastFilters();
        } catch (e) {
            console.warn("Audio load error:", e);
            loading.classList.add('hidden');
        }
    }
};
