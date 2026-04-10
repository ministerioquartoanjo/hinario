/**
 * Service to handle Cache API operations and downloads
 */
export const cacheService = {
    async initializeCounters() {
        try {
            if (!('caches' in window)) return { json: 0, mp3: 0 };
            
            const jsonCache = await caches.open('json-cache');
            const jsonKeys = await jsonCache.keys();
            
            const mp3Cache = await caches.open('mp3-cache');
            const mp3Keys = await mp3Cache.keys();
            
            return { json: jsonKeys.length, mp3: mp3Keys.length };
        } catch (e) {
            console.error('Erro ao inicializar contadores:', e);
            return { json: 0, mp3: 0 };
        }
    },

    async checkIfAllCached(cacheName, totalFiles, urlGenerator) {
        try {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            const existingUrls = new Set(keys.map(req => req.url));
            
            if (keys.length >= totalFiles * 0.95) return true; // Tolerância de 5%
            
            let allCached = true;
            for (let i = 1; i <= totalFiles; i++) {
                const url = urlGenerator(i);
                if (!existingUrls.has(url)) {
                    allCached = false;
                    break;
                }
            }
            return allCached;
        } catch (e) {
            console.error('Erro ao verificar cache completo:', e);
            return false;
        }
    },

    async downloadWithFallback(primaryUrl, fallbackUrl) {
        try {
            const response = await fetch(primaryUrl);
            if (response.ok) return { response, url: primaryUrl };
            throw new Error(`Primary failed: ${response.status}`);
        } catch (e) {
            console.log(`Primary URL failed, trying fallback: ${primaryUrl}`);
            const fallbackResponse = await fetch(fallbackUrl);
            if (fallbackResponse.ok) return { response: fallbackResponse, url: fallbackUrl };
            throw new Error(`Fallback also failed: ${fallbackResponse.status}`);
        }
    },

    async clearJsonCache() {
        try {
            const jsonCache = await caches.open('json-cache');
            const keys = await jsonCache.keys();
            await Promise.all(keys.map(key => jsonCache.delete(key)));
            console.log('JSON cache cleared');
        } catch (e) {
            console.error('Erro ao limpar cache JSON:', e);
        }
    },

    async updateCacheVersion() {
        try {
            const timestamp = Date.now();
            const newVersion = `${Math.floor(timestamp / 1000000)}.${Math.floor((timestamp % 1000000) / 1000)}.${timestamp % 1000}`;
            const versionCache = await caches.open('version-cache');
            await versionCache.put('cache-version', new Response(newVersion));
            console.log(`Cache version updated to: ${newVersion}`);
            return newVersion;
        } catch (e) {
            console.error('Erro ao atualizar versão do cache:', e);
            return '1.0.0';
        }
    },

    async checkCacheVersion(currentLocalVersion) {
        try {
            const versionCache = await caches.open('version-cache');
            const versionResponse = await versionCache.match('cache-version');
            const currentStoredVersion = versionResponse ? await versionResponse.text() : '0.0.0';
            
            if (currentStoredVersion !== currentLocalVersion) {
                console.log(`Cache version mismatch: ${currentStoredVersion} vs ${currentLocalVersion}`);
                await this.clearJsonCache();
                await versionCache.put('cache-version', new Response(currentLocalVersion));
                return true; // Needs update
            }
            return false;
        } catch (e) {
            console.error('Erro ao verificar versão do cache:', e);
            return false;
        }
    },

    async forceCacheUpdate() {
        console.log('Forcing cache update...');
        await this.clearJsonCache();
        return await this.updateCacheVersion();
    }
};
