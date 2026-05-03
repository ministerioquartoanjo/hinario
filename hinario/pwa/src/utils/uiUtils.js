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
    },

    showToast(message, type = 'info') {
        const bgMap = {
            'success': 'bg-green-600',
            'error': 'bg-red-600',
            'info': 'bg-blue-600',
            'warning': 'bg-orange-600'
        };
        
        const toast = $(`
            <div class="fixed bottom-4 left-1/2 -translate-x-1/2 ${bgMap[type] || bgMap.info} text-white px-6 py-3 rounded-full shadow-2xl z-[9999] animate-bounce-in flex items-center gap-2 min-w-[200px] justify-center">
                <i class="fas ${type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                <span class="font-bold text-sm">${message}</span>
            </div>
        `);
        
        $('body').append(toast);
        
        setTimeout(() => {
            toast.fadeOut(300, function() { $(this).remove(); });
        }, 3000);
    }
};
