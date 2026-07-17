        import { searchLogic } from './searchLogic.js';

        // Sincronização simples via BroadcastChannel
        const bc = new BroadcastChannel('hinario_remote');
        let isFullscreenActive = false;

        const send = (action, extra = {}) => {
            bc.postMessage({ action, source: 'remote', ...extra });
            // Haptic feedback se disponível
            if (navigator.vibrate) navigator.vibrate(50);
        };

        const fullscreenBtn = document.getElementById('remote-fullscreen');
        const fullscreenIcon = fullscreenBtn.querySelector('i');
        const fullscreenLabel = fullscreenBtn.querySelector('span');
        const fullscreenStatus = document.getElementById('remote-fs-status');
        const hinoInput = document.getElementById('remote-hino-number');
        const hinoFeedback = document.getElementById('remote-hino-feedback');
        const hinoOptions = document.getElementById('remote-hino-options');
        const hinoClearBtn = document.getElementById('remote-clear-hino');
        const searchResultsBox = document.getElementById('remote-search-results');
        const playlistBtn = document.getElementById('remote-random-playlist');
        const playlistIcon = playlistBtn.querySelector('i');
        const playlistLabel = playlistBtn.querySelector('span');
        let isPlaylistActive = false;
        const bgBtn = document.getElementById('remote-toggle-bg');
        const bgIcon = bgBtn.querySelector('i');
        const bgLabel = bgBtn.querySelector('span');
        let isBgActive = false;
        const completeBtn = document.getElementById('remote-toggle-complete');
        const completeIcon = completeBtn.querySelector('i');
        const completeLabel = completeBtn.querySelector('span');
        let isCompleteActive = false;
        
        const obsBtn = document.getElementById('remote-obs-toggle');
        const obsIcon = obsBtn.querySelector('i');
        const obsLabel = obsBtn.querySelector('span');
        let isObsActive = false;
        let isObsConnected = false;

        const playBtn = document.getElementById('remote-play');
        const playIcon = playBtn.querySelector('i');
        const playLabel = playBtn.querySelector('span');
        const stopBtn = document.getElementById('remote-stop');
        const stopIcon = stopBtn.querySelector('i');
        const stopLabel = stopBtn.querySelector('span');
        const speedDisplay = document.getElementById('remote-speed-display');
        let isPlaying = false;
        let remoteHinosList = [];
        let remoteFilteredHinos = [];
        let remoteSelectedResult = -1;

        const updatePlayState = (playing) => {
            isPlaying = playing;
            playIcon.className = playing ? 'fas fa-pause text-xs' : 'fas fa-play text-xs';
            playLabel.textContent = playing ? 'Pausar' : 'Play';
            
            if (playing) {
                playBtn.style.backgroundColor = 'rgb(249 115 22)'; // orange-dark
                playBtn.classList.add('bg-orange-dark');
                playBtn.classList.remove('bg-gray-200');
            } else {
                playBtn.style.backgroundColor = 'rgb(229 231 235)'; // gray-200
                playBtn.classList.remove('bg-orange-dark');
                playBtn.classList.add('bg-gray-200');
            }
        };

        const updateAudioFilters = (filters) => {
            if (!filters || typeof filters !== 'object') return;
            if (filters.gain !== undefined) {
                document.getElementById('remote-range-gain').value = filters.gain;
                document.getElementById('remote-label-gain').textContent = parseFloat(filters.gain).toFixed(1) + 'x';
            }
            if (filters.bass !== undefined) {
                document.getElementById('remote-range-bass').value = filters.bass;
                const sign = parseInt(filters.bass) > 0 ? '+' : '';
                document.getElementById('remote-label-bass-val').textContent = sign + filters.bass + 'dB';
            }
            if (filters.mid !== undefined) {
                document.getElementById('remote-range-mid').value = filters.mid;
                const sign = parseInt(filters.mid) > 0 ? '+' : '';
                document.getElementById('remote-label-mid-val').textContent = sign + filters.mid + 'dB';
            }
            if (filters.treble !== undefined) {
                document.getElementById('remote-range-treble').value = filters.treble;
                const sign = parseInt(filters.treble) > 0 ? '+' : '';
                document.getElementById('remote-label-treble-val').textContent = sign + filters.treble + 'dB';
            }
        };

        const updateBackgroundState = (active) => {
            isBgActive = active;
            if (active) {
                bgBtn.style.backgroundColor = 'rgb(34 197 94)';
                bgBtn.classList.remove('bg-gray-200');
                bgBtn.classList.add('bg-green-600');
            } else {
                bgBtn.style.backgroundColor = 'rgb(229 231 235)';
                bgBtn.classList.remove('bg-green-600');
                bgBtn.classList.add('bg-gray-200');
            }
            bgLabel.textContent = active ? 'Fundo ON' : 'Fundo';
        };

        const updateCompleteState = (active) => {
            isCompleteActive = active;
            if (active) {
                completeBtn.style.backgroundColor = 'rgb(249 115 22)';
                completeBtn.classList.remove('bg-gray-200');
                completeBtn.classList.add('bg-orange-dark');
            } else {
                completeBtn.style.backgroundColor = 'rgb(229 231 235)';
                completeBtn.classList.remove('bg-orange-dark');
                completeBtn.classList.add('bg-gray-200');
            }
            completeLabel.textContent = active ? 'Completo ON' : 'Completo';
        };

        const updatePlaylistState = (active) => {
            isPlaylistActive = active;
            playlistIcon.classList.toggle('fa-random', !active);
            playlistIcon.classList.toggle('fa-stop', active);
            playlistLabel.textContent = active ? 'Parar Playlist' : 'Playlist';
            playlistBtn.classList.toggle('bg-green-600', active);
            playlistBtn.classList.toggle('bg-gray-900', !active);
        };

        const updateFullscreenState = (active) => {
            isFullscreenActive = active;
            fullscreenIcon.classList.toggle('fa-expand', !active);
            fullscreenIcon.classList.toggle('fa-compress', active);
            fullscreenLabel.textContent = active ? 'Sair da Tela Cheia' : 'Entrar em Tela Cheia';
            fullscreenStatus.textContent = active ? 'Modo Tela Cheia' : 'Tela Normal';
            fullscreenStatus.classList.toggle('text-green-400', active);
            fullscreenStatus.classList.toggle('text-gray-400', !active);
        };

        const updateObsState = (active) => {
            isObsActive = active;
            obsIcon.className = active ? 'fas fa-eye text-white' : 'fas fa-eye-slash text-blue-400';
            obsBtn.classList.toggle('bg-green-600', active);
            obsBtn.classList.toggle('bg-gray-200', !active && isObsConnected);
            obsLabel.textContent = active ? 'OBS ON' : 'OBS';
        };

        const updateObsConnected = (connected) => {
            isObsConnected = connected;
            obsBtn.disabled = !connected;
            obsBtn.classList.toggle('opacity-50', !connected);
            obsBtn.classList.toggle('cursor-not-allowed', !connected);
            
            // Atualizar modal interno de configurações do OBS
            const indicator = document.getElementById('remote-obs-status-indicator');
            const text = document.getElementById('remote-obs-status-text');
            const btnConnect = document.getElementById('remote-btn-obs-connect');
            const btnDisconnect = document.getElementById('remote-btn-obs-disconnect');
            const btnCreateSource = document.getElementById('remote-btn-obs-create-source');

            if (indicator && text && btnConnect && btnDisconnect && btnCreateSource) {
                indicator.classList.toggle('bg-red-500', !connected);
                indicator.classList.toggle('bg-green-500', connected);
                text.textContent = connected ? 'Conectado' : 'Desconectado';
                btnConnect.classList.toggle('hidden', connected);
                btnDisconnect.classList.toggle('hidden', !connected);
                btnCreateSource.classList.toggle('hidden', !connected);
            }

            if (!connected) {
                obsIcon.className = 'fas fa-eye-slash text-gray-400';
                obsLabel.textContent = 'OBS';
                obsBtn.classList.remove('bg-green-600', 'bg-gray-200');
                obsBtn.classList.add('bg-gray-300');
            } else if (!isObsActive) {
                obsBtn.classList.remove('bg-gray-300');
                obsBtn.classList.add('bg-gray-200');
                obsIcon.className = 'fas fa-eye-slash text-blue-400';
            }
        };

        bc.onmessage = (event) => {
            const { action, value, source } = event.data || {};
            
            if (source === 'main') {
                if (action === 'fullscreenState') {
                    updateFullscreenState(Boolean(value));
                } else if (action === 'playlistState') {
                    updatePlaylistState(Boolean(value));
                } else if (action === 'playState') {
                    updatePlayState(Boolean(value));
                } else if (action === 'speedState') {
                    if (value !== undefined) speedDisplay.textContent = Number(value).toFixed(1) + 'x';
                } else if (action === 'audioFiltersState') {
                    updateAudioFilters(value);
                } else if (action === 'backgroundState') {
                    updateBackgroundState(Boolean(value));
                } else if (action === 'completeState') {
                    updateCompleteState(Boolean(value));
                } else if (action === 'obsState') {
                    updateObsState(Boolean(value));
                } else if (action === 'obsConnected') {
                    updateObsConnected(Boolean(value));
                } else if (action === 'themeState') {
                    // Aplicar tema recebido da página principal
                    document.documentElement.classList.toggle('dark', Boolean(value));
                }
            }
        };

        const formatOption = (numero, titulo) => {
            return `${String(numero).padStart(3, '0')} - ${titulo}`;
        };

        const parseNumeroFromInput = (value) => {
            if (!value) return null;
            const match = value.trim().match(/^(\d{1,4})/);
            return match ? parseInt(match[1], 10) : null;
        };

        const populateHinoOptions = (list) => {
            remoteHinosList = list || [];
        };

        const renderRemoteResults = (list) => {
            remoteFilteredHinos = list;
            if (!list.length) {
                searchResultsBox.classList.add('hidden');
                searchResultsBox.innerHTML = '';
                return;
            }

            searchResultsBox.innerHTML = list.map((h, idx) => {
                const letraPreview = h.letras && h.letras[0] ? h.letras[0].texto.substring(0, 45).replace(/\n/g, ' ') : '';
                return `
                    <div class="remote-search-item ${idx === remoteSelectedResult ? 'active' : ''}" data-index="${idx}">
                        <div class="font-bold flex justify-between items-center">
                            <span>${h.numero} - ${h.titulo}</span>
                            <span class="text-[10px] opacity-50">#${h.numero}</span>
                        </div>
                        <div class="text-[11px] opacity-70 truncate mt-1">${letraPreview}...</div>
                    </div>
                `;
            }).join('');
            searchResultsBox.classList.remove('hidden');
        };

        const loadHinosIndex = async () => {
            try {
                const response = await fetch('data/hymns-index.json');
                if (!response.ok) throw new Error('Falha ao carregar lista');
                const data = await response.json();
                populateHinoOptions(data);
            } catch (error) {
                console.error('Erro ao carregar hinos para autocomplete:', error);
                hinoFeedback.textContent = 'Falha ao carregar lista de hinos.';
                hinoFeedback.classList.add('text-red-400');
            }
        };

        const selectRemoteHino = (hino) => {
            if (!hino) return;
            hinoInput.value = `${hino.numero} - ${hino.titulo}`;
            searchResultsBox.classList.add('hidden');
            remoteSelectedResult = -1;
            send('stopAudio');
            updatePlayState(false);
            send('selectHino', { numero: hino.numero });
            hinoFeedback.textContent = `Solicitando hino ${hino.numero}...`;
            hinoFeedback.classList.remove('text-red-400');
            hinoFeedback.classList.add('text-green-400');
        };

        const submitHino = () => {
            const numero = parseNumeroFromInput(hinoInput.value);
            if (!numero || numero < 1) {
                hinoFeedback.textContent = 'Informe um número válido.';
                hinoFeedback.classList.replace('text-green-400', 'text-red-400');
                return;
            }
            send('stopAudio');
            updatePlayState(false);
            send('selectHino', { numero });
            hinoFeedback.textContent = `Solicitando hino ${numero}...`;
            hinoFeedback.classList.remove('text-red-400');
            hinoFeedback.classList.add('text-green-400');
        };

        hinoInput.addEventListener('input', (event) => {
            const matches = searchLogic.filterHinos(remoteHinosList, event.target.value, 8);
            remoteSelectedResult = -1;
            renderRemoteResults(matches);
        });

        hinoInput.addEventListener('keydown', (event) => {
            if (searchResultsBox.classList.contains('hidden')) {
                if (event.key === 'Enter') submitHino();
                return;
            }

            const prevIndex = remoteSelectedResult;
            remoteSelectedResult = searchLogic.handleKeyboardNavigation(event, remoteSelectedResult, remoteFilteredHinos.length);

            if (event.key === 'Escape') {
                searchResultsBox.classList.add('hidden');
            } else if (event.key === 'Enter') {
                const hino = remoteSelectedResult > -1 ? remoteFilteredHinos[remoteSelectedResult] : remoteFilteredHinos[0];
                if (hino) {
                    event.preventDefault();
                    selectRemoteHino(hino);
                } else {
                    submitHino();
                }
            } else if (prevIndex !== remoteSelectedResult) {
                renderRemoteResults(remoteFilteredHinos);
            }
        });

        searchResultsBox.addEventListener('click', (event) => {
            const item = event.target.closest('.remote-search-item');
            if (!item) return;
            const index = Number(item.dataset.index);
            const hino = remoteFilteredHinos[index];
            if (hino) selectRemoteHino(hino);
        });

        document.getElementById('remote-prev').onclick = () => send('prevSlide');
        document.getElementById('remote-next').onclick = () => {
            if (isPlaylistActive) {
                send('playlistNextRandom');
            } else {
                send('nextSlide');
            }
        };
        document.getElementById('remote-scroll-up').onclick = () => send('scrollUp');
        document.getElementById('remote-scroll-down').onclick = () => send('scrollDown');
        document.getElementById('remote-home').onclick = () => send('scrollToTop');
        document.getElementById('remote-prev-hino').onclick = () => {
            if (isPlaylistActive) {
                send('playlistNextRandom');
            } else {
                send('stopAudio');
                updatePlayState(false);
                send('prevHino');
            }
        };
        document.getElementById('remote-next-hino').onclick = () => {
            console.log('DEBUG remote: Próx clicked, isPlaylistActive =', isPlaylistActive);
            if (isPlaylistActive) {
                console.log('DEBUG remote: Sending playlistNextRandom');
                send('playlistNextRandom');
            } else {
                send('stopAudio');
                updatePlayState(false);
                send('nextHino');
            }
        };
        document.getElementById('remote-random-hino').onclick = () => {
            send('stopAudio');
            updatePlayState(false);
            send('randomHino');
        };
        document.getElementById('remote-play').onclick = () => {
            send('togglePlay');
            updatePlayState(!isPlaying);
        };
        document.getElementById('remote-stop').onclick = () => {
            send('stopAudio');
            updatePlayState(false);
        };
        document.getElementById('remote-speed-down').onclick = () => send('speedDown');
        document.getElementById('remote-speed-up').onclick = () => send('speedUp');
        document.getElementById('remote-equalizer').onclick = () => {
            document.getElementById('remote-modal-audio-filters').classList.remove('hidden');
        };
        document.getElementById('remote-reset-filters').onclick = () => {
            document.getElementById('remote-range-gain').value = 1.2;
            document.getElementById('remote-label-gain').textContent = '1.2x';
            document.getElementById('remote-range-bass').value = 0;
            document.getElementById('remote-label-bass-val').textContent = '+0dB';
            document.getElementById('remote-range-mid').value = 0;
            document.getElementById('remote-label-mid-val').textContent = '+0dB';
            document.getElementById('remote-range-treble').value = 0;
            document.getElementById('remote-label-treble-val').textContent = '+0dB';
            send('updateAudioFilters', { gain: 1.2, bass: 0, mid: 0, treble: 0 });
        };
        document.getElementById('remote-restart').onclick = () => send('restartAudio');
        document.getElementById('remote-fullscreen').onclick = () => send('toggleFullscreen');
        document.getElementById('remote-toggle-bg').onclick = () => {
            send('toggleBg');
            updateBackgroundState(!isBgActive);
        };
        document.getElementById('remote-toggle-complete').onclick = () => {
            send('toggleComplete');
            updateCompleteState(!isCompleteActive);
        };
        document.getElementById('remote-random-bg').onclick = () => send('shuffleBackground');
        document.getElementById('remote-random-playlist').onclick = () => {
            // Se está ativo, estamos parando a playlist
            if (isPlaylistActive) {
                console.log('DEBUG remote: Parando playlist, enviando stopAutoScroll');
                // Para rolagem automática, sai de fullscreen e limpa o slide
                send('stopAutoScroll');
                send('exitFullscreen');
                send('clearSlide');
            }
            
            // Feedback visual imediato - inverte o estado local
            const newState = !isPlaylistActive;
            updatePlaylistState(newState);
            
            // Envia a ação para a main
            send('toggleRandomPlaylist');
            
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(50);
        };
        document.getElementById('remote-select-hino').onclick = submitHino;
        hinoInput.addEventListener('dblclick', () => {
            hinoInput.value = '';
            hinoFeedback.textContent = 'Campo limpo. Informe outro número.';
            hinoFeedback.classList.remove('text-red-400', 'text-green-400');
            searchResultsBox.classList.add('hidden');
            remoteSelectedResult = -1;
        });
        hinoClearBtn.addEventListener('click', () => {
            hinoInput.value = '';
            hinoFeedback.textContent = 'Seleção limpa. Informe outro número.';
            hinoFeedback.classList.remove('text-red-400');
            hinoFeedback.classList.remove('text-green-400');
            searchResultsBox.classList.add('hidden');
            remoteSelectedResult = -1;
        });

        document.getElementById('remote-obs-toggle').onclick = () => {
            if (!isObsConnected) {
                console.log('OBS not connected, ignoring toggle');
                return;
            }
            send('toggleObs');
            updateObsState(!isObsActive);
        };

        document.getElementById('remote-obs-config').onclick = () => {
            // Carregar valores atuais do localStorage para sincronizar
            document.getElementById('remote-obs-address').value = localStorage.getItem('obs_address') || 'localhost:4455';
            document.getElementById('remote-obs-password').value = localStorage.getItem('obs_password') || '';
            document.getElementById('remote-obs-source-name').value = localStorage.getItem('obs_source_name') || 'Hinario';
            document.getElementById('remote-modal-obs-settings').classList.remove('hidden');
        };
        
        // Inicializar os campos com os valores atuais ao carregar a página
        document.getElementById('remote-obs-address').value = localStorage.getItem('obs_address') || 'localhost:4455';
        document.getElementById('remote-obs-password').value = localStorage.getItem('obs_password') || '';
        document.getElementById('remote-obs-source-name').value = localStorage.getItem('obs_source_name') || 'Hinario';
        
        // Salvar configurações OBS automaticamente quando os campos são alterados
        document.getElementById('remote-obs-address').addEventListener('input', (e) => {
            const value = e.target.value;
            localStorage.setItem('obs_address', value);
            send('saveObsSettings', { address: value });
        });
        document.getElementById('remote-obs-password').addEventListener('input', (e) => {
            const value = e.target.value;
            localStorage.setItem('obs_password', value);
            send('saveObsSettings', { password: value });
        });
        document.getElementById('remote-obs-source-name').addEventListener('input', (e) => {
            const value = e.target.value;
            localStorage.setItem('obs_source_name', value);
            send('saveObsSettings', { sourceName: value });
        });

        // Handlers para botões de conexão/desconexão/criação de fonte do OBS
        document.getElementById('remote-btn-obs-connect').onclick = () => {
            send('connectObs');
        };
        document.getElementById('remote-btn-obs-disconnect').onclick = () => {
            send('disconnectObs');
        };
        document.getElementById('remote-btn-obs-create-source').onclick = () => {
            send('createObsSource');
        };

        // Solicitar estado inicial de fullscreen ao carregar
        send('requestFullscreenState');
        
        // Solicitar estado inicial do OBS
        send('requestObsState');
        
        // Solicitar valores atuais dos filtros de áudio
        send('requestAudioFilters');
        
        // Solicitar estado do background
        send('requestBackgroundState');
        
        // Solicitar estado do completo
        send('requestCompleteState');
        
        // Solicitar estado do play/pause
        send('requestPlayState');

        // Solicitar tema atual
        send('requestThemeState');

        // Atalhos de teclado no controle remoto
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case '+':
                case '=':
                    e.preventDefault();
                    send('speedUp');
                    break;
                case '-':
                case '_':
                    e.preventDefault();
                    send('speedDown');
                    break;
                case ']':
                    e.preventDefault();
                    send('fontInc');
                    break;
                case '[':
                    e.preventDefault();
                    send('fontDec');
                    break;
                case 'a':
                case 'A':
                    e.preventDefault();
                    send('randomHino');
                    break;
                case 's':
                case 'S':
                    e.preventDefault();
                    send('randomHino');
                    send('playAudio');
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    send('togglePlay');
                    break;
            }
        });

        // Throttle function to limit broadcast frequency
        const throttle = (fn, wait) => {
            let lastTime = 0;
            return (...args) => {
                const now = Date.now();
                if (now - lastTime >= wait) {
                    lastTime = now;
                    fn(...args);
                }
            };
        };

        // Real-time filter updates with throttling (50ms)
        const sendGainUpdate = throttle((val) => send('updateAudioFilters', { gain: parseFloat(val) }), 50);
        const sendBassUpdate = throttle((val) => send('updateAudioFilters', { bass: parseInt(val) }), 50);
        const sendMidUpdate = throttle((val) => send('updateAudioFilters', { mid: parseInt(val) }), 50);
        const sendTrebleUpdate = throttle((val) => send('updateAudioFilters', { treble: parseInt(val) }), 50);

        document.getElementById('remote-range-gain').addEventListener('input', (e) => {
            const val = e.target.value;
            console.log('[Remote] Gain input:', val);
            document.getElementById('remote-label-gain').textContent = parseFloat(val).toFixed(1) + 'x';
            sendGainUpdate(val);
        });
        document.getElementById('remote-range-bass').addEventListener('input', (e) => {
            const val = e.target.value;
            console.log('[Remote] Bass input:', val);
            const sign = parseInt(val) > 0 ? '+' : '';
            document.getElementById('remote-label-bass-val').textContent = sign + val + 'dB';
            sendBassUpdate(val);
        });
        document.getElementById('remote-range-mid').addEventListener('input', (e) => {
            const val = e.target.value;
            console.log('[Remote] Mid input:', val);
            const sign = parseInt(val) > 0 ? '+' : '';
            document.getElementById('remote-label-mid-val').textContent = sign + val + 'dB';
            sendMidUpdate(val);
        });
        document.getElementById('remote-range-treble').addEventListener('input', (e) => {
            const val = e.target.value;
            console.log('[Remote] Treble input:', val);
            const sign = parseInt(val) > 0 ? '+' : '';
            document.getElementById('remote-label-treble-val').textContent = sign + val + 'dB';
            sendTrebleUpdate(val);
        });
        
        loadHinosIndex();