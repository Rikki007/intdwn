/**
 * INTDWN - About View
 */

import { i18n } from '../../core/i18n.js';
import { APP_VERSION } from '../../core/constants.js';

export async function render() {
    const language = i18n.getLanguage();

    return `
        <div class="about-view">
            <img src="assets/icons/logo.svg" alt="INTDWN" class="about-logo">
            <h1 class="about-title">INTDWN</h1>
            <p class="about-version">${i18n.t('about.version')} ${APP_VERSION}</p>

            <div class="about-section card">
                <p class="about-description">${i18n.t('about.description')}</p>
            </div>

            <div class="about-section card">
                <h3 class="about-section-title">${i18n.t('about.features')}</h3>
                <ul class="features-list">
                    <li class="feature-item">
                        <span class="feature-icon">📴</span>
                        <span>${i18n.t('about.feature1')}</span>
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">🎯</span>
                        <span>${i18n.t('about.feature2')}</span>
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">🤖</span>
                        <span>${i18n.t('about.feature3')}</span>
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">📊</span>
                        <span>${i18n.t('about.feature4')}</span>
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">🔒</span>
                        <span>${i18n.t('about.feature5')}</span>
                    </li>
                </ul>
            </div>

            <div class="about-section card disclaimer-card">
                <h3 class="about-section-title">${i18n.t('about.disclaimer')}</h3>
                <p class="about-section-text">${i18n.t('about.disclaimerText')}</p>
            </div>

            <div class="about-section card">
                <h3 class="about-section-title">${i18n.t('about.credits')}</h3>
                <p class="about-section-text">${i18n.t('about.developedBy')}</p>
                <p class="tech-stack">
                    Built with Vanilla JavaScript, Chart.js, and IndexedDB
                </p>
            </div>

            <div class="about-footer">
                <p>© 2024 INTDWN. All rights reserved.</p>
            </div>
        </div>
    `;
}

export async function afterRender() {
    // No additional setup needed
}

export default { render, afterRender };
