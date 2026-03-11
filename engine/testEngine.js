/**
 * INTDWN - Test Engine Module
 * Main test execution engine
 */

import { TEST_CONFIG, EVENTS } from '../core/constants.js';
import { storage } from '../core/storage.js';
import { shuffleArray, generateId } from '../core/utils.js';
import { calculateScaleScores, convertToPercentages, calculatePercentiles } from './scoring.js';
import { shouldStop, calculateConfidence, getProgressInfo } from './stoppingRule.js';
import { initializeEstimates, updateAllEstimates, getTraitValues, getOverallConfidence } from './traitEstimator.js';
import { selectNextQuestion } from './adaptiveSelector.js';

class TestEngine {
    constructor() {
        this.currentTest = null;
        this.questions = [];
        this.usedQuestionIds = new Set();
        this.answers = [];
        this.traitEstimates = null;
        this.startTime = null;
        this.confidence = 0;
    }

    /**
     * Start a new test
     */
    async startTest(testData) {
        this.currentTest = testData;
        this.questions = shuffleArray([...testData.questions]);
        this.usedQuestionIds = new Set();
        this.answers = [];
        this.traitEstimates = initializeEstimates(testData.scales);
        this.startTime = Date.now();
        this.confidence = 0;

        // Get first question
        const firstQuestion = this.getNextQuestion();

        return {
            testId: testData.id,
            testName: testData.name,
            totalQuestions: this.questions.length,
            firstQuestion,
            progress: this.getProgress()
        };
    }

    /**
     * Get next question
     */
    getNextQuestion() {
        if (!this.currentTest) return null;

        const question = selectNextQuestion(
            this.questions,
            this.usedQuestionIds,
            this.traitEstimates,
            this.currentTest.scales
        );

        return question;
    }

    /**
     * Submit answer and get next question
     */
    submitAnswer(questionId, answerValue) {
        if (!this.currentTest) {
            throw new Error('No active test');
        }

        // Find the question
        const question = this.questions.find(q => q.id === questionId);
        if (!question) {
            throw new Error('Question not found');
        }

        // Record answer
        this.answers.push({
            questionId,
            value: answerValue,
            timestamp: Date.now()
        });

        // Mark question as used
        this.usedQuestionIds.add(questionId);

        // Update trait estimates
        this.traitEstimates = updateAllEstimates(this.traitEstimates, { value: answerValue }, question);

        // Update confidence
        this.confidence = this.calculateCurrentConfidence();

        // Check if test should stop
        const isComplete = shouldStop(this.answers.length, this.confidence);

        if (isComplete) {
            return {
                isComplete: true,
                progress: this.getProgress()
            };
        }

        // Get next question
        const nextQuestion = this.getNextQuestion();

        return {
            isComplete: false,
            nextQuestion,
            progress: this.getProgress()
        };
    }

    /**
     * Calculate current confidence
     */
    calculateCurrentConfidence() {
        const overallTraitConfidence = getOverallConfidence(this.traitEstimates);
        return calculateConfidence(this.answers.length, Object.values(getTraitValues(this.traitEstimates)));
    }

    /**
     * Get current progress
     */
    getProgress() {
        return getProgressInfo(this.answers.length, this.confidence);
    }

    /**
     * Complete test and calculate results
     */
    async completeTest() {
        if (!this.currentTest) {
            throw new Error('No active test');
        }

        // Calculate final scores
        const { scaleScores, scaleCounts } = calculateScaleScores(
            this.answers,
            this.questions,
            this.currentTest.scales
        );

        const percentages = convertToPercentages(scaleScores, scaleCounts);
        const percentiles = calculatePercentiles(percentages);

        // Create result object
        const result = {
            id: generateId(),
            testId: this.currentTest.id,
            testName: this.currentTest.name,
            date: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            questionsAnswered: this.answers.length,
            answers: this.answers,
            scores: percentages,
            percentiles,
            scaleScores,
            scaleCounts,
            confidence: this.confidence
        };

        // Save result to storage
        await storage.saveTestResult(result);

        // Reset engine state
        this.reset();

        return result;
    }

    /**
     * Cancel current test
     */
    cancelTest() {
        this.reset();
    }

    /**
     * Reset engine state
     */
    reset() {
        this.currentTest = null;
        this.questions = [];
        this.usedQuestionIds = new Set();
        this.answers = [];
        this.traitEstimates = null;
        this.startTime = null;
        this.confidence = 0;
    }

    /**
     * Check if test is in progress
     */
    isTestInProgress() {
        return this.currentTest !== null;
    }

    /**
     * Get current test info
     */
    getCurrentTestInfo() {
        if (!this.currentTest) return null;

        return {
            testId: this.currentTest.id,
            testName: this.currentTest.name,
            questionsAnswered: this.answers.length,
            progress: this.getProgress()
        };
    }
}

export const testEngine = new TestEngine();
export default testEngine;
