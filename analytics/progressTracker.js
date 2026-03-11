/**
 * INTDWN - Progress Tracker Module
 * Tracks user progress and achievements
 */

import { storage } from '../core/storage.js';
import { i18n } from '../core/i18n.js';

class ProgressTracker {
    constructor() {
        this.achievements = [
            {
                id: 'first_test',
                condition: results => results.length >= 1,
                icon: '🎯'
            },
            {
                id: 'five_tests',
                condition: results => results.length >= 5,
                icon: '⭐'
            },
            {
                id: 'ten_tests',
                condition: results => results.length >= 10,
                icon: '🏆'
            },
            {
                id: 'big_five_complete',
                condition: results => results.some(r => r.testId === 'big_five'),
                icon: '🧠'
            },
            {
                id: 'all_tests_complete',
                condition: results => {
                    const required = ['big_five', 'anxiety', 'emotional_intelligence', 
                                     'locus_of_control', 'procrastination', 'stress_resistance'];
                    return required.every(testId => results.some(r => r.testId === testId));
                },
                icon: '👑'
            },
            {
                id: 'consistent_tracker',
                condition: results => {
                    if (results.length < 3) return false;
                    const dates = results.map(r => new Date(r.date).getTime());
                    const sorted = dates.sort((a, b) => a - b);
                    // Check if tests were taken on different days
                    const uniqueDays = new Set(sorted.map(d => 
                        new Date(d).toDateString()
                    ));
                    return uniqueDays.size >= 3;
                },
                icon: '📊'
            }
        ];
    }

    /**
     * Get overall progress
     */
    async getProgress() {
        const results = await storage.getTestResults();
        const user = await storage.getUser();

        // Calculate statistics
        const stats = this.calculateStats(results);

        // Get achievements
        const achievements = this.getAchievements(results);

        // Calculate streak
        const streak = this.calculateStreak(results);

        return {
            totalTests: results.length,
            uniqueTests: new Set(results.map(r => r.testId)).size,
            streak,
            achievements,
            stats,
            level: this.calculateLevel(results.length),
            nextMilestone: this.getNextMilestone(results.length)
        };
    }

    /**
     * Calculate statistics
     */
    calculateStats(results) {
        if (results.length === 0) {
            return {
                averageScore: 0,
                totalQuestions: 0,
                totalTime: 0,
                mostTestedTrait: null
            };
        }

        // Average score across all tests
        const allScores = results.flatMap(r => Object.values(r.scores));
        const averageScore = allScores.length > 0
            ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
            : 0;

        // Total questions answered
        const totalQuestions = results.reduce((sum, r) => sum + (r.questionsAnswered || 0), 0);

        // Total time spent
        const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);

        // Most tested trait
        const traitCounts = {};
        results.forEach(r => {
            Object.keys(r.scores).forEach(trait => {
                traitCounts[trait] = (traitCounts[trait] || 0) + 1;
            });
        });
        
        const mostTestedTrait = Object.entries(traitCounts)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            averageScore,
            totalQuestions,
            totalTime,
            mostTestedTrait: mostTestedTrait ? mostTestedTrait[0] : null
        };
    }

    /**
     * Get achievements
     */
    getAchievements(results) {
        const language = i18n.getLanguage();
        
        return this.achievements.map(achievement => ({
            id: achievement.id,
            icon: achievement.icon,
            unlocked: achievement.condition(results),
            title: this.getAchievementTitle(achievement.id, language),
            description: this.getAchievementDescription(achievement.id, language)
        }));
    }

    /**
     * Get achievement title
     */
    getAchievementTitle(id, language) {
        const titles = {
            first_test: { en: 'First Steps', ru: 'Первые шаги' },
            five_tests: { en: 'Getting Serious', ru: 'Серьезный подход' },
            ten_tests: { en: 'Dedicated Explorer', ru: 'Преданный исследователь' },
            big_five_complete: { en: 'Big Five Complete', ru: 'Большая пятерка пройдена' },
            all_tests_complete: { en: 'Full Spectrum', ru: 'Полный спектр' },
            consistent_tracker: { en: 'Consistent Tracker', ru: 'Последовательный аналитик' }
        };
        return titles[id]?.[language] || id;
    }

    /**
     * Get achievement description
     */
    getAchievementDescription(id, language) {
        const descriptions = {
            first_test: { 
                en: 'Complete your first psychological test', 
                ru: 'Пройдите первый психологический тест' 
            },
            five_tests: { 
                en: 'Complete 5 psychological tests', 
                ru: 'Пройдите 5 психологических тестов' 
            },
            ten_tests: { 
                en: 'Complete 10 psychological tests', 
                ru: 'Пройдите 10 психологических тестов' 
            },
            big_five_complete: { 
                en: 'Complete the Big Five personality test', 
                ru: 'Пройдите тест Большая пятерка' 
            },
            all_tests_complete: { 
                en: 'Complete all available tests', 
                ru: 'Пройдите все доступные тесты' 
            },
            consistent_tracker: { 
                en: 'Take tests on 3 different days', 
                ru: 'Проходите тесты в течение 3 разных дней' 
            }
        };
        return descriptions[id]?.[language] || '';
    }

    /**
     * Calculate streak (consecutive days)
     */
    calculateStreak(results) {
        if (results.length === 0) return 0;

        const dates = results
            .map(r => new Date(r.date).toDateString())
            .filter((date, i, arr) => arr.indexOf(date) === i)
            .map(d => new Date(d))
            .sort((a, b) => b - a);

        if (dates.length === 0) return 0;

        let streak = 1;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastTest = new Date(dates[0]);
        lastTest.setHours(0, 0, 0, 0);

        const dayDiff = Math.floor((today - lastTest) / (1000 * 60 * 60 * 24));

        // If last test was more than 1 day ago, streak is broken
        if (dayDiff > 1) return 0;

        for (let i = 0; i < dates.length - 1; i++) {
            const current = new Date(dates[i]);
            const next = new Date(dates[i + 1]);
            const diff = Math.floor((current - next) / (1000 * 60 * 60 * 24));

            if (diff === 1) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Calculate user level
     */
    calculateLevel(totalTests) {
        if (totalTests >= 20) return { level: 5, title: 'Expert' };
        if (totalTests >= 15) return { level: 4, title: 'Advanced' };
        if (totalTests >= 10) return { level: 3, title: 'Intermediate' };
        if (totalTests >= 5) return { level: 2, title: 'Beginner' };
        return { level: 1, title: 'Novice' };
    }

    /**
     * Get next milestone
     */
    getNextMilestone(totalTests) {
        const milestones = [1, 5, 10, 15, 20, 50];
        
        for (const milestone of milestones) {
            if (totalTests < milestone) {
                return {
                    target: milestone,
                    remaining: milestone - totalTests,
                    progress: Math.round((totalTests / milestone) * 100)
                };
            }
        }

        return { target: totalTests, remaining: 0, progress: 100 };
    }

    /**
     * Get weekly progress
     */
    async getWeeklyProgress() {
        const results = await storage.getTestResults();
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const weeklyResults = results.filter(r => new Date(r.date) >= weekAgo);

        // Group by day
        const byDay = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            const key = date.toDateString();
            byDay[key] = 0;
        }

        weeklyResults.forEach(r => {
            const key = new Date(r.date).toDateString();
            if (byDay[key] !== undefined) {
                byDay[key]++;
            }
        });

        return Object.entries(byDay)
            .reverse()
            .map(([date, count]) => ({
                date,
                count
            }));
    }
}

export const progressTracker = new ProgressTracker();
export default progressTracker;
