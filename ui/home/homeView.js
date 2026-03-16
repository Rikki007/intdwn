/**
 * INTDWN - Home View
 */

import { i18n } from '../../core/i18n.js';
import { storage } from '../../core/storage.js';
import { loadJSON, getRandomItem } from '../../core/utils.js';
import { progressTracker } from '../../analytics/progressTracker.js';
import { router } from '../../core/router.js';
import { initNeuralBackground } from './backgroundCanvas.js';
import { VIEWS } from '../../core/constants.js';

let facts = [];
let currentFact = null;

async function loadFacts() {
    const data = await loadJSON('./data/facts.json');
    facts = data?.facts || [];
    currentFact = getRandomItem(facts);
}

function showNextFact() {
    if (facts.length === 0) return;
    
    currentFact = getRandomItem(facts);
    
    const factTextEl = document.querySelector('.fact-text');
    if (factTextEl) {
        const language = i18n.getLanguage();
        factTextEl.textContent = 
            currentFact?.text?.[language] || 
            currentFact?.text?.en || 
            'No fact available';
    }
}

export async function render() {
    const language = i18n.getLanguage();
    const user = await storage.getUser();
    const progress = await progressTracker.getProgress();

    return `
        <div class="home-view">
            <canvas id="neural-canvas"></canvas>
            
            <div class="home-header">
                <img src="assets/icons/logo.png" alt="INTDWN" class="home-logo">
                <h1 class="home-greeting">
                    ${user?.name 
                        ? `${i18n.t('home.greeting')}, ${user.name}` 
                        : i18n.t('home.greeting')}
                </h1>
                <p class="home-subtitle">${i18n.t('home.subtitle')}</p>
            </div>

            <div class="fact-card">
                <div class="fact-label">${i18n.t('home.factTitle')}</div>
                <p class="fact-text">${currentFact?.text?.[language] || currentFact?.text?.en || ''}</p>

                <button id="next-fact-btn" class="btn btn-secondary btn-sm" style="margin-top: 12px;">
                    ${i18n.t('home.factBtn')}
                </button>
            </div>

            <div class="progress-section">
                <div class="progress-header">
                    <span class="progress-title">${i18n.t('home.progressTitle')}</span>
                    <span class="progress-value">${progress.totalTests} ${i18n.t('home.testsCompleted')}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${progress.nextMilestone.progress}%"></div>
                </div>
                <div class="progress-milestone">
                    ${progress.nextMilestone.remaining > 0 
                        ? `${progress.nextMilestone.remaining} ${i18n.t('tests.questions')} ${i18n.t('home.toNextMilestone')}`
                        : 'Milestone reached!'}
                </div>
            </div>

            <div class="quick-actions">
                <div class="quick-action-btn" data-action="start-test">
                    <div class="quick-action-icon">🎯</div>
                    <div class="quick-action-label">${i18n.t('home.quickStart')}</div>
                </div>
                <div class="quick-action-btn" data-action="view-results">
                    <div class="quick-action-icon">📊</div>
                    <div class="quick-action-label">${i18n.t('home.viewResults')}</div>
                </div>
                <div class="quick-action-btn" data-action="start-telegram">
                    <img src="assets/icons/tel.png" alt="INTDWN" class="quick-action-icon">
                    <div class="quick-action-label">${i18n.t('home.telegram')}</div>
                </div>
                <div class="quick-action-btn" data-action="start-instagram">
                    <img src="assets/icons/inst.png" alt="INTDWN" class="quick-action-icon">
                    <div class="quick-action-label">${i18n.t('home.instagram')}</div>
                </div>
            </div>

            <div class="achievements-preview">
                <h3 class="section-title">${i18n.t('profile.achievements')}</h3>
                <div class="achievements-grid">
                    ${progress.achievements.slice(0, 4).map(a => `
                        <div class="achievement-badge ${a.unlocked ? 'unlocked' : 'locked'}">
                            <span class="achievement-icon">${a.icon}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

export async function afterRender() {
    // Initialize neural network background
    initNeuralBackground('neural-canvas');

    const nextFactBtn = document.getElementById('next-fact-btn');
    if (nextFactBtn) {
        nextFactBtn.addEventListener('click', showNextFact);
    }

    // Bind action buttons
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action === 'start-test') {
                router.navigate(VIEWS.TESTS);
            } else if (action === 'view-results') {
                router.navigate(VIEWS.PROFILE);
            } else if (action === 'start-telegram') {
                window.open('https://t.me/intdwn', '_blank', 'noopener');

            } else if (action === 'start-instagram') {
                window.open('https://instagram.com/in_t_dwn', '_blank', 'noopener');
            }
        });
    });
}

// Load facts on module init
loadFacts();

export default { render, afterRender };
