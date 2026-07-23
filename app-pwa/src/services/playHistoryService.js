const STORAGE_KEY = 'hinario_play_history';
const MAX_ENTRIES = 30;

const getHistory = () => {
    try {
        const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(history) ? history : [];
    } catch {
        return [];
    }
};

const formatPlayedAt = (playedAt) => {
    const formatted = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'Etc/GMT+3',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).format(new Date(playedAt));

    return `${formatted.replace(',', ' às')} GMT-3`;
};

export const createPlayHistory = ({ selectHino, initAudio }) => {
    const container = document.getElementById('play-history-list');

    const render = () => {
        if (!container) return;
        const history = getHistory();
        container.replaceChildren();

        if (!history.length) {
            const empty = document.createElement('p');
            empty.className = 'text-sm text-gray-400 dark:text-gray-500 italic';
            empty.textContent = 'Nenhum hino tocado ainda.';
            container.append(empty);
            return;
        }

        history.forEach((entry) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'play-history-item w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 hover:border-orange-dark hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors';

            const title = document.createElement('span');
            title.className = 'block text-sm font-semibold text-gray-800 dark:text-gray-100';
            title.textContent = `${entry.numero} - ${entry.titulo}`;

            const timestamp = document.createElement('span');
            timestamp.className = 'block mt-1 text-xs text-gray-500 dark:text-gray-400';
            timestamp.textContent = formatPlayedAt(entry.playedAt);

            button.append(title, timestamp);
            button.addEventListener('click', async () => {
                await selectHino(entry.numero);
                initAudio();
                const player = document.getElementById('audio-player');
                if (player) player.play().catch(() => {});
            });
            container.append(button);
        });
    };

    const record = (hino) => {
        if (!hino?.numero || !hino?.titulo) return;
        const entry = { numero: hino.numero, titulo: hino.titulo, playedAt: new Date().toISOString() };
        const history = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        render();
    };

    return { render, record };
};
