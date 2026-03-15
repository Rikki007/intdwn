/**
 * INTDWN - Profile Engine Module
 * Builds and manages psychological profile
 */

import { storage } from '../core/storage.js';
import { TRAIT_LEVELS } from '../core/constants.js';
import { mean, standardDeviation } from '../core/utils.js';

class ProfileEngine {
    constructor() {
        this.profile = null;
    }

    /**
     * Build profile from test results
     */
    async buildProfile() {
        const results = await storage.getTestResults();
        console.log(results)
        
        if (results.length === 0) {
            return null;
        }

        // Aggregate scores by scale
        const aggregatedScores = this.aggregateScores(results);
        
        // Calculate trends
        const trends = this.calculateTrends(results);
        
        // Identify dominant traits
        const dominantTraits = this.identifyDominantTraits(aggregatedScores);
        
        // Build profile
        this.profile = {
            createdAt: results[0].date,
            updatedAt: new Date().toISOString(),
            totalTests: results.length,
            aggregatedScores,
            trends,
            dominantTraits,
            testHistory: results.map(r => ({
                testId: r.testId,
                date: r.date,
                scores: r.scores
            }))
        };

        return this.profile;
    }

    /**
     * Aggregate scores from multiple tests
     */
    aggregateScores(results) {
        const scoresByScale = {};
        
        results.forEach(result => {
            for (const scale in result.scores) {
                if (!scoresByScale[scale]) {
                    scoresByScale[scale] = [];
                }
                scoresByScale[scale].push(result.scores[scale]);
            }
        });

        const aggregated = {};
        
        for (const scale in scoresByScale) {
            const scores = scoresByScale[scale];
            aggregated[scale] = {
                mean: Math.round(mean(scores)),
                stdDev: Math.round(standardDeviation(scores) * 10) / 10,
                min: Math.min(...scores),
                max: Math.max(...scores),
                count: scores.length,
                trend: this.calculateScaleTrend(scores),
                level: this.classifyLevel(Math.round(mean(scores)))
            };
        }

        return aggregated;
    }

    /**
     * Calculate trend for a scale
     */
    calculateScaleTrend(scores) {
        if (scores.length < 2) return 'stable';
        
        const recent = scores.slice(-3);
        const older = scores.slice(0, -3);
        
        if (older.length === 0) return 'stable';
        
        const recentMean = mean(recent);
        const olderMean = mean(older);
        const diff = recentMean - olderMean;
        
        if (diff > 5) return 'increasing';
        if (diff < -5) return 'decreasing';
        return 'stable';
    }

    /**
     * Calculate overall trends
     */
    calculateTrends(results) {
        if (results.length < 2) {
            return { overall: 'insufficient_data', details: {} };
        }

        const sorted = [...results].sort((a, b) => new Date(a.date) - new Date(b.date));
        const oldest = sorted[0];
        const newest = sorted[sorted.length - 1];

        const details = {};
        
        for (const scale in newest.scores) {
            const oldScore = oldest.scores[scale] || 50;
            const newScore = newest.scores[scale];
            details[scale] = {
                change: newScore - oldScore,
                direction: newScore > oldScore ? 'up' : newScore < oldScore ? 'down' : 'stable'
            };
        }

        return {
            overall: this.calculateOverallTrend(details),
            details,
            periodStart: oldest.date,
            periodEnd: newest.date
        };
    }

    /**
     * Calculate overall trend direction
     */
    calculateOverallTrend(details) {
        const changes = Object.values(details).map(d => d.change);
        const avgChange = mean(changes);
        
        if (avgChange > 3) return 'improving';
        if (avgChange < -3) return 'declining';
        return 'stable';
    }

    /**
     * Identify dominant traits
     */
    identifyDominantTraits(aggregatedScores) {
        const traits = [];
        
        for (const scale in aggregatedScores) {
            const data = aggregatedScores[scale];
            traits.push({
                scale,
                score: data.mean,
                level: data.level,
                trend: data.trend
            });
        }

        // Sort by distance from 50 (most extreme first)
        return traits.sort((a, b) => {
            const aDist = Math.abs(a.score - 50);
            const bDist = Math.abs(b.score - 50);
            return bDist - aDist;
        });
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
     * Get current profile
     */
    getProfile() {
        return this.profile;
    }

    /**
     * Get trait summary
     */
    getTraitSummary(scale) {
        if (!this.profile || !this.profile.aggregatedScores[scale]) {
            return null;
        }

        return this.profile.aggregatedScores[scale];
    }

    /**
     * Compare with previous results
     */
    async compareWithPrevious(testId) {
        const results = await storage.getTestResults(testId);
        
        if (results.length < 2) {
            return null;
        }

        const sorted = [...results].sort((a, b) => new Date(b.date) - new Date(a.date));
        const current = sorted[0];
        const previous = sorted[1];

        const comparison = {
            testId,
            current: current.scores,
            previous: previous.scores,
            changes: {},
            currentDate: current.date,
            previousDate: previous.date
        };

        for (const scale in current.scores) {
            comparison.changes[scale] = current.scores[scale] - (previous.scores[scale] || 0);
        }

        return comparison;
    }

    /**
     * Get profile completeness
     */
    getProfileCompleteness() {
        if (!this.profile) return 0;

        const allTests = [
            'big_five',
            'anxiety',
            'emotional_intelligence',
            'locus_of_control',
            'procrastination',
            'stress_resistance'
        ];

        const completedTestIds = new Set(
            this.profile.testHistory.map(result => result.testId)
        );

        const completedCount = allTests.filter(testId => completedTestIds.has(testId)).length;

        return Math.round((completedCount / allTests.length) * 100);
    }
}

export const profileEngine = new ProfileEngine();
export default profileEngine;
