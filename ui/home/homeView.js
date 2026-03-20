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
import { shuffleArray } from '../../core/utils.js';

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

    // ─── Новая логика выбора 4 ачивок ────────────────────────────────
    const unlocked = progress.achievements.filter(a => a.unlocked);
    const locked   = progress.achievements.filter(a => !a.unlocked);

    let selectedAchievements = [];

    if (unlocked.length >= 4) {
        // 4 и более открытых → берём 4 случайные открытые
        selectedAchievements = shuffleArray([...unlocked]).slice(0, 4);
    } 
    else if (unlocked.length > 0) {
        // меньше 4 открытых → все открытые + добираем рандомными закрытыми
        selectedAchievements = [
            ...unlocked,
            ...shuffleArray([...locked]).slice(0, 4 - unlocked.length)
        ];
    } 
    else {
        // вообще нет открытых → 4 случайные закрытые
        selectedAchievements = shuffleArray([...locked]).slice(0, 4);
    }

    // Если ачивок вообще меньше 4 — просто покажем все, что есть
    if (selectedAchievements.length < 4 && progress.achievements.length > 0) {
        selectedAchievements = shuffleArray([...progress.achievements]).slice(0, 4);
    }

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
                    ${selectedAchievements.map(a => `
                        <div class="achievement-badge ${a.unlocked ? 'unlocked' : 'locked'}"
                            data-achievement-id="${a.id}"
                            role="button" tabindex="0">
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

    const achievementsGrid = document.querySelector('.achievements-grid');
    if (achievementsGrid) {
        achievementsGrid.addEventListener('click', handleAchievementClick);
        achievementsGrid.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAchievementClick(e);
            }
        });
    }
}

// Функция-обработчик (можно вынести в отдельный файл позже)
function handleAchievementClick(e) {
    const badge = e.target.closest('.achievement-badge');
    if (!badge) return;

    const achievementId = badge.dataset.achievementId;
    if (!achievementId) return;
    showAchievementModal(achievementId);
}

// Показ модального окна
async function showAchievementModal(achievementId) {
    const progress = await progressTracker.getProgress();
    const achievement = progress.achievements.find(a => a.id === achievementId);
    
    if (!achievement) return;

    const modalContent = `
        <div class="modal-header">
            <h2 class="modal-title">${i18n.t('home.achievement')}</h2>
            <button class="modal-close" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
            <h2 class="card-title">${achievement.icon} ${achievement.title}</h2>
            <p class="card-subtitle">${achievement.description}</p>
        </div>
    `;

    // Используем уже существующий в проекте механизм модалок
    // (предполагаем, что в index.html есть #modal-overlay и #modal-content)
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContentEl = document.getElementById('modal-content');

    if (modalOverlay && modalContentEl) {
        modalContentEl.innerHTML = modalContent;
        modalOverlay.classList.remove('hidden');

        // Закрытие по крестику
        modalContentEl.querySelector('.modal-close').addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
        });

        // Закрытие по клику вне контента
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.add('hidden');
            }
        });

        // Закрытие по Esc
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modalOverlay.classList.add('hidden');
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    } else {
        console.warn('Modal elements not found in DOM');
        // fallback — можно использовать alert, но лучше починить модалку в index.html
    }
}

// Load facts on module init
loadFacts();

export default { render, afterRender };
