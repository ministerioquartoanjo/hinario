/**
 * UI Utility functions for Hinario PWA
 */
export const uiUtils = {
    showDownloadStatus(show) {
        const status = document.getElementById('download-status');
        if (!status) return;
        if (show) {
            status.classList.remove('hidden');
        } else {
            status.classList.add('hidden');
        }
    },

    updateCacheDisplay(jsonCount, mp3Count) {
        const jsonEl = document.getElementById('json-count');
        const mp3El = document.getElementById('mp3-count');
        if (jsonEl) jsonEl.textContent = `${jsonCount} letras`;
        if (mp3El) mp3El.textContent = `${mp3Count} áudios`;
    },

    formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    },

    showFullscreenWarning(timeoutRef) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const message = document.getElementById('remote-warning');
        if (!message) return;

        message.textContent = 'Clique na tela principal para autorizar o modo tela cheia.';
        message.classList.remove('hidden', 'opacity-0');
        message.classList.add('opacity-100');

        timeoutRef.current = setTimeout(() => {
            message.classList.add('opacity-0');
            setTimeout(() => message.classList.add('hidden'), 300);
        }, 4000);
    },

    setupZoom(isCompletoGetter) {
        $(document).on('mouseover', '#slide-content *', function (e) {
            if (e.shiftKey && isCompletoGetter()) {
                $(this).addClass('zoom-effect');
            }
        }).on('mouseout', '#slide-content *', function () {
            $(this).removeClass('zoom-effect');
        });

        // CSS for zoom
        if (!$('#zoom-styles').length) {
            $('<style id="zoom-styles">').text(`
                .zoom-effect {
                    display: inline-block;
                    transform: scale(1.6);
                    transition: transform 0.2s;
                    z-index: 50;
                    position: relative;
                    background: rgba(234, 88, 12, 0.4);
                    padding: 0 4px;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                }
            `).appendTo('head');
        }
    }
};
