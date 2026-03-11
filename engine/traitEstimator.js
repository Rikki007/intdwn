/**
 * INTDWN - Trait Estimator Module
 * Estimates trait levels from answers
 */

import { ANSWER_SCALE } from '../core/constants.js';

/**
 * Initialize trait estimates
 */
export function initializeEstimates(scales) {
    const estimates = {};
    scales.forEach(scale => {
        estimates[scale] = {
            value: 50, // Start at midpoint
            variance: 100, // High initial uncertainty
            samples: 0
        };
    });
    return estimates;
}

/**
 * Update trait estimate based on new answer
 * Uses Bayesian-like updating
 */
export function updateEstimate(currentEstimate, answer, question) {
    const { value, variance, samples } = currentEstimate;
    
    // Calculate score (handle reverse scoring)
    let score = answer;
    if (question.reverse) {
        score = (ANSWER_SCALE.STRONGLY_AGREE + ANSWER_SCALE.STRONGLY_DISAGREE) - score;
    }
    
    // Convert to 0-100 scale
    const normalizedScore = ((score - 1) / 4) * 100;
    
    // Kalman-like update
    // Measurement noise (how much we trust a single answer)
    const measurementNoise = 400 / (question.weight || 1);
    
    // Kalman gain
    const kalmanGain = variance / (variance + measurementNoise);
    
    // Update estimate
    const newValue = value + kalmanGain * (normalizedScore - value);
    const newVariance = (1 - kalmanGain) * variance;
    
    return {
        value: Math.round(newValue),
        variance: Math.max(newVariance, 10), // Minimum variance
        samples: samples + 1
    };
}

/**
 * Update all trait estimates from answer
 */
export function updateAllEstimates(estimates, answer, question) {
    const scale = question.scale;
    
    if (estimates[scale]) {
        estimates[scale] = updateEstimate(estimates[scale], answer.value, question);
    }
    
    return estimates;
}

/**
 * Get current trait values
 */
export function getTraitValues(estimates) {
    const values = {};
    for (const scale in estimates) {
        values[scale] = estimates[scale].value;
    }
    return values;
}

/**
 * Get trait confidence (inverse of variance)
 */
export function getTraitConfidence(estimates) {
    const confidences = {};
    for (const scale in estimates) {
        // Convert variance to confidence (0-1)
        const variance = estimates[scale].variance;
        confidences[scale] = Math.max(0, Math.min(1, 1 - (variance / 100)));
    }
    return confidences;
}

/**
 * Get overall confidence across all traits
 */
export function getOverallConfidence(estimates) {
    const confidences = getTraitConfidence(estimates);
    const values = Object.values(confidences);
    
    if (values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Get traits with low confidence (need more questions)
 */
export function getLowConfidenceTraits(estimates, threshold = 0.5) {
    const lowConfidence = [];
    const confidences = getTraitConfidence(estimates);
    
    for (const scale in confidences) {
        if (confidences[scale] < threshold) {
            lowConfidence.push({
                scale,
                confidence: confidences[scale],
                estimate: estimates[scale].value
            });
        }
    }
    
    return lowConfidence.sort((a, b) => a.confidence - b.confidence);
}

/**
 * Smooth estimates using exponential moving average
 */
export function smoothEstimates(estimates, previousEstimates, alpha = 0.3) {
    if (!previousEstimates) return estimates;
    
    const smoothed = {};
    
    for (const scale in estimates) {
        if (previousEstimates[scale]) {
            smoothed[scale] = {
                value: Math.round(alpha * estimates[scale].value + (1 - alpha) * previousEstimates[scale].value),
                variance: estimates[scale].variance,
                samples: estimates[scale].samples
            };
        } else {
            smoothed[scale] = estimates[scale];
        }
    }
    
    return smoothed;
}
