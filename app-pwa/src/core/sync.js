export const createSync = ({ state, getHymnPathPrefix, cacheService, uiUtils, t, getCachedCounts, setCachedCounts }) => {
    const downloadJSONs = async () => {
        const total = 196;
        const cache = await caches.open('json-cache');
        const prefix = getHymnPathPrefix();
        uiUtils.showDownloadStatus(true);

        for (let i = 1; i <= total; i++) {
            const numStr = i.toString().padStart(3, '0');
            const url = `${prefix}/${numStr}.json`;
            try {
                const response = await fetch(url);
                if (response.ok) await cache.put(url, response.clone());
            } catch (e) {
                console.error(e);
            }
            if (i % 10 === 0) uiUtils.updateCacheDisplay(i, getCachedCounts().mp3);
        }

        await cacheService.updateCacheVersion();
        uiUtils.showDownloadStatus(false);
        alert(t('syncComplete'));
    };

    const downloadMP3s = async () => {
        const total = 196;
        const mp3Cache = await caches.open('mp3-cache');
        uiUtils.showDownloadStatus(true);
        const chunkSize = 5;
        const delayBetweenChunks = 300;

        for (let i = 1; i <= total;) {
            const chunk = [];
            for (let j = 0; j < chunkSize && (i + j) <= total; j++) chunk.push(i + j);
            console.log(`Baixando lote: ${chunk[0]} até ${chunk[chunk.length - 1]}`);

            await Promise.all(chunk.map(async (num) => {
                const numStr = num.toString().padStart(3, '0');
                const primaryUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/refs/heads/desenv/media/${numStr}-piano.mp3`;
                const fallbackUrl = `https://raw.githubusercontent.com/ministerioquartoanjo/hinario/main/media/${numStr}-piano.mp3`;
                const storageKey = `hino_mp3_${numStr}`;

                try {
                    const { response, url } = await cacheService.downloadWithFallback(primaryUrl, fallbackUrl);
                    console.log(`Hino ${num} baixado de: ${url}`);
                    await mp3Cache.put(storageKey, response.clone());
                    console.log(`Hino ${num} salvo no cache com chave única: ${storageKey}`);
                } catch (e) {
                    console.error(`FALHA hino ${num}:`, e);
                }
            }));

            i += chunk.length;
            const keys = await mp3Cache.keys();
            const validCount = keys.filter(key => key.url.includes('hino_mp3_')).length;
            uiUtils.updateCacheDisplay(getCachedCounts().json, validCount);
            if (i <= total) await new Promise(resolve => setTimeout(resolve, delayBetweenChunks));
        }

        const finalKeys = await mp3Cache.keys();
        const cachedMp3Count = finalKeys.filter(key => key.url.includes('hino_mp3_')).length;
        setCachedCounts({ mp3: cachedMp3Count });
        uiUtils.updateCacheDisplay(getCachedCounts().json, cachedMp3Count);
        uiUtils.showDownloadStatus(false);

        if (cachedMp3Count < total) alert(t('partialSync', { count: cachedMp3Count, total }));
        else alert(t('fullSync', { total }));
    };

    const handleDownload = async () => {
        if (!state.currentHino) return alert(t('selectHinoForDownload'));
    };

    return { downloadJSONs, downloadMP3s, handleDownload };
};
