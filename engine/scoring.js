/**
 * INTDWN - Scoring Module
 */

import { ANSWER_SCALE } from '../core/constants.js';

/**
 * Calculate raw score for a single question
 */
export function calculateQuestionScore(answer, question) {
    let score = answer;
    
    // Reverse scoring if needed
    if (question.reverse) {
        score = (ANSWER_SCALE.STRONGLY_AGREE + ANSWER_SCALE.STRONGLY_DISAGREE) - score;
    }
    
    return score;
}

/**
 * Calculate scale scores from answers
 */
export function calculateScaleScores(answers, questions, scales) {
    const scaleScores = {};
    const scaleCounts = {};
    
    // Initialize scales
    scales.forEach(scale => {
        scaleScores[scale] = 0;
        scaleCounts[scale] = 0;
    });
    
    // Sum scores for each scale
    answers.forEach(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        if (question) {
            const score = calculateQuestionScore(answer.value, question);
            scaleScores[question.scale] += score;
            scaleCounts[question.scale]++;
        }
    });
    
    return { scaleScores, scaleCounts };
}

/**
 * Convert raw scores to percentages (0-100)
 */
export function convertToPercentages(scaleScores, scaleCounts) {
    const percentages = {};
    
    for (const scale in scaleScores) {
        const count = scaleCounts[scale];
        if (count > 0) {
            // Raw score range: count * 1 to count * 5
            const minPossible = count * ANSWER_SCALE.STRONGLY_DISAGREE;
            const maxPossible = count * ANSWER_SCALE.STRONGLY_AGREE;
            
            // Normalize to 0-100
            const rawScore = scaleScores[scale];
            percentages[scale] = Math.round(
                ((rawScore - minPossible) / (maxPossible - minPossible)) * 100
            );
        } else {
            percentages[scale] = 0;
        }
    }
    
    return percentages;
}

/**
 * Calculate percentiles (approximate)
 * In a real application, these would be based on normative data
 */
export function calculatePercentiles(scores) {
    // Simplified percentile calculation based on normal distribution approximation
    const percentiles = {};
    
    for (const scale in scores) {
        const score = scores[scale];
        // Approximate percentile using cumulative distribution function
        // This is a simplified version - real percentiles would use actual normative data
        percentiles[scale] = Math.round(calculateApproximatePercentile(score));
    }
    
    return percentiles;
}

/**
 * Approximate percentile from score (0-100)
 * Uses a simple sigmoid-like function for approximation
 */
function calculateApproximatePercentile(score) {
    // Centered at 50, with standard deviation of ~15
    const mean = 50;
    const sd = 15;
    
    // Simplified cumulative normal approximation
    const z = (score - mean) / sd;
    const percentile = 50 * (1 + Math.tanh(z * 0.8));
    
    return clamp(percentile, 1, 99);
}

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Calculate overall test score
 */
export function calculateOverallScore(scaleScores) {
    const values = Object.values(scaleScores);
    if (values.length === 0) return 0;
    
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
}

/**
 * Get score statistics
 */
export function getScoreStatistics(scores) {
    const values = Object.values(scores);
    
    if (values.length === 0) {
        return { min: 0, max: 0, mean: 0, range: 0 };
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return {
        min,
        max,
        mean: Math.round(mean),
        range: max - min
    };
}

/**
 * Compare two sets of scores
 */
export function compareScores(scores1, scores2) {
    const comparison = {};
    
    for (const scale in scores1) {
        if (scores2[scale] !== undefined) {
            comparison[scale] = {
                previous: scores2[scale],
                current: scores1[scale],
                change: scores1[scale] - scores2[scale]
            };
        }
    }
    
    return comparison;
}
