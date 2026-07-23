/**
 * Service to handle settings persistence, import and export
 */
export const settingsService = {
    exportData() {
        const data = {
            settings: JSON.parse(localStorage.getItem('hinario_settings')),
            hinoSpeeds: {},
            hinoVideos: {},
            hinoFilters: {}
        };

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('speed_hino_')) {
                data.hinoSpeeds[key] = localStorage.getItem(key);
            } else if (key.startsWith('videos_hino_')) {
                data.hinoVideos[key] = JSON.parse(localStorage.getItem(key));
            } else if (key.startsWith('audio_filters_hino_')) {
                data.hinoFilters[key] = JSON.parse(localStorage.getItem(key));
            }
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hinario-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importData(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.settings) localStorage.setItem('hinario_settings', JSON.stringify(data.settings));
                if (data.hinoSpeeds) {
                    Object.entries(data.hinoSpeeds).forEach(([key, val]) => localStorage.setItem(key, val));
                }
                if (data.hinoVideos) {
                    Object.entries(data.hinoVideos).forEach(([key, val]) => localStorage.setItem(key, JSON.stringify(val)));
                }
                if (data.hinoFilters) {
                    Object.entries(data.hinoFilters).forEach(([key, val]) => localStorage.setItem(key, JSON.stringify(val)));
                }
                alert('Dados importados com sucesso! Recarregando...');
                location.reload();
            } catch (err) {
                alert('Erro ao importar arquivo. Verifique se o formato está correto.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    }
};
