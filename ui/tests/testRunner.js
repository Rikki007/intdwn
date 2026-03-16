/**
 * INTDWN - Test Runner View
 */

import { i18n } from '../../core/i18n.js';
import { router } from '../../core/router.js';
import { testEngine } from '../../engine/testEngine.js';
import { ANSWER_LABELS, VIEWS } from '../../core/constants.js';
import { getTestById } from './testsList.js';

let currentQuestion = null;
let selectedAnswer = null;

export async function render(params) {

    if (!params?.testId) {
        router.navigate(VIEWS.TESTS);
        return '';
    }

    const language = i18n.getLanguage();
    const testId = params.testId;
    
    const testData = getTestById(testId);
    
    if (!testData) {
        console.warn("Test not found:", testId);
        router.navigate(VIEWS.TESTS);
        return '';
    }

    // Start the test
    const testSession = await testEngine.startTest(testData);
    currentQuestion = testSession.firstQuestion;
    selectedAnswer = null;

    return renderQuestion(currentQuestion, testSession, language);
}

function renderQuestion(question, session, language) {
    const testName = session.testName[language] || session.testName.en;
    const questionText = question.text[language] || question.text.en;
    const progress = testEngine.getProgress();

    return `
        <div class="test-runner-view">
            <div class="test-header">
                <button class="btn btn-secondary btn-sm" id="exit-test">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <h2 class="test-name">${testName}</h2>
                <div class="question-counter">
                    ${i18n.t('test.question')} ${progress.questionsAnswered + 1}
                </div>
            </div>

            <div class="test-progress">
                <div class="progress-bar">
                    <div class="progress-bar-fill" style="width: ${progress.progressPercent}%"></div>
                </div>
                <div class="progress-info">
                    <span>${progress.progressPercent}%</span>
                    <span>${i18n.t('test.confidence')}: ${progress.confidence}%</span>
                </div>
            </div>

            <div class="question-card">
                <div class="question-number">
                    ${i18n.t('test.question')} ${progress.questionsAnswered + 1}
                </div>
                <p class="question-text">${questionText}</p>
                
                <div class="answer-options" id="answer-options">
                    ${renderAnswerOptions(language)}
                </div>
            </div>

            <div class="test-actions">
                <button class="btn btn-primary btn-lg btn-block" id="next-question" disabled>
                    ${i18n.t('test.next')}
                </button>
            </div>
        </div>
    `;
}

function renderAnswerOptions(language) {
    const labels = ANSWER_LABELS[language] || ANSWER_LABELS.en;
    
    return [1, 2, 3, 4, 5].map(value => `
        <label class="answer-option" data-value="${value}">
            <input type="radio" name="answer" value="${value}">
            <span class="answer-circle"></span>
            <span class="answer-label">${labels[value]}</span>
        </label>
    `).join('');
}

export async function afterRender(params) {
    // Exit button
    const exitBtn = document.getElementById('exit-test');
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            if (confirm(i18n.t('common.cancel') + '?')) {
                testEngine.cancelTest();
                router.navigate(VIEWS.TESTS);
            }
        });
    }

    // Answer selection
    const options = document.querySelectorAll('.answer-option');
    const nextBtn = document.getElementById('next-question');
    if (!nextBtn) return;

    options.forEach(option => {
        option.addEventListener('click', () => {
            // Remove previous selection
            options.forEach(o => o.classList.remove('selected'));
            
            // Add selection
            option.classList.add('selected');
            option.querySelector('input').checked = true;
            
            selectedAnswer = parseInt(option.dataset.value);
            nextBtn.disabled = false;
        });
    });

    // Next button
    nextBtn.addEventListener('click', async () => {
        if (selectedAnswer === null) return;

        // Disable during processing
        nextBtn.disabled = true;

        // Submit answer
        const result = testEngine.submitAnswer(currentQuestion.id, selectedAnswer);

        if (result.isComplete || !result.nextQuestion) {
            // Test complete
            const testResult = await testEngine.completeTest();
            router.navigate(VIEWS.RESULTS, { resultId: testResult.id });
        } else {
            // Next question
            currentQuestion = result.nextQuestion;
            selectedAnswer = null;

            // Update UI
            const language = i18n.getLanguage();
            const container = document.querySelector('.test-runner-view');
            container.innerHTML = renderQuestion(
                currentQuestion, 
                { testName: testEngine.currentTest.name },
                language
            );
            
            // Rebind events
            afterRender(params);
        }
    });
}

export default { render, afterRender };
