/**
 * Hino Renderer component logic
 */
export const hinoRenderer = {
    renderHino(state, options = {}) {
        const { applySettings } = options;
        const navControls = document.getElementById('slide-nav-controls');
        if (navControls) {
            if (state.currentHino) navControls.classList.remove('hidden');
            else navControls.classList.add('hidden');
        }

        if (!state.currentHino) return;

        const content = $('#slide-content');
        const counter = $('#slide-counter');
        const currentSlideData = state.currentHino.letras[state.currentSlide];

        // Verificar se é Slide de Capa
        if (currentSlideData && currentSlideData.tipo === 'capa') {
            content.html(`
                <div class="flex flex-col items-center justify-center h-full animate-fade-in">
                    <h1 class="text-4xl md:text-6xl font-black mb-6 text-center leading-tight drop-shadow-lg text-white">
                        ${currentSlideData.titulo}
                    </h1>
                    <p class="text-xl md:text-2xl font-light italic opacity-80 mt-4 text-white">
                        ${currentSlideData.autor}
                    </p>
                    <p class="text-sm mt-8 opacity-50 hidden md:block">(Clique duas vezes para iniciar)</p>
                </div>
            `);
            counter.addClass('hidden');
        } else if (state.settings.isCompleto) {
            // Modo Completo (Texto Corrido)
            const fullText = state.currentHino.letras
                .filter(l => l.tipo !== 'capa')
                .map(l =>
                    `<div class="mb-4 ${l.tipo === 'refrão' ? 'font-bold italic' : ''}" ${l.tipo === 'refrão' ? 'style="color: #fde047;"' : ''}>${l.texto.replace(/\n/g, '<br>')}</div>`
                ).join('');
            content.html(`<div class="overflow-y-auto max-h-full w-full px-4 text-left custom-scrollbar pb-12">${fullText}</div>`);
            counter.addClass('hidden');
        } else {
            // Modo Slides (Versos/Coros)
            const letra = currentSlideData;
            content.html(`
                <div class="${letra.tipo === 'refrão' ? 'font-bold italic scale-105' : ''} transition-all duration-300"
                     ${letra.tipo === 'refrão' ? 'style="color: #fde047;"' : ''}>
                    ${letra.texto.replace(/\n/g, '<br>')}
                </div>
            `);

            // Ajustar contador (subtrair 1 pois o 0 é capa)
            const totalSlidesReal = state.currentHino.letras.length - 1;
            const currentReal = state.currentSlide;
            counter.removeClass('hidden').text(`${currentReal}/${totalSlidesReal}`);
        }

        if (applySettings) applySettings();
    },

    updateVideos(hino) {
        const videoSection = $('#video-section');
        const videoList = $('#video-list');
        if (!videoSection.length || !videoList.length) return;

        videoSection.removeClass('hidden');
        videoList.empty();

        // Mesclar vídeos do JSON (se existirem) com vídeos do LocalStorage
        const localVideos = JSON.parse(localStorage.getItem(`videos_hino_${hino.numero}`) || '[]');
        const jsonVideos = hino.videos || [];
        
        // Evitar duplicatas se o mesmo vídeo estiver no JSON e no LocalStorage
        const allVideos = [...jsonVideos];
        localVideos.forEach(lv => {
            if (!allVideos.some(jv => jv.url === lv.url)) {
                allVideos.push(lv);
            }
        });

        if (allVideos.length === 0) {
            videoList.append('<p class="text-sm text-gray-400 italic">Nenhum vídeo personalizado adicionado.</p>');
        } else {
            allVideos.forEach(v => {
                const videoId = hinoRenderer.extractVideoId(v.url);
                const isLocal = localVideos.some(lv => lv.url === v.url);
                videoList.append(`
                    <div class="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg flex gap-3 items-center">
                        <img src="https://img.youtube.com/vi/${videoId}/default.jpg" class="w-20 rounded" alt="Thumbnail">
                        <div class="flex-grow">
                            <a href="${v.url}" target="_blank" class="text-sm font-semibold hover:text-orange-dark line-clamp-1">${v.title || 'Vídeo no YouTube'}</a>
                            ${isLocal ? `<button class="text-xs text-red-500 mt-1" onclick="removeVideo(${hino.numero}, '${v.url}')">Remover</button>` : ''}
                        </div>
                    </div>
                `);
            });
        }
    },

    extractVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
};
