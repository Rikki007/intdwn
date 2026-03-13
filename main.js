/**
 * INTDWN - Main Application Entry Point
 * 
 * A privacy-focused offline psychological analytics platform
 * Built with Vanilla JavaScript, IndexedDB, and Chart.js
 */

import { storage } from './core/storage.js';
import { router } from './core/router.js';
import { i18n } from './core/i18n.js';
import { EVENTS, VIEWS } from './core/constants.js';

// Import views
import { render as homeView } from './ui/home/homeView.js';
import { render as testsList } from './ui/tests/testsList.js';
import { render as testRunner } from './ui/tests/testRunner.js';
import { render as resultsView } from './ui/tests/resultsView.js';
import { render as profileView } from './ui/profile/profileView.js';
import { render as onboardingView } from './ui/onboarding/onboardingView.js';
import { render as aboutView } from './ui/about/aboutView.js';

// Import analytics engines
import { ruleEngine } from './analytics/ruleEngine.js';
import { aiInterpreter } from './analytics/aiInterpreter.js';

class App {
    constructor() {
        this.initialized = false;
    }

    async init() {
        try {
            // Show splash screen
            await this.showSplash();

            // Initialize storage
            await storage.init();

            // Initialize i18n
            await i18n.init();

            // Initialize analytics engines
            await ruleEngine.init();
            await aiInterpreter.init();

            // Register routes
            this.registerRoutes();

            // Initialize router
            router.init();

            // Setup event listeners
            this.setupEventListeners();

            // Hide splash and show app
            await this.hideSplash();

            this.initialized = true;

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError(error);
        }
    }

    async showSplash() {
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }

    async hideSplash() {
        const splash = document.getElementById('splash-screen');
        const mainContainer = document.getElementById('main-container');

        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500);
        }

        if (mainContainer) {
            mainContainer.classList.remove('hidden');
        }
    }

    registerRoutes() {
        router.register(VIEWS.HOME, {
            render: homeView,
            afterRender: async () => {
                const module = await import('./ui/home/homeView.js');
                if (module.afterRender) await module.afterRender();
            }
        });

        router.register(VIEWS.TESTS, {
            render: testsList,
            afterRender: async () => {
                const module = await import('./ui/tests/testsList.js');
                if (module.afterRender) await module.afterRender();
            }
        });

        router.register(VIEWS.TEST_RUNNER, {
            render: testRunner,
            afterRender: async (params) => {
                const module = await import('./ui/tests/testRunner.js');
                if (module.afterRender) await module.afterRender(params);
            }
        });

        router.register(VIEWS.RESULTS, {
            render: resultsView,
            afterRender: async (params) => {
                const module = await import('./ui/tests/resultsView.js');
                if (module.afterRender) await module.afterRender(params);
            }
        });

        router.register(VIEWS.PROFILE, {
            render: profileView,
            afterRender: async () => {
                const module = await import('./ui/profile/profileView.js');
                if (module.afterRender) await module.afterRender();
            }
        });

        router.register(VIEWS.ONBOARDING, {
            render: onboardingView,
            afterRender: async () => {
                const module = await import('./ui/onboarding/onboardingView.js');
                if (module.afterRender) await module.afterRender();
            }
        });

        router.register(VIEWS.ABOUT, {
            render: aboutView,
            afterRender: async () => {
                const module = await import('./ui/about/aboutView.js');
                if (module.afterRender) await module.afterRender();
            }
        });
    }

    setupEventListeners() {
        // Language change
        window.addEventListener('language:change', async () => {
            // Re-render current view
            const currentView = router.getCurrentView();
            if (currentView) {
                router.render(currentView, router.getParams());
            }
        });

        // Update translations in DOM
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = i18n.t(key);
        });

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // Handle PWA install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Show install button if needed
        });
    }

    showSettings() {
        const modal = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        
        if (!modal || !content) return;

        const language = i18n.getLanguage();

        content.innerHTML = `
            <div class="modal-header">
                <h2 class="modal-title">${i18n.t('settings.title')}</h2>
                <button class="modal-close" id="close-modal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">${i18n.t('settings.language')}</label>
                    <select class="form-input" id="language-select">
                        <option value="en" ${language === 'en' ? 'selected' : ''}>English</option>
                        <option value="ru" ${language === 'ru' ? 'selected' : ''}>Русский</option>
                    </select>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');

        // Close button
        document.getElementById('close-modal').addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // Language select
        document.getElementById('language-select').addEventListener('change', async (e) => {
            await i18n.setLanguage(e.target.value);
            modal.classList.add('hidden');
            window.location.reload();
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    showError(error) {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.innerHTML = `
                <div class="splash-content">
                    <h1 class="splash-title" style="color: var(--error);">Error</h1>
                    <p>Failed to initialize application</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Service Worker Registration
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker registered:', registration);
        } catch (error) {
            console.log('ServiceWorker registration failed:', error);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    window.app = app;
    await app.init();
    
    // Register service worker for PWA
    await registerServiceWorker();
});

// Export for use in other modules
export default App;
