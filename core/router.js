/**
 * INTDWN - Router Module
 */

import { VIEWS, EVENTS } from './constants.js';
import { storage } from './storage.js';

class Router {
    constructor() {
        this.currentView = null;
        this.previousView = null;
        this.params = {};
        this.routes = new Map();
        this.viewContainer = null;
    }

    init() {
        this.viewContainer = document.getElementById('view-container');
        
        // Handle navigation clicks
        document.querySelectorAll('[data-view]').forEach(el => {
            el.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.navigate(view);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.render(e.state.view, e.state.params, false);
            }
        });

        // Check for onboarding
        this.checkInitialRoute();
    }

    async checkInitialRoute() {
        const hasCompletedOnboarding = await storage.getSetting('onboardingComplete', false);
        
        if (!hasCompletedOnboarding) {
            this.navigate(VIEWS.ONBOARDING);
        } else {
            this.navigate(VIEWS.HOME);
        }
    }

    register(viewName, viewModule) {
        this.routes.set(viewName, viewModule);
    }

    navigate(view, params = {}) {
        this.previousView = this.currentView;
        this.currentView = view;
        this.params = params;

        // Update browser history
        const state = { view, params };
        const url = params.testId ? `#${view}/${params.testId}` : `#${view}`;
        history.pushState(state, '', url);

        this.render(view, params);
    }

    async render(view, params = {}, updateHistory = true) {
        const viewModule = this.routes.get(view);
        
        if (!viewModule) {
            console.error(`View not found: ${view}`);
            return;
        }

        // Update navigation active state
        this.updateNavState(view);

        // Clear container
        this.viewContainer.innerHTML = '';

        // Render new view
        try {
            const content = await viewModule.render(params);
            this.viewContainer.innerHTML = content;
            
            if (viewModule.afterRender && typeof viewModule.afterRender === 'function') {
                await viewModule.afterRender(params);
            }

            // Dispatch route change event
            window.dispatchEvent(new CustomEvent(EVENTS.ROUTE_CHANGE, {
                detail: { view, params }
            }));
        } catch (error) {
            console.error(`Error rendering view ${view}:`, error);
            this.viewContainer.innerHTML = '<div class="error">Error loading view</div>';
        }
    }

    updateNavState(view) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });
    }

    getParams() {
        return this.params;
    }

    getCurrentView() {
        return this.currentView;
    }

    getPreviousView() {
        return this.previousView;
    }

    back() {
        if (this.previousView) {
            this.navigate(this.previousView);
        } else {
            history.back();
        }
    }
}

export const router = new Router();
export default router;
