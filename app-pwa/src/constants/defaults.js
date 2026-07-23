export const DEFAULT_BACKGROUNDS = [
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=1920&q=80'
];

export const DEFAULT_AUDIO_FILTERS = {
    gain: 1.2,
    bass: 0,
    mid: -5,
    treble: 12
};

export const INITIAL_STATE = {
    hinos: [],
    currentHino: null,
    currentSlide: 0,
    isPlaylistActive: false,
    isFullscreenActive: false,
    settings: {
        fontSize: 1.5,
        lineHeight: 1.4,
        fontFamily: 'Inter',
        fontColor: '#FFFFFF',
        showBackground: true,
        darkMode: false,
        isCompleto: true,
        bgIndex: 0,
        customBackgrounds: [],
        bgColor: '#000000',
        audioFilters: { ...DEFAULT_AUDIO_FILTERS },
        interfaceLanguage: 'pt',
        hymnLanguage: 'pt',
        introPreviewSeconds: 3
    }
};
