/**
 * INTDWN - Profile View
 */

import { i18n } from '../../core/i18n.js';
import { storage } from '../../core/storage.js';
import { router } from '../../core/router.js';
import { profileEngine } from '../../analytics/profileEngine.js';
import { progressTracker } from '../../analytics/progressTracker.js';
import { reportGenerator } from '../../analytics/reportGenerator.js';
import { downloadJSON, readFileAsJSON } from '../../core/utils.js';
import { createRadarChart } from '../components/radarChart.js';
import { createTraitTimelineChart, prepareTimelineData } from '../components/traitTimelineChart.js';
import { VIEWS } from '../../core/constants.js';
import { getScaleLabel, getAllScaleLabels, loadTests, availableTests } from '../tests/testsList.js';

let profileChart = null;
let timelineChart = null;

export async function render() {
    const language = i18n.getLanguage();
    const user = await storage.getUser();
    const profile = await profileEngine.buildProfile();
    const progress = await progressTracker.getProgress();

    if (!profile) {
        return renderEmptyProfile(language);
    }

    const completeness = profileEngine.getProfileCompleteness();

    return `
        <div class="profile-view">
            <div class="profile-header">
                <div class="profile-avatar" id="profile-avatar">
                    ${user?.avatar 
                        ? `<img src="${user.avatar}" alt="Avatar">`
                        : `<span class="profile-avatar-placeholder">👤</span>`
                    }
                </div>
                <h2 class="profile-name">${user?.name || 'User'}</h2>
                <div class="profile-completeness">
                    <span>Profile ${completeness}% complete</span>
                    <div class="progress-bar" style="height: 4px;">
                        <div class="progress-bar-fill" style="width: ${completeness}%"></div>
                    </div>
                </div>
            </div>

            <div class="profile-stats">
                <div class="stat-item">
                    <div class="stat-value">${progress.totalTests}</div>
                    <div class="stat-label">${i18n.t('profile.testsTaken')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${Object.keys(profile.aggregatedScores).length}</div>
                    <div class="stat-label">${i18n.t('profile.traitsAnalyzed')}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${progress.streak}</div>
                    <div class="stat-label">${i18n.t('profile.streak')}</div>
                </div>
            </div>

            <div class="profile-section card">
                <h3 class="section-title">${i18n.t('profile.achievements')}</h3>
                <div class="achievements-grid">
                    ${progress.achievements.map(a => `
                        <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
                            <span class="achievement-icon">${a.icon}</span>
                            <span class="achievement-name">${a.title}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="profile-section card">
                <h3 class="section-title">${i18n.t('profile.dominantTraits')}</h3>
                <div class="chart-container">
                    <canvas id="profile-radar-chart"></canvas>
                </div>
            </div>

            ${profile.testHistory.length >= 2 ? `
                <div class="profile-section card">
                    <h3 class="section-title">${i18n.t('profile.timeline')}</h3>
                    <div class="timeline-chart" style="height: 250px;">
                        <canvas id="profile-timeline-chart"></canvas>
                    </div>
                </div>
            ` : ''}

            <div class="profile-section card">
                <h3 class="section-title">${i18n.t('profile.traitSummary')}</h3>
                <div class="trait-summary">
                    ${renderTraitSummary(profile.dominantTraits.slice(0, 5), language)}
                </div>
            </div>

            <div class="profile-section card">
                <h3 class="section-title">${i18n.t('settings.dataManagement')}</h3>
                <div class="data-actions">
                    <button class="btn btn-secondary btn-block" id="export-data">
                        ${i18n.t('profile.exportData')}
                    </button>
                    <button class="btn btn-secondary btn-block" id="import-data">
                        ${i18n.t('profile.importData')}
                    </button>
                    <input type="file" id="import-file" accept=".json" class="visually-hidden">
                    <button class="btn btn-outline btn-block" id="clear-data" style="color: var(--error); border-color: var(--error);">
                        ${i18n.t('profile.clearData')}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderEmptyProfile(language) {
    return `
        <div class="profile-view empty">
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h2>${i18n.t('profile.noData')}</h2>
                <p>${i18n.t('profile.startTesting')}</p>
                <button class="btn btn-primary btn-lg" id="start-testing-btn">
                    Start Testing
                </button>
            </div>
        </div>
    `;
}

function renderTraitSummary(traits, language) {
    return traits.map(trait => `
        <div class="trait-summary-item">
            <div class="trait-info">
                <span class="trait-name">${trait.scale}</span>
                <span class="trait-level ${trait.level}">${trait.level}</span>
            </div>
            <div class="trait-score">${trait.score}%</div>
        </div>
    `).join('');
}

export async function afterRender() {
    const profile = await profileEngine.getProfile();

    if (!profile) {
        const startBtn = document.getElementById('start-testing-btn');
        if (startBtn) startBtn.addEventListener('click', () => router.navigate(VIEWS.TESTS));
        return;
    }

    const language = i18n.getLanguage();

    // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
    // 1. Принудительно загружаем все тесты, если ещё не загружены
    if (availableTests.length === 0) {
        await loadTests();
    }

    // 2. Получаем все scaleLabels
    const scaleLabels = getAllScaleLabels();

    // Radar Chart — короткие названия
    const dominant = profile.dominantTraits.slice(0, 5);
    const radarLabels = dominant.map(t => 
        getScaleLabel(t.scale, language, true)   // true = short_ru / short_en
    );
    const radarData = dominant.map(t => t.score);

    profileChart = createRadarChart('profile-radar-chart', radarData, radarLabels);

    // Timeline Chart (только один раз!)
    if (profile.testHistory.length >= 2) {
        const timelineData = prepareTimelineData(
            profile.testHistory, 
            scaleLabels,           // ← правильные лейблы
            language
        );
        if (timelineData) {
            timelineChart = await createTraitTimelineChart('profile-timeline-chart', timelineData);
        }
        // === НОВАЯ СКРОЛЛ-ЛЕГЕНДА ДЛЯ ИСТОРИИ ===
        if (timelineChart) {
            const legendContainer = document.createElement('div');
            legendContainer.className = 'timeline-legend';
            legendContainer.style.cssText = `
                display: flex; 
                flex-wrap: nowrap; 
                gap: 12px; 
                overflow-x: auto; 
                padding: 20px 0;
                scrollbar-width: thin;
            `;

            timelineChart.data.datasets.forEach((dataset, i) => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0;';
                item.innerHTML = `
                    <span style="
                        display: inline-block; 
                        width: 10px; 
                        height: 10px; 
                        background: ${dataset.borderColor}; 
                        border-radius: 50%;
                    "></span>
                    <span style="font-size: 12px; color: rgba(255,255,255,0.7);">${dataset.label}</span>
                `;
                legendContainer.appendChild(item);
            });

            // Вставляем под canvas
            const chartWrapper = document.querySelector('.timeline-chart');
            if (chartWrapper) {
                chartWrapper.appendChild(legendContainer);
            }
        }
    }

    // Экспорт/импорт/очистка (оставляем без изменений)
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            const data = await storage.exportData();
            downloadJSON(data, `intdwn-backup-${new Date().toISOString().split('T')[0]}.json`);
        });
    }

    const importBtn = document.getElementById('import-data');
    const importFile = document.getElementById('import-file');
    if (importBtn && importFile) {
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const data = await readFileAsJSON(file);
                await storage.importData(data);
                window.location.reload();
            } catch {
                alert(i18n.t('errors.importFailed'));
            }
        });
    }

    const clearBtn = document.getElementById('clear-data');
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (confirm('Are you sure? This will delete all your data.')) {
                await storage.clearAllData();
                window.location.reload();
            }
        });
    }
}
export default { render, afterRender };
