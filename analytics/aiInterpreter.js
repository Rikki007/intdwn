/**
 * INTDWN - AI Interpreter Module
 * Generates AI-style interpretations from scores
 */

import { loadJSON } from '../core/utils.js';
import { TRAIT_LEVELS } from '../core/constants.js';

class AIInterpreter {
    constructor() {
        this.interpretations = null;
        this.loaded = false;
    }

    /**
     * Load interpretations from JSON
     */
    async init() {
        if (this.loaded) return;

        try {
            this.interpretations = await loadJSON('./data/interpretations.json');
            this.loaded = true;
        } catch (error) {
            console.error('Failed to load interpretations:', error);
            this.interpretations = {};
        }
    }

    /**
     * Get interpretation for a single trait
     */
    getTraitInterpretation(traitName, score, language = 'en') {
        const level = this.classifyLevel(score);
        
        if (!this.interpretations?.traits?.[traitName]?.[level]) {
            return this.getDefaultInterpretation(traitName, level, language);
        }

        const interp = this.interpretations.traits[traitName][level];
        
        return {
            trait: traitName,
            level,
            score,
            title: interp.title?.[language] || interp.title?.en || '',
            description: interp.description?.[language] || interp.description?.en || '',
            strengths: interp.strengths?.[language] || interp.strengths?.en || [],
            challenges: interp.challenges?.[language] || interp.challenges?.en || [],
            advice: interp.advice?.[language] || interp.advice?.en || ''
        };
    }

    /**
     * Generate full interpretation report
     */
    async generateReport(scores, testName, language = 'en') {
        const interpretations = [];
        
        for (const [trait, score] of Object.entries(scores)) {
            interpretations.push(this.getTraitInterpretation(trait, score, language));
        }

        // Generate summary
        const summary = this.generateSummary(scores, interpretations, language);
        
        // Generate recommendations
        const recommendations = this.generateRecommendations(interpretations, language);

        return {
            testName,
            generatedAt: new Date().toISOString(),
            summary,
            interpretations,
            recommendations,
            overallAssessment: this.generateOverallAssessment(scores, language)
        };
    }

    /**
     * Generate summary paragraph
     */
    generateSummary(scores, interpretations, language = 'en') {
        const templates = this.interpretations?.summaryTemplates?.[language] || 
            this.interpretations?.summaryTemplates?.en || {};

        // Find dominant traits
        const sorted = Object.entries(scores).sort((a, b) => 
            Math.abs(b[1] - 50) - Math.abs(a[1] - 50)
        );

        const topTraits = sorted.slice(0, 3);
        
        if (templates.personalized) {
            return this.fillTemplate(templates.personalized, {
                trait1: topTraits[0]?.[0] || 'traits',
                trait2: topTraits[1]?.[0] || '',
                score1: topTraits[0]?.[1] || 50,
                score2: topTraits[1]?.[1] || 50
            });
        }

        // Default summary
        const highTraits = interpretations.filter(i => i.level === 'high');
        const lowTraits = interpretations.filter(i => i.level === 'low');

        if (language === 'ru') {
            return `Ваш психологический профиль показывает ${highTraits.length} ярко выраженных черт и ${lowTraits.length} черт ниже среднего. Это создает уникальный портрет личности с определенными сильными сторонами и областями для развития.`;
        }
        
        return `Your psychological profile shows ${highTraits.length} highly expressed traits and ${lowTraits.length} traits below average. This creates a unique personality portrait with specific strengths and areas for development.`;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(interpretations, language = 'en') {
        const recommendations = [];

        for (const interp of interpretations) {
            if (interp.advice) {
                recommendations.push({
                    trait: interp.trait,
                    level: interp.level,
                    advice: interp.advice
                });
            }
        }

        return recommendations;
    }

    /**
     * Generate overall assessment
     */
    generateOverallAssessment(scores, language = 'en') {
        const values = Object.values(scores);
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;

        const balance = Math.max(0, 100 - Math.sqrt(variance));

        if (language === 'ru') {
            return {
                balance: Math.round(balance),
                description: balance > 70 
                    ? 'Ваш профиль показывает хорошую сбалансированность черт личности.'
                    : balance > 40
                    ? 'Ваш профиль имеет некоторые выраженные акценты.'
                    : 'Ваш профиль характеризуется ярко выраженными особенностями.'
            };
        }

        return {
            balance: Math.round(balance),
            description: balance > 70
                ? 'Your profile shows good balance across personality traits.'
                : balance > 40
                ? 'Your profile has some pronounced accents.'
                : 'Your profile is characterized by distinctive features.'
        };
    }

    /**
     * Classify score level
     */
    classifyLevel(score) {
        if (score < TRAIT_LEVELS.LOW.max) return 'low';
        if (score < TRAIT_LEVELS.HIGH.min) return 'medium';
        return 'high';
    }

    /**
     * Get default interpretation
     */
    getDefaultInterpretation(traitName, level, language) {
        const defaults = {
            en: {
                low: {
                    title: `Low ${traitName}`,
                    description: `Your score indicates a lower level.`,
                    advice: 'Consider exploring activities that may help develop this trait.'
                },
                medium: {
                    title: `Moderate ${traitName}`,
                    description: `Your score shows a balanced level.`,
                    advice: 'Continue developing self-awareness in this area.'
                },
                high: {
                    title: `High ${traitName}`,
                    description: `Your score indicates a strong presence.`,
                    advice: 'Leverage this strength while being mindful of balance.'
                }
            },
            ru: {
                low: {
                    title: `Низкий уровень: ${traitName}`,
                    description: `Ваш результат указывает на низкий уровень.`,
                    advice: 'Рассмотрите возможности для развития этой черты.'
                },
                medium: {
                    title: `Средний уровень: ${traitName}`,
                    description: `Ваш результат показывает сбалансированный уровень.`,
                    advice: 'Продолжайте развивать самосознание в этой области.'
                },
                high: {
                    title: `Высокий уровень: ${traitName}`,
                    description: `Ваш результат указывает на высокий уровень.`,
                    advice: 'Используйте эту силу, сохраняя баланс.'
                }
            }
        };

        return {
            trait: traitName,
            level,
            title: defaults[language]?.[level]?.title || defaults.en[level].title,
            description: defaults[language]?.[level]?.description || defaults.en[level].description,
            strengths: [],
            challenges: [],
            advice: defaults[language]?.[level]?.advice || defaults.en[level].advice
        };
    }

    /**
     * Fill template with values
     */
    fillTemplate(template, values) {
        let result = template;
        for (const [key, value] of Object.entries(values)) {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
        return result;
    }
}

export const aiInterpreter = new AIInterpreter();
export default aiInterpreter;
