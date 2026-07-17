import OBSWebSocket from 'obs-websocket-js';

class ObsService {
    constructor() {
        this.obs = new OBSWebSocket();
        this.connected = false;
        this.config = this.loadConfig();

        // Escutar eventos de conexão e desconexão
        this.obs.on('Identified', () => {
            console.log('OBS Identificado e pronto!');
            this.connected = true;
        });

        this.obs.on('ConnectionClosed', () => {
            console.log('Conexão com OBS fechada');
            this.connected = false;
        });
    }

    loadConfig() {
        const defaultConfig = {
            address: 'localhost:4455',
            password: '',
            sourceName: 'Hinario'
        };

        const raw = localStorage.getItem('obs_config');
        if (raw) {
            try {
                return { ...defaultConfig, ...JSON.parse(raw) };
            } catch (e) {
                console.error('Erro ao carregar configuração do OBS:', e);
            }
        }

        // Migrar de chaves legadas (compatibility com versões anteriores)
        const legacy = {
            address: localStorage.getItem('obs_address') || defaultConfig.address,
            password: localStorage.getItem('obs_password') || defaultConfig.password,
            sourceName: localStorage.getItem('obs_source_name') || defaultConfig.sourceName
        };

        return { ...defaultConfig, ...legacy };
    }

    async connect() {
        try {
            console.log(`Tentando conectar ao OBS em ws://${this.config.address}...`);
            const { obsWebSocketVersion, negotiatedRpcVersion } = await this.obs.connect(`ws://${this.config.address}`, this.config.password);
            console.log(`Conectado ao OBS v${obsWebSocketVersion} (RPC v${negotiatedRpcVersion})`);
            
            this.connected = true;
            this.saveConfig();
            return true;
        } catch (error) {
            console.error('Erro detalhado ao conectar ao OBS:', error);
            this.connected = false;
            let errorMsg = 'Erro de conexão';
            
            if (error.code === 4009) {
                errorMsg = 'Senha incorreta. Verifique a senha do WebSocket no OBS.';
            } else if (error.code === 1002) {
                errorMsg = 'Protocol error. Verifique a versão do OBS.';
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            throw new Error(`Falha na conexão: ${errorMsg}`);
        }
    }

    async disconnect() {
        try {
            await this.obs.disconnect();
            this.connected = false;
        } catch (error) {
            console.error('Erro ao desconectar do OBS:', error);
        }
    }

    saveConfig() {
        if (!this.config.sourceName || this.config.sourceName.trim() === '') {
            this.config.sourceName = 'Hinario';
        }
        localStorage.setItem('obs_config', JSON.stringify(this.config));

        // Manter chaves legadas sincronizadas para compatibilidade com remote-control
        localStorage.setItem('obs_address', this.config.address);
        localStorage.setItem('obs_password', this.config.password);
        localStorage.setItem('obs_source_name', this.config.sourceName);
    }

    async updateText(text) {
        if (!this.connected || !this.config.sourceName) return;

        try {
            // Remove tags HTML para enviar apenas o texto limpo
            const plainText = text.replace(/<[^>]*>?/gm, '').trim();
            
            await this.obs.call('SetInputSettings', {
                inputName: this.config.sourceName,
                inputSettings: {
                    text: plainText
                }
            });
        } catch (error) {
            console.error('Erro ao atualizar texto no OBS (DETALHADO):', error);
            // Fallback para logs se o erro for um objeto complexo
            if (error.code) console.log('Código do erro:', error.code);
            if (error.message) console.log('Mensagem do erro:', error.message);
        }
    }

    async createSource() {
        if (!this.connected) throw new Error('OBS não conectado');
        
        const sourceName = this.config.sourceName || 'Hinário MQAAF';
        
        try {
            // 1. Tentar obter a cena atual
            const { currentProgramSceneName } = await this.obs.call('GetSceneList');
            
            // 2. Criar a fonte de captura de janela
            const windowTitle = `Hinário MQAAF PWA - Google Chrome:ChromeWidgetWin_1:chrome.exe`;
            
            await this.obs.call('CreateInput', {
                sceneName: currentProgramSceneName,
                inputName: sourceName,
                inputKind: 'window_capture',
                inputSettings: {
                    window: windowTitle, // Título exato capturado na imagem do usuário
                    priority: 1, // Prioridade por título
                    capture_cursor: false
                }
            });

            // 3. Tentar forçar a atualização se já existir (em caso de re-link)
            await this.obs.call('SetInputSettings', {
                inputName: sourceName,
                inputSettings: {
                    window: windowTitle
                }
            });

            // 4. Forçar um "Refresh" através da visibilidade (desliga e liga)
            const sceneItemId = await this.getSceneItemId(currentProgramSceneName, sourceName);
            if (sceneItemId !== null) {
                await this.obs.call('SetSceneItemEnabled', {
                    sceneName: currentProgramSceneName,
                    sceneItemId: sceneItemId,
                    sceneItemEnabled: false
                });
                
                setTimeout(async () => {
                    await this.obs.call('SetSceneItemEnabled', {
                        sceneName: currentProgramSceneName,
                        sceneItemId: sceneItemId,
                        sceneItemEnabled: true
                    });
                }, 500);
            }

            console.log(`Fonte ${sourceName} criada e resetada na cena ${currentProgramSceneName}`);
            return true;
        } catch (error) {
            console.error('Erro ao criar fonte no OBS (DETALHADO):', error);
            // Se o erro for que a fonte já existe, apenas avisar
            if (error.code === 601) {
                throw new Error('Uma fonte com este nome já existe no OBS.');
            }
            throw new Error(`Erro no OBS: ${error.message || 'Falha ao criar fonte'}`);
        }
    }

    async getSourceStatus() {
        if (!this.connected || !this.config.sourceName) return null;
        try {
            const { currentProgramSceneName } = await this.obs.call('GetSceneList');
            const sceneItemId = await this.getSceneItemId(currentProgramSceneName, this.config.sourceName);
            
            if (sceneItemId === null) return { exists: false };

            const { sceneItemEnabled } = await this.obs.call('GetSceneItemEnabled', {
                sceneName: currentProgramSceneName,
                sceneItemId: sceneItemId
            });

            return { exists: true, enabled: sceneItemEnabled, sceneItemId, sceneName: currentProgramSceneName };
        } catch (error) {
            const detail = error.message || (error.code ? `Erro ${error.code}` : 'Falha na comunicação');
            console.error('Erro ao buscar status da fonte (DETALHADO):', detail, error);
            return null;
        }
    }

    async getSceneItemId(sceneName, sourceName) {
        try {
            const { sceneItems } = await this.obs.call('GetSceneItemList', { sceneName });
            const item = sceneItems.find(i => i.sourceName === sourceName);
            return item ? item.sceneItemId : null;
        } catch (error) {
            console.error('Erro ao obter ID do item da cena:', error);
            return null;
        }
    }

    async toggleSource(enabled) {
        if (!this.connected) return;
        try {
            const status = await this.getSourceStatus();
            if (!status || !status.exists) return;

            // 1. Alternar visibilidade da fonte de vídeo (Letra)
            await this.obs.call('SetSceneItemEnabled', {
                sceneName: status.sceneName,
                sceneItemId: status.sceneItemId,
                sceneItemEnabled: enabled
            });

            // 2. Alternar mute do "Áudio do desktop"
            try {
                await this.obs.call('SetInputMute', {
                    inputName: 'Áudio do desktop',
                    inputMuted: !enabled // Se habilitado -> muted false, se desabilitado -> muted true
                });
                console.log(`Áudio do desktop ${enabled ? 'ativado' : 'silenciado'}`);
            } catch (audioErr) {
                console.warn('Não foi possível controlar "Áudio do desktop". Verifique se o nome da fonte de áudio está correto no OBS.', audioErr);
            }

            return true;
        } catch (error) {
            console.error('Erro ao alternar visibilidade da fonte:', error);
            return false;
        }
    }
}

export const obsService = new ObsService();
