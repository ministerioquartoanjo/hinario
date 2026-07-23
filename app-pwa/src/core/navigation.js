export const navState = {
    userManuallyNavigated: false,
    introTransitionTimeout: null
};

export const createNavigation = ({
    state,
    renderHino,
    loadAudio,
    hinoLoader,
    uiUtils,
    getHymnPathPrefix,
    hinoRenderer,
    initPlaylistAutoScroll,
    playlistNextRandom,
    stopAutoScroll
}) => {
    const nextSlide = () => {
        if (!state.currentHino) return;
        navState.userManuallyNavigated = true;
        if (navState.introTransitionTimeout) {
            clearTimeout(navState.introTransitionTimeout);
            navState.introTransitionTimeout = null;
        }
        if (state.settings.isCompleto) {
            if (state.currentSlide === 0) {
                state.currentSlide = 1;
                renderHino();
            }
            return;
        }
        if (state.currentSlide < state.currentHino.letras.length - 1) {
            state.currentSlide++;
            renderHino();
        } else if (state.isPlaylistActive) {
            playlistNextRandom();
        }
    };

    const prevSlide = () => {
        if (!state.currentHino || state.currentSlide <= 0) return;
        navState.userManuallyNavigated = true;
        if (navState.introTransitionTimeout) {
            clearTimeout(navState.introTransitionTimeout);
            navState.introTransitionTimeout = null;
        }
        state.currentSlide--;
        renderHino();
    };

    const selectHino = async (hinoOrIndex) => {
        const numero = typeof hinoOrIndex === 'number' ? hinoOrIndex : hinoOrIndex?.numero;
        if (!numero) return;
        const hino = state.hinos.find(h => h.numero === numero);
        if (!hino) return;

        if (!hino.loaded) {
            uiUtils.showDownloadStatus(true);
            const numStr = hino.numero.toString().padStart(3, '0');
            const url = `${getHymnPathPrefix()}/${numStr}.json`;

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
                if (transformed) {
                    const { numero: _, titulo: __, ...rest } = transformed;
                    Object.assign(hino, rest, { loaded: true });
                    if (!hino.titulo && transformed.titulo) hino.titulo = transformed.titulo;
                    if (!hino.numero && transformed.numero) hino.numero = transformed.numero;
                }
            } catch (e) {
                console.error('Erro ao carregar hino:', e);
            } finally {
                uiUtils.showDownloadStatus(false);
            }
        }

        state.currentHino = hino;
        state.currentSlide = 0;
        navState.userManuallyNavigated = false;
        if (navState.introTransitionTimeout) clearTimeout(navState.introTransitionTimeout);
        navState.introTransitionTimeout = null;
        renderHino();
        await loadAudio(hino.numero);
        $('#hino-search').val(`${hino.numero} - ${hino.titulo}`).blur();
        hinoRenderer.updateVideos(hino);
        document.getElementById('slide-preview').scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (state.isPlaylistActive) {
            initPlaylistAutoScroll();
        }
    };

    const nextHino = () => {
        if (!state.currentHino || !state.hinos.length) return;
        const idx = state.hinos.findIndex(h => h.numero === state.currentHino.numero);
        if (idx === -1) return;
        return selectHino(state.hinos[(idx + 1) % state.hinos.length]);
    };

    const prevHino = () => {
        if (!state.currentHino || !state.hinos.length) return;
        const idx = state.hinos.findIndex(h => h.numero === state.currentHino.numero);
        if (idx === -1) return;
        return selectHino(state.hinos[(idx - 1 + state.hinos.length) % state.hinos.length]);
    };

    const scrollUp = () => {
        stopAutoScroll();
        if (state.settings.isCompleto) {
            const container = $('#slide-content > div');
            if (container.length) container.scrollTop(container.scrollTop() - 100);
        } else {
            prevSlide();
        }
    };

    const scrollDown = () => {
        stopAutoScroll();
        if (state.settings.isCompleto) {
            const container = $('#slide-content > div');
            if (container.length) container.scrollTop(container.scrollTop() + 100);
        } else {
            nextSlide();
        }
    };

    return { nextSlide, prevSlide, nextHino, prevHino, scrollUp, scrollDown, selectHino };
};
