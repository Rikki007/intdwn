/**
 * INTDWN - Onboarding View
 */

import { i18n } from '../../core/i18n.js';
import { storage } from '../../core/storage.js';
import { router } from '../../core/router.js';
import { VIEWS } from '../../core/constants.js';

let currentStep = 0;
let selectedLanguage = 'en';

const steps = [
    {
        icon: '🧠',
        titleKey: 'onboarding.step1Title',
        descKey: 'onboarding.step1Desc'
    },
    {
        icon: '💡',
        titleKey: 'onboarding.step2Title',
        descKey: 'onboarding.step2Desc'
    },
    {
        icon: '📈',
        titleKey: 'onboarding.step3Title',
        descKey: 'onboarding.step3Desc'
    }
];

export async function render() {
    const language = i18n.getLanguage();

    return `
        <div class="onboarding-screen">
            <div class="onboarding-content">
                <img src="assets/icons/logo.svg" alt="INTDWN" class="onboarding-logo">
                <h1 class="onboarding-title">${i18n.t('onboarding.welcome')}</h1>
                <p class="onboarding-subtitle">${i18n.t('onboarding.subtitle')}</p>

                <div class="language-selector">
                    <button class="language-btn ${language === 'en' ? 'active' : ''}" data-lang="en">
                        English
                    </button>
                    <button class="language-btn ${language === 'ru' ? 'active' : ''}" data-lang="ru">
                        Русский
                    </button>
                </div>

                <div class="onboarding-steps" id="onboarding-steps">
                    ${renderStep(0, language)}
                </div>

                <div class="onboarding-dots">
                    ${steps.map((_, i) => `
                        <div class="onboarding-dot ${i === 0 ? 'active' : ''}" data-step="${i}"></div>
                    `).join('')}
                </div>

                <div class="onboarding-disclaimer">
                    ⚠️ ${i18n.t('onboarding.disclaimer')}
                </div>

                <div class="onboarding-actions">
                    <button class="btn btn-secondary" id="skip-btn">
                        ${i18n.t('onboarding.skip')}
                    </button>
                    <button class="btn btn-primary" id="next-btn">
                        ${i18n.t('onboarding.next')}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderStep(stepIndex, language) {
    const step = steps[stepIndex];
    
    return `
        <div class="onboarding-step active">
            <div class="step-icon">${step.icon}</div>
            <h3 class="step-title">${i18n.t(step.titleKey)}</h3>
            <p class="step-desc">${i18n.t(step.descKey)}</p>
        </div>
    `;
}

export async function afterRender() {
    // Language selection
    const langButtons = document.querySelectorAll('.language-btn');
    langButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const lang = btn.dataset.lang;
            selectedLanguage = lang;
            
            // Update UI
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Change language
            await i18n.setLanguage(lang);
            
            // Re-render
            const container = document.querySelector('.onboarding-screen');
            container.innerHTML = await render();
            await afterRender();
        });
    });

    // Next button
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                updateStep();
            } else {
                await completeOnboarding();
            }
        });
    }

    // Skip button
    const skipBtn = document.getElementById('skip-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', async () => {
            await completeOnboarding();
        });
    }

    // Dot navigation
    const dots = document.querySelectorAll('.onboarding-dot');
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            currentStep = parseInt(dot.dataset.step);
            updateStep();
        });
    });
}

function updateStep() {
    const language = i18n.getLanguage();
    const stepsContainer = document.getElementById('onboarding-steps');
    const dots = document.querySelectorAll('.onboarding-dot');
    const nextBtn = document.getElementById('next-btn');

    // Update step content
    stepsContainer.innerHTML = renderStep(currentStep, language);

    // Update dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentStep);
    });

    // Update next button text
    if (currentStep === steps.length - 1) {
        nextBtn.textContent = i18n.t('onboarding.getStarted');
    }
}

async function completeOnboarding() {
    // Save onboarding completion
    await storage.setSetting('onboardingComplete', true);
    await storage.setSetting('language', selectedLanguage);
    
    // Create initial user
    await storage.saveUser({
        name: '',
        createdAt: new Date().toISOString()
    });

    // Navigate to home
    router.navigate(VIEWS.HOME);
}

export default { render, afterRender };
