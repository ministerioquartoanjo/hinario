import { pt } from '../i18n/pt.js';
import { es } from '../i18n/es.js';
import { en } from '../i18n/en.js';

export const LANGUAGES = {
    pt: { name: 'Português', flag: '🇧🇷' },
    es: { name: 'Español', flag: '🇪🇸' },
    en: { name: 'English', flag: '🇺🇸' }
};

export const DEFAULT_LANGUAGE = 'pt';

const translations = { pt, es, en };

let currentInterfaceLang = localStorage.getItem('hinario_interface_language') || DEFAULT_LANGUAGE;
let currentHymnLang = localStorage.getItem('hinario_hymn_language') || DEFAULT_LANGUAGE;

export function t(key, params = {}, lang = currentInterfaceLang) {
    let text = translations[lang]?.[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
    if (params && typeof params === 'object') {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        });
    }
    return text;
}

export function setInterfaceLanguage(lang) {
    if (!translations[lang]) return false;
    currentInterfaceLang = lang;
    localStorage.setItem('hinario_interface_language', lang);
    return true;
}

export function setHymnLanguage(lang) {
    if (!['pt', 'es', 'en'].includes(lang)) return false;
    currentHymnLang = lang;
    localStorage.setItem('hinario_hymn_language', lang);
    return true;
}

export function getInterfaceLanguage() {
    return currentInterfaceLang;
}

export function getHymnLanguage() {
    return currentHymnLang;
}

export function getHymnPathPrefix() {
    if (currentHymnLang === 'pt') return 'data/hinos';
    if (currentHymnLang === 'es') return 'data/hinos/es';
    if (currentHymnLang === 'en') return 'data/hinos/en';
    return 'data/hinos';
}

export function applyTranslations(scope = document) {
    // Textos estáticos
    scope.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const translated = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translated;
        } else if (el.tagName === 'OPTION') {
            el.textContent = translated;
        } else {
            el.textContent = translated;
        }
    });

    // Títulos
    scope.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.dataset.i18nTitle);
    });
}
