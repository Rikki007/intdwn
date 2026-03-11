/**
 * INTDWN - Report Generator Module
 * Generates comprehensive reports
 */

import { i18n } from '../core/i18n.js';
import { formatDate } from '../core/utils.js';
import { aiInterpreter } from './aiInterpreter.js';
import { ruleEngine } from './ruleEngine.js';

class ReportGenerator {
    /**
     * Generate full report for test result
     */
    async generateTestReport(testResult) {
        const language = i18n.getLanguage();
        
        // Get AI interpretation
        const interpretation = await aiInterpreter.generateReport(
            testResult.scores,
            testResult.testName?.[language] || testResult.testId,
            language
        );

        // Get rule-based insights
        const insights = ruleEngine.applyRules(testResult.scores, language);

        // Build report
        const report = {
            id: `report_${testResult.id}`,
            testId: testResult.testId,
            testName: testResult.testName,
            date: testResult.date,
            formattedDate: formatDate(testResult.date, language),
            
            // Scores
            scores: testResult.scores,
            percentiles: testResult.percentiles,
            
            // Interpretation
            summary: interpretation.summary,
            interpretations: interpretation.interpretations,
            recommendations: interpretation.recommendations,
            overallAssessment: interpretation.overallAssessment,
            
            // Insights
            insights: insights.map(i => ({
                type: i.type,
                title: i.title,
                message: i.message
            })),
            
            // Metadata
            metadata: {
                questionsAnswered: testResult.questionsAnswered,
                confidence: testResult.confidence,
                generatedAt: new Date().toISOString()
            }
        };

        return report;
    }

    /**
     * Generate profile report
     */
    async generateProfileReport(profile) {
        const language = i18n.getLanguage();

        // Get interpretations for aggregated scores
        const interpretations = [];
        for (const [trait, data] of Object.entries(profile.aggregatedScores)) {
            interpretations.push(
                aiInterpreter.getTraitInterpretation(trait, data.mean, language)
            );
        }

        // Generate timeline analysis
        const timelineAnalysis = this.analyzeTimeline(profile.testHistory);

        // Build report
        const report = {
            type: 'profile',
            createdAt: new Date().toISOString(),
            
            // Overview
            overview: {
                totalTests: profile.totalTests,
                profileAge: this.calculateProfileAge(profile.createdAt),
                completeness: this.calculateCompleteness(profile)
            },
            
            // Dominant traits
            dominantTraits: profile.dominantTraits.slice(0, 5),
            
            // Trait analysis
            traitAnalysis: interpretations,
            
            // Trends
            trends: {
                overall: profile.trends.overall,
                details: profile.trends.details
            },
            
            // Timeline
            timeline: timelineAnalysis,
            
            // Recommendations
            recommendations: this.generateProfileRecommendations(profile, language)
        };

        return report;
    }

    /**
     * Analyze timeline of test results
     */
    analyzeTimeline(testHistory) {
        if (testHistory.length < 2) {
            return { available: false, message: 'Insufficient data for timeline analysis' };
        }

        const sorted = [...testHistory].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        // Group by month
        const byMonth = {};
        sorted.forEach(result => {
            const month = new Date(result.date).toISOString().slice(0, 7);
            if (!byMonth[month]) {
                byMonth[month] = [];
            }
            byMonth[month].push(result);
        });

        // Calculate changes over time
        const changes = {};
        const allScales = new Set();
        
        sorted.forEach(r => {
            Object.keys(r.scores).forEach(s => allScales.add(s));
        });

        allScales.forEach(scale => {
            const values = sorted
                .filter(r => r.scores[scale] !== undefined)
                .map(r => ({ date: r.date, value: r.scores[scale] }));
            
            if (values.length >= 2) {
                changes[scale] = {
                    start: values[0].value,
                    end: values[values.length - 1].value,
                    change: values[values.length - 1].value - values[0].value,
                    dataPoints: values
                };
            }
        });

        return {
            available: true,
            totalDataPoints: sorted.length,
            dateRange: {
                start: sorted[0].date,
                end: sorted[sorted.length - 1].date
            },
            changes
        };
    }

    /**
     * Calculate profile age
     */
    calculateProfileAge(createdAt) {
        const created = new Date(createdAt);
        const now = new Date();
        const days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        
        if (days < 7) return { value: days, unit: 'days' };
        if (days < 30) return { value: Math.floor(days / 7), unit: 'weeks' };
        if (days < 365) return { value: Math.floor(days / 30), unit: 'months' };
        return { value: Math.floor(days / 365), unit: 'years' };
    }

    /**
     * Calculate profile completeness
     */
    calculateCompleteness(profile) {
        const expectedTests = [
            'big_five', 'anxiety', 'emotional_intelligence',
            'locus_of_control', 'procrastination', 'stress_resistance'
        ];

        const completedTests = new Set(
            profile.testHistory.map(t => t.testId)
        );

        const completeness = expectedTests.filter(t => completedTests.has(t)).length / expectedTests.length;
        
        return Math.round(completeness * 100);
    }

    /**
     * Generate profile recommendations
     */
    generateProfileRecommendations(profile, language) {
        const recommendations = [];

        // Check for incomplete profile
        const completeness = this.calculateCompleteness(profile);
        if (completeness < 50) {
            recommendations.push({
                type: 'action',
                priority: 'high',
                title: language === 'ru' ? 'Завершите профиль' : 'Complete Your Profile',
                description: language === 'ru' 
                    ? 'Пройдите больше тестов для получения более точного анализа'
                    : 'Take more tests to get a more accurate analysis'
            });
        }

        // Check for concerning trends
        for (const [scale, data] of Object.entries(profile.trends.details || {})) {
            if (data.direction === 'down' && data.change < -10) {
                recommendations.push({
                    type: 'awareness',
                    priority: 'medium',
                    title: language === 'ru' ? `Внимание: ${scale}` : `Attention: ${scale}`,
                    description: language === 'ru'
                        ? `Наблюдается снижение показателя ${scale}`
                        : `A decrease in ${scale} has been observed`
                });
            }
        }

        return recommendations;
    }

    /**
     * Export report as JSON
     */
    exportReport(report) {
        return JSON.stringify(report, null, 2);
    }
}

export const reportGenerator = new ReportGenerator();
export default reportGenerator;
