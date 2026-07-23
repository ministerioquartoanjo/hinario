export const setupKeyboard = (actions) => {
    const { state, stopAutoScroll, nextSlide, prevSlide, nextHino, prevHino, renderHino, selectHino, applySettings, saveSettings, broadcast } = actions;

    $(document).on('keydown', (e) => {
        if ($(e.target).is('input, textarea, select') && !$(e.target).is('input[type="color"]')) return;

        switch (e.key) {
            case 'ArrowRight':
            case ' ':
                e.preventDefault();
                stopAutoScroll();
                nextSlide();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                stopAutoScroll();
                prevSlide();
                break;
            case 'ArrowUp':
                stopAutoScroll();
                if (state.settings.isCompleto) {
                    const container = $('#slide-content > div');
                    container.scrollTop(container.scrollTop() - 50);
                } else prevHino();
                break;
            case 'ArrowDown':
                stopAutoScroll();
                if (state.settings.isCompleto) {
                    const container = $('#slide-content > div');
                    container.scrollTop(container.scrollTop() + 50);
                } else nextHino();
                break;
            case 'Home':
                stopAutoScroll();
                state.currentSlide = 0;
                renderHino();
                break;
            case 'End':
                stopAutoScroll();
                if (state.currentHino) {
                    state.currentSlide = state.currentHino.letras.length - 1;
                    renderHino();
                }
                break;
            case 'f':
            case 'F': $('#btn-toggle-bg').click(); break;
            case 'b':
            case 'B': $('#btn-change-bg').click(); break;
            case 'c':
            case 'C': $('#check-completo').click(); break;
            case 'a':
            case 'A':
                if (e.altKey) {
                    localStorage.removeItem('hinario_settings');
                    location.reload();
                } else $('#btn-random-hino').click();
                break;
            case 's':
            case 'S':
                if (!state.hinos.length) return;
                selectHino(state.hinos[Math.floor(Math.random() * state.hinos.length)]).then(() => {
                    const player = document.getElementById('audio-player');
                    if (player) player.play();
                });
                break;
            case 'p':
            case 'P': $('#btn-play-pause').click(); break;
            case 'F8':
                e.preventDefault();
                $('#menu-remote-control').click();
                break;
            case 'Escape':
                $('.btn-close-modal').click();
                if (document.fullscreenElement) document.exitFullscreen();
                break;
            case '+':
            case '=': {
                e.preventDefault();
                const player = document.getElementById('audio-player');
                if (player) {
                    player.playbackRate = Math.min(player.playbackRate + 0.1, 2.0);
                    $('#speed-display, #fs-speed-display').text(player.playbackRate.toFixed(1) + 'x');
                    broadcast('speedState', player.playbackRate);
                }
                break;
            }
            case '-':
            case '_': {
                e.preventDefault();
                const player = document.getElementById('audio-player');
                if (player) {
                    player.playbackRate = Math.max(player.playbackRate - 0.1, 0.5);
                    $('#speed-display, #fs-speed-display').text(player.playbackRate.toFixed(1) + 'x');
                    broadcast('speedState', player.playbackRate);
                }
                break;
            }
            case ']':
                e.preventDefault();
                state.settings.fontSize += 0.1;
                applySettings();
                saveSettings();
                break;
            case '[':
                e.preventDefault();
                state.settings.fontSize = Math.max(0.5, state.settings.fontSize - 0.1);
                applySettings();
                saveSettings();
                break;
        }
    });
};
