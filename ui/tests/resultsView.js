/**
 * INTDWN - Results View
 */

import { i18n } from '../../core/i18n.js';
import { storage } from '../../core/storage.js';
import { router } from '../../core/router.js';
import { VIEWS } from '../../core/constants.js';
import { formatDate } from '../../core/utils.js';
import { reportGenerator } from '../../analytics/reportGenerator.js';
import { aiInterpreter } from '../../analytics/aiInterpreter.js';
import { ruleEngine } from '../../analytics/ruleEngine.js';
import { createRadarChart } from '../components/radarChart.js';
import { createProgressBar, animateProgressBars } from '../components/progressBar.js';
import { getScaleLabel, getAllScaleLabels, loadTests, availableTests } from '../tests/testsList.js';

let resultChart = null;

export async function render(params) {
    const language = i18n.getLanguage();

    if (availableTests.length === 0) {
        await loadTests();
    }
    
    // Get result from storage
    const results = await storage.getTestResults();
    const result = params.resultId 
        ? results.find(r => r.id === params.resultId)
        : results[0];

    if (!result) {
        return `
            <div class="error-view">
                <h2>No results found</h2>
                <button class="btn btn-primary" onclick="window.history.back()">
                    ${i18n.t('common.close')}
                </button>
            </div>
        `;
    }

    // Generate report
    const report = await reportGenerator.generateTestReport(result);

    report.summary = report.summary.replace(
        /\b(openness|conscientiousness|extraversion|agreeableness|neuroticism|anxiety|worry|tension|physiological_symptoms|self_awareness|self_regulation|motivation|empathy|social_skills|internal_locus|external_locus|procrastination_tendency|decision_procrastination|task_avoidance|stress_tolerance|coping_strategies|resilience|recovery)\b/g,
        (match) => getScaleLabel(match, language, false)
    );

    // Get scale labels
    const testModule = await import('./testsList.js');
    const testData = testModule.getTestById(result.testId);
    const scaleLabels = testData?.scaleLabels || {};

    return `
        <div class="results-view">
            <div class="results-header">
                <button class="btn btn-secondary btn-sm" id="back-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <h1 class="results-title">${i18n.t('results.title')}</h1>
                <div class="results-date">${formatDate(result.date, language)}</div>
            </div>

            <div class="results-summary card">
                <p class="summary-text">${report.summary}</p>
            </div>

            <div class="chart-section card">
                <h3 class="section-title">${i18n.t('results.traitAnalysis')}</h3>
                <div class="chart-container">
                    <canvas id="results-radar-chart"></canvas>
                </div>
            </div>

            <div class="traits-breakdown">
                ${renderTraitBreakdown(result.scores, scaleLabels, language)}
            </div>

            <div class="interpretation-section card">
                <h3 class="section-title">${i18n.t('results.interpretation')}</h3>
                ${renderInterpretations(report.interpretations, language)}
            </div>

            ${report.insights.length > 0 ? `
                <div class="insights-section card">
                    <h3 class="section-title">Insights</h3>
                    ${report.insights.map(insight => `
                        <div class="insight-item">
                            <span class="insight-badge ${insight.type}">${insight.type}</span>
                            <p class="insight-title">${insight.title}</p>
                            <p class="insight-message">${insight.message}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="recommendations-section card">
                <h3 class="section-title">${i18n.t('results.recommendations')}</h3>
                <ul class="recommendations-list">
                    ${report.recommendations.map(rec => `
                        <li class="recommendation-item">
                            <strong>${getScaleLabel(rec.trait, language, false)}:</strong> ${rec.advice}
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div class="results-actions">
                <button class="btn btn-secondary" id="retake-btn">
                    ${i18n.t('results.retakeTest')}
                </button>
                <button class="btn btn-primary" id="export-btn">
                    ${i18n.t('results.downloadReport')}
                </button>
            </div>
        </div>
    `;
}

function renderTraitBreakdown(scores, language) {
    // Принудительно перестраиваем карту лейблов каждый раз
    const allLabels = getAllScaleLabels();

    return Object.entries(scores).map(([scale, score]) => {
        const labelObj = allLabels[scale];
        const currentLang = i18n.getLanguage();
        const label = labelObj 
            ? (labelObj[currentLang] || labelObj.ru || labelObj.en || scale)
            : scale;

        const level = getLevel(score);
        
        console.log(`Scale: ${scale} → Label: ${label} (lang: ${currentLang})`);

        return `
            <div class="result-card">
                <div class="trait-header">
                    <span class="trait-name">${label}</span>
                    <span class="trait-score">${score}%</span>
                </div>
                ${createProgressBar(score, { showLabel: false })}
                <span class="trait-level ${level}">${i18n.t(`results.${level}`)}</span>
            </div>
        `;
    }).join('');
}

function renderInterpretations(interpretations, language) {
    return interpretations.map(interp => {
        const traitName = getScaleLabel(interp.trait, language, false);  // ← вот он!
        
        return `
            <div class="interpretation-item">
                <h4 class="interpretation-title">${traitName}</h4>
                <p class="interpretation-desc">${interp.description}</p>
                ${interp.strengths?.length > 0 ? `
                    <div class="strengths">
                        <strong>${i18n.t('results.strengths')}</strong>
                        <ul>${interp.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function getLevel(score) {
    if (score < 30) return 'low';
    if (score < 70) return 'medium';
    return 'high';
}

export async function afterRender(params) {
    const results = await storage.getTestResults();
    const result = params.resultId 
        ? results.find(r => r.id === params.resultId)
        : results[0];

    if (!result) return;

    const language = i18n.getLanguage();

    // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
    // 1. Загружаем тесты и лейблы (как в профиле)
    if (availableTests.length === 0) {
        await loadTests();
    }
    const scaleLabels = getAllScaleLabels();

    // Animate progress bars
    animateProgressBars();

    // Radar Chart — ТОЛЬКО КОРОТКИЕ НАЗВАНИЯ
    const labels = Object.keys(result.scores).map(scale => 
        getScaleLabel(scale, language, true)   // ← true = short_ru / short_en
    );
    const data = Object.values(result.scores);

    resultChart = createRadarChart('results-radar-chart', data, labels);

    // Остальное (кнопки, экспорт и т.д.) оставляем как было
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => router.back());
    }

    const retakeBtn = document.getElementById('retake-btn');
    if (retakeBtn) {
        retakeBtn.addEventListener('click', () => {
            router.navigate(VIEWS.TEST_RUNNER, { testId: result.testId });
        });
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            const report = await reportGenerator.generateTestReport(result);
            const json = reportGenerator.exportReport(report);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `intdwn-report-${result.testId}-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}

export default { render, afterRender };
