export let BACKGROUNDS = [];

export const createSettings = ({
    state,
    DEFAULT_BACKGROUNDS,
    broadcast,
    setInterfaceLanguage,
    setHymnLanguage,
    applyTranslations,
    audioUtils
}) => {
    const saveSettings = () => localStorage.setItem('hinario_settings', JSON.stringify(state.settings));

    const applySettings = () => {
        const body = document.body;
        body.classList.toggle('dark', state.settings.darkMode);

        // Broadcast tema para controle remoto
        broadcast('themeState', state.settings.darkMode);

        const $btnToggleBg = $('#btn-toggle-bg');
        if (state.settings.showBackground) {
            $btnToggleBg.css('background-color', '').addClass('bg-orange-dark').removeClass('bg-gray-500');
        } else {
            $btnToggleBg.css('background-color', '#6b7280').addClass('bg-gray-500').removeClass('bg-orange-dark');
        }

        $('#slide-content').css({
            'font-family': state.settings.fontFamily,
            'font-size': `${state.settings.fontSize}rem`,
            'line-height': state.settings.lineHeight,
            'color': state.settings.fontColor,
            'font-weight': 600
        });

        $('#slide-content h1').css({
            'font-size': `${(state.settings.fontSize || 1.5) * 1.3}rem`
        });

        $('#font-size-display').text(`${(Number(state.settings.fontSize) || 1.5).toFixed(2)}rem`);
        $('#line-height-display').text(state.settings.lineHeight || 1.4);
        $('#font-family-select').val(state.settings.fontFamily);
        $('#font-color-picker').val(state.settings.fontColor);
        $('#bg-color-picker').val(state.settings.bgColor || '#000000');
        $('#check-completo').prop('checked', state.settings.isCompleto);

        if (state.settings.showBackground) {
            const bgUrl = BACKGROUNDS[state.settings.bgIndex || 0];
            $('#slide-bg').removeClass('hidden').css({
                'background-image': `url('${bgUrl}')`,
                'background-color': 'transparent'
            });
            const $overlay = $('#slide-bg-overlay');
            const $preview = $('#slide-preview');
            const $handle = $('#slide-preview-resize-handle');
            $overlay.removeClass('hidden');
            $handle.removeClass('hidden');
            if (state.settings.slidePreviewWidth && state.settings.slidePreviewHeight) {
                const w = parseFloat(state.settings.slidePreviewWidth);
                const h = parseFloat(state.settings.slidePreviewHeight);
                $preview.css({ width: state.settings.slidePreviewWidth, height: state.settings.slidePreviewHeight });
                if ($handle.length) {
                    const handleW = $handle.outerWidth();
                    const handleH = $handle.outerHeight();
                    const offset = 4;
                    $handle.css({
                        left: `${Math.max(0, w - handleW - offset)}px`,
                        top: `${Math.max(0, h - handleH - offset)}px`,
                        right: 'auto',
                        bottom: 'auto'
                    });
                }
            } else {
                $preview.css({ width: '', height: '' });
                if ($handle.length) $handle.css({ left: 'auto', top: 'auto', right: '0.25rem', bottom: '0.25rem' });
            }
            $('#slide-content').css('text-shadow', '2px 2px 8px rgba(0,0,0,0.9), 0px 0px 10px rgba(0,0,0,0.5)');
        } else {
            $('#slide-bg').addClass('hidden');
            $('#slide-bg-overlay').addClass('hidden');
            $('#slide-preview-resize-handle').addClass('hidden');
            $('#slide-preview').css('background-color', state.settings.bgColor || '#000000');
            $('#slide-content').css('text-shadow', 'none');
        }
    };

    const loadSettings = () => {
        const saved = localStorage.getItem('hinario_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(state.settings, parsed);
        }

        if (!Array.isArray(state.settings.customBackgrounds)) {
            state.settings.customBackgrounds = [];
        }

        BACKGROUNDS = [...DEFAULT_BACKGROUNDS, ...state.settings.customBackgrounds];

        if (state.settings.interfaceLanguage) setInterfaceLanguage(state.settings.interfaceLanguage);
        if (state.settings.hymnLanguage) setHymnLanguage(state.settings.hymnLanguage);

        applySettings();
        applyTranslations();

        const $list = $('#custom-bg-list');
        if ($list.length) {
            $list.empty();
            state.settings.customBackgrounds.forEach((bg, index) => {
                const $item = $(`
                    <div class="flex items-center justify-between bg-gray-100 p-2 rounded-lg group">
                        <span class="truncate text-xs flex-1 mr-2">${bg}</span>
                        <button class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1" onclick="window.removeCustomBg(${index})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `);
                $list.append($item);
            });
        }

        if (state.audioCtx) audioUtils.applyAudioFilters(state.audioCtx, state, state.settings.audioFilters);
    };

    const setBackgrounds = (backgrounds) => {
        BACKGROUNDS = backgrounds;
    };

    return { saveSettings, applySettings, loadSettings, setBackgrounds };
};
