/**
 * INTDWN - Internationalization Module
 */

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './constants.js';
import { storage } from './storage.js';

class I18n {
    constructor() {
        this.currentLanguage = DEFAULT_LANGUAGE;
        this.translations = {};
        this.loadedLanguages = new Set();
    }

    async init() {
        // Load saved language preference
        const savedLang = await storage.getSetting('language', DEFAULT_LANGUAGE);
        this.currentLanguage = SUPPORTED_LANGUAGES.includes(savedLang) ? savedLang : DEFAULT_LANGUAGE;
        
        // Load translations
        await this.loadLanguage(this.currentLanguage);
    }

    async loadLanguage(lang) {
        if (this.loadedLanguages.has(lang)) {
            return;
        }

        try {
            const response = await fetch(`./locales/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language: ${lang}`);
            }
            this.translations[lang] = await response.json();
            this.loadedLanguages.add(lang);
        } catch (error) {
            console.error(`Error loading language ${lang}:`, error);
            // Fallback to default language
            if (lang !== DEFAULT_LANGUAGE && !this.loadedLanguages.has(DEFAULT_LANGUAGE)) {
                await this.loadLanguage(DEFAULT_LANGUAGE);
            }
        }
    }

    async setLanguage(lang) {
        if (!SUPPORTED_LANGUAGES.includes(lang)) {
            console.warn(`Language ${lang} is not supported`);
            return false;
        }

        await this.loadLanguage(lang);
        this.currentLanguage = lang;
        await storage.setSetting('language', lang);
        
        // Dispatch language change event
        window.dispatchEvent(new CustomEvent('language:change', { detail: { language: lang } }));
        
        return true;
    }

    getLanguage() {
        return this.currentLanguage;
    }

    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to default language
                value = this.translations[DEFAULT_LANGUAGE];
                for (const k2 of keys) {
                    if (value && typeof value === 'object' && k2 in value) {
                        value = value[k2];
                    } else {
                        return key; // Return key if translation not found
                    }
                }
                break;
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        // Replace parameters
        return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
            return params[param] !== undefined ? params[param] : match;
        });
    }

    getSupportedLanguages() {
        return SUPPORTED_LANGUAGES;
    }
}

export const i18n = new I18n();
export default i18n;
