/**
 * INTDWN - Rule Engine Module
 * Applies rules to generate insights
 */

import { loadJSON } from '../core/utils.js';

class RuleEngine {
    constructor() {
        this.rules = [];
        this.loaded = false;
    }

    /**
     * Load rules from JSON
     */
    async init() {
        if (this.loaded) return;

        try {
            const data = await loadJSON('./data/rules.json');
            this.rules = data?.rules || [];
            this.loaded = true;
        } catch (error) {
            console.error('Failed to load rules:', error);
            this.rules = [];
        }
    }

    /**
     * Apply rules to profile scores
     */
    applyRules(scores, language = 'en') {
        const insights = [];

        for (const rule of this.rules) {
            const result = this.evaluateRule(rule, scores, language);
            if (result) {
                insights.push(result);
            }
        }

        return insights;
    }

    /**
     * Evaluate a single rule
     */
    evaluateRule(rule, scores, language) {
        // Check if all conditions are met
        const conditionsMet = rule.conditions.every(condition => {
            return this.evaluateCondition(condition, scores);
        });

        if (!conditionsMet) {
            return null;
        }

        // Return the insight
        return {
            id: rule.id,
            type: rule.type || 'insight',
            priority: rule.priority || 'normal',
            title: rule.title?.[language] || rule.title?.en || '',
            message: rule.message?.[language] || rule.message?.en || '',
            recommendation: rule.recommendation?.[language] || rule.recommendation?.en || ''
        };
    }

    /**
     * Evaluate a condition
     */
    evaluateCondition(condition, scores) {
        const score = scores[condition.scale];
        
        if (score === undefined) {
            return false;
        }

        switch (condition.operator) {
            case 'eq':
                return score === condition.value;
            case 'ne':
                return score !== condition.value;
            case 'gt':
                return score > condition.value;
            case 'gte':
                return score >= condition.value;
            case 'lt':
                return score < condition.value;
            case 'lte':
                return score <= condition.value;
            case 'between':
                return score >= condition.min && score <= condition.max;
            default:
                return false;
        }
    }

    /**
     * Get high priority insights
     */
    getHighPriorityInsights(scores, language = 'en') {
        const insights = this.applyRules(scores, language);
        return insights.filter(i => i.priority === 'high');
    }

    /**
     * Get recommendations
     */
    getRecommendations(scores, language = 'en') {
        const insights = this.applyRules(scores, language);
        return insights
            .filter(i => i.recommendation)
            .map(i => ({
                title: i.title,
                recommendation: i.recommendation
            }));
    }

    /**
     * Check for specific pattern
     */
    checkPattern(patternName, scores) {
        const patternRules = this.rules.filter(r => r.pattern === patternName);
        
        for (const rule of patternRules) {
            if (rule.conditions.every(c => this.evaluateCondition(c, scores))) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get risk factors
     */
    getRiskFactors(scores, language = 'en') {
        const insights = this.applyRules(scores, language);
        return insights.filter(i => i.type === 'risk');
    }

    /**
     * Get strengths
     */
    getStrengths(scores, language = 'en') {
        const insights = this.applyRules(scores, language);
        return insights.filter(i => i.type === 'strength');
    }
}

export const ruleEngine = new RuleEngine();
export default ruleEngine;
