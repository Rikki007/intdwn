/**
 * INTDWN - Stopping Rule Module
 * Determines when to stop the adaptive test
 */

import { TEST_CONFIG } from '../core/constants.js';

/**
 * Check if the test should stop
 */
export function shouldStop(questionsAnswered, confidence) {
    // Must answer minimum questions
    if (questionsAnswered < TEST_CONFIG.MIN_QUESTIONS) {
        return false;
    }
    
    // Stop if reached maximum questions
    if (questionsAnswered >= TEST_CONFIG.MAX_QUESTIONS) {
        return true;
    }
    
    // Stop if confidence threshold is met after minimum questions
    if (confidence >= TEST_CONFIG.CONFIDENCE_THRESHOLD) {
        return true;
    }
    
    return false;
}

/**
 * Calculate confidence level
 * Approximation based on questions answered and variance
 */
export function calculateConfidence(questionsAnswered, traitEstimates) {
    // Base confidence from number of questions
    const baseConfidence = questionsAnswered / TEST_CONFIG.MAX_QUESTIONS;
    
    // Adjust based on trait estimate stability
    const stability = calculateEstimateStability(traitEstimates);
    
    // Combined confidence
    return baseConfidence * 0.6 + stability * 0.4;
}

/**
 * Calculate how stable the trait estimates are
 */
function calculateEstimateStability(traitEstimates) {
    if (!traitEstimates || traitEstimates.length < 2) {
        return 0;
    }
    
    // Calculate variance of recent estimates
    const recentEstimates = traitEstimates.slice(-5);
    const mean = recentEstimates.reduce((sum, val) => sum + val, 0) / recentEstimates.length;
    
    const variance = recentEstimates.reduce((sum, val) => {
        return sum + Math.pow(val - mean, 2);
    }, 0) / recentEstimates.length;
    
    // Lower variance = higher stability = higher confidence
    // Variance ranges from 0 to ~625 (25^2)
    const stability = 1 - Math.min(variance / 400, 1);
    
    return stability;
}

/**
 * Get stopping reason
 */
export function getStoppingReason(questionsAnswered, confidence) {
    if (questionsAnswered >= TEST_CONFIG.MAX_QUESTIONS) {
        return 'max_questions';
    }
    
    if (confidence >= TEST_CONFIG.CONFIDENCE_THRESHOLD && 
        questionsAnswered >= TEST_CONFIG.MIN_QUESTIONS) {
        return 'confidence_reached';
    }
    
    return 'continue';
}

/**
 * Get progress information
 */
export function getProgressInfo(questionsAnswered, confidence) {
    const minProgress = Math.min(questionsAnswered / TEST_CONFIG.MIN_QUESTIONS, 1);
    const maxProgress = questionsAnswered / TEST_CONFIG.MAX_QUESTIONS;
    
    return {
        questionsAnswered,
        minQuestions: TEST_CONFIG.MIN_QUESTIONS,
        maxQuestions: TEST_CONFIG.MAX_QUESTIONS,
        confidence: Math.round(confidence * 100),
        progressPercent: Math.round(maxProgress * 100),
        canFinish: questionsAnswered >= TEST_CONFIG.MIN_QUESTIONS,
        mustFinish: questionsAnswered >= TEST_CONFIG.MAX_QUESTIONS
    };
}
