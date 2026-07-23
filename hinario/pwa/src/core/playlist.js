export const playlistState = {
    autoScrollInterval: null,
    autoScrollStartTime: 0,
    autoScrollDelay: 0,
    playlistTimeouts: []
};

export const createPlaylist = ({ state, selectHino, renderHino, applySettings, AUTO_SCROLL_TITLE_DELAY }) => {
    const clearAllPlaylistTimeouts = () => {
        console.log('DEBUG: Limpando', playlistState.playlistTimeouts.length, 'timeouts pendentes');
        playlistState.playlistTimeouts.forEach(id => clearTimeout(id));
        playlistState.playlistTimeouts = [];
    };

    const stopAutoScroll = () => {
        console.log('DEBUG: stopAutoScroll executado, interval:', playlistState.autoScrollInterval);
        if (playlistState.autoScrollInterval) {
            clearInterval(playlistState.autoScrollInterval);
            playlistState.autoScrollInterval = null;
            console.log('DEBUG: Interval limpo');
        }
    };

    const startAutoScroll = (scrollDuration) => {
        console.log('DEBUG: startAutoScroll chamado, duration:', scrollDuration, 'isPlaylistActive:', state.isPlaylistActive);
        if (!state.isPlaylistActive) {
            console.log('DEBUG: Playlist não está ativa, cancelando startAutoScroll');
            return;
        }

        stopAutoScroll();
        const container = $('#slide-content > div');
        if (!container.length) return;

        const scrollHeight = container[0].scrollHeight - container[0].clientHeight;
        if (scrollHeight <= 0) return;

        const scrollStep = scrollHeight / (scrollDuration * 60);
        let currentScroll = 0;
        playlistState.autoScrollInterval = setInterval(() => {
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
        const introSeconds = state.currentHino.introducao || 0;
        const previewSeconds = state.settings.introPreviewSeconds ?? 3;
        const titleDelayMs = introSeconds > previewSeconds ? previewSeconds * 1000 : AUTO_SCROLL_TITLE_DELAY;

        const titleTimeout = setTimeout(() => {
            if (!state.isPlaylistActive || !state.currentHino) return;

            state.settings.isCompleto = true;
            state.currentSlide = 1;
            renderHino();
            applySettings();

            const hasIntroCountdown = introSeconds > 0;
            if (hasIntroCountdown) {
                const checkIntroComplete = setInterval(() => {
                    if (!state.isPlaylistActive) {
                        clearInterval(checkIntroComplete);
                        return;
                    }

                    const currentTime = player.currentTime || 0;
                    const introRemaining = introSeconds - currentTime;
                    if (currentTime >= introSeconds || introRemaining <= 0) {
                        clearInterval(checkIntroComplete);
                        const remainingDuration = duration - currentTime;
                        const scrollDuration = remainingDuration * 0.98;
                        if (scrollDuration > 5) {
                            const scrollTimeout = setTimeout(() => {
                                if (state.isPlaylistActive) startAutoScroll(scrollDuration);
                            }, 100);
                            playlistState.playlistTimeouts.push(scrollTimeout);
                        }
                    }
                }, 100);
            } else {
                const scrollDuration = duration * 0.98;
                if (scrollDuration > 5) {
                    const scrollTimeout = setTimeout(() => {
                        if (state.isPlaylistActive) startAutoScroll(scrollDuration);
                    }, 100);
                    playlistState.playlistTimeouts.push(scrollTimeout);
                }
            }
        }, titleDelayMs);

        playlistState.playlistTimeouts.push(titleTimeout);
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

    return { clearAllPlaylistTimeouts, stopAutoScroll, startAutoScroll, initPlaylistAutoScroll, playlistNextRandom, randomHino };
};
