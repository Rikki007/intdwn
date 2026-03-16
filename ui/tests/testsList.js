/**
 * INTDWN - Tests List View
 */

import { i18n } from '../../core/i18n.js';
import { storage } from '../../core/storage.js';
import { loadJSON } from '../../core/utils.js';
import { router } from '../../core/router.js';
import { VIEWS } from '../../core/constants.js';

let availableTests = [];

export async function loadTests() {
    const testFiles = [
        'bigFive.json',
        'anxiety.json',
        'emotional_intelligence.json',
        'locus_of_control.json',
        'procrastination.json',
        'stress_resistance.json'
    ];

    const tests = [];
    
    for (const file of testFiles) {
        try {
            const test = await loadJSON(`./tests/${file}`);
            if (test) {
                tests.push(test);
            }
        } catch (error) {
            console.error(`Failed to load test: ${file}`, error);
        }
    }

    availableTests = tests;
    return tests;
}

async function getTestCompletionStatus(testId) {
    const results = await storage.getTestResults(testId);
    return {
        completed: results.length > 0,
        count: results.length,
        lastDate: results[0]?.date || null
    };
}

export async function render() {
    const language = i18n.getLanguage();
    
    if (availableTests.length === 0) {
        await loadTests();
    }

    const testCards = await Promise.all(availableTests.map(async test => {
        const status = await getTestCompletionStatus(test.id);
        const testName = test.name[language] || test.name.en;
        const testDesc = test.description?.[language] || test.description?.en || '';

        return `
            <div class="test-card" data-test-id="${test.id}">
                <div class="test-card-icon">🧠</div>
                <h3 class="test-card-title">${testName}</h3>
                <p class="test-card-desc">${testDesc}</p>
                <div class="test-card-meta">
                    <span>${test.minQuestions} - ${test.maxQuestions} ${i18n.t('tests.questions')}</span>
                    <span>${test.estimatedTime || 10} ${i18n.t('tests.minutes')}</span>
                </div>
                ${status.completed 
                    ? `<span class="badge badge-success">${i18n.t('tests.completed')}</span>`
                    : ''}
            </div>
        `;
    }));

    return `
        <div class="tests-view">
            <div class="page-header">
                <h1 class="page-title">${i18n.t('tests.title')}</h1>
                <p class="page-subtitle">${i18n.t('tests.subtitle')}</p>
                <p class="page-subtitle">${i18n.t('tests.adaptiveWarning')}</p>
            </div>

            <div class="tests-grid">
                ${testCards.join('')}
            </div>
        </div>
    `;
}

export async function afterRender() {
    // Bind test card clicks
    document.querySelectorAll('.test-card').forEach(card => {
        card.addEventListener('click', () => {
            const testId = card.dataset.testId;
            router.navigate(VIEWS.TEST_RUNNER, { testId });
        });
    });
}

export function getTestById(testId) {
    return availableTests.find(t => t.id === testId);
}

// === НОВОЕ: глобальная карта лейблов для всех тестов ===
export function getScaleLabel(scale, language = 'en', useShort = true) {
    // Собираем все scaleLabels из загруженных тестов
    const allLabels = {};
    availableTests.forEach(test => {
        if (test.scaleLabels) {
            Object.assign(allLabels, test.scaleLabels);
        }
    });

    const labelObj = allLabels[scale];
    if (!labelObj) return scale; // fallback

    if (useShort) {
        const shortKey = `short_${language}`;
        return labelObj[shortKey] || labelObj[language] || scale;
    }

    return labelObj[language] || scale;
}

// Для удобства — экспортируем всю карту
export function getAllScaleLabels() {
    const all = {};
    availableTests.forEach(test => {
        if (test.scaleLabels) Object.assign(all, test.scaleLabels);
    });
    return all;
}

export { availableTests };

export default { render, afterRender };
