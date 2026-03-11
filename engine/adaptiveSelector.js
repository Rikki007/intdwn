/**
 * INTDWN - Adaptive Question Selector Module
 * Selects questions based on current trait estimates
 */

import { getTraitConfidence, getLowConfidenceTraits } from './traitEstimator.js';
import { shuffleArray } from '../core/utils.js';

/**
 * Select next question adaptively
 */
export function selectNextQuestion(questions, usedQuestionIds, traitEstimates, scales) {
    // Get available questions
    const available = questions.filter(q => !usedQuestionIds.has(q.id));
    
    if (available.length === 0) {
        return null;
    }
    
    // If this is the first question, select randomly
    if (usedQuestionIds.size === 0) {
        return selectRandomQuestion(available);
    }
    
    // Get traits with lowest confidence
    const lowConfidenceTraits = getLowConfidenceTraits(traitEstimates, 0.7);
    
    // If there are low confidence traits, prioritize those scales
    if (lowConfidenceTraits.length > 0) {
        const targetScale = lowConfidenceTraits[0].scale;
        const scaleQuestions = available.filter(q => q.scale === targetScale);
        
        if (scaleQuestions.length > 0) {
            return selectByDifficulty(scaleQuestions, traitEstimates[targetScale].value);
        }
    }
    
    // Otherwise, select based on difficulty matching
    return selectByDifficultyMatch(available, traitEstimates);
}

/**
 * Select question by matching difficulty to trait estimate
 */
function selectByDifficultyMatch(questions, traitEstimates) {
    // Calculate distance from each question's difficulty to the trait estimate
    const scored = questions.map(q => {
        const estimate = traitEstimates[q.scale]?.value || 50;
        const difficulty = (q.difficulty || 0.5) * 100;
        const distance = Math.abs(difficulty - estimate);
        
        return { question: q, distance };
    });
    
    // Sort by distance (closest match first)
    scored.sort((a, b) => a.distance - b.distance);
    
    // Add some randomness to top candidates
    const topCandidates = scored.slice(0, Math.min(5, scored.length));
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    
    return selected.question;
}

/**
 * Select question by difficulty for a specific scale
 */
function selectByDifficulty(questions, targetValue) {
    const scored = questions.map(q => {
        const difficulty = (q.difficulty || 0.5) * 100;
        const distance = Math.abs(difficulty - targetValue);
        return { question: q, distance };
    });
    
    scored.sort((a, b) => a.distance - b.distance);
    
    // Return the best match
    return scored[0].question;
}

/**
 * Select random question
 */
function selectRandomQuestion(questions) {
    const shuffled = shuffleArray(questions);
    return shuffled[0];
}

/**
 * Get questions distribution by scale
 */
export function getQuestionsDistribution(usedQuestionIds, questions, scales) {
    const distribution = {};
    
    scales.forEach(scale => {
        distribution[scale] = {
            total: questions.filter(q => q.scale === scale).length,
            used: [...usedQuestionIds].filter(id => {
                const q = questions.find(question => question.id === id);
                return q && q.scale === scale;
            }).length
        };
    });
    
    return distribution;
}

/**
 * Check if scales are evenly covered
 */
export function isEvenlyCovered(usedQuestionIds, questions, scales, threshold = 0.7) {
    const distribution = getQuestionsDistribution(usedQuestionIds, questions, scales);
    
    for (const scale in distribution) {
        const { total, used } = distribution[scale];
        if (total > 0) {
            const coverage = used / Math.min(total, 7); // Aim for ~7 questions per scale
            if (coverage < threshold) {
                return false;
            }
        }
    }
    
    return true;
}
