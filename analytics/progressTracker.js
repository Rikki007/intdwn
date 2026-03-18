/**
 * INTDWN - Progress Tracker Module
 * Tracks user progress, achievements and motivational milestones
 */

import { storage } from '../core/storage.js';
import { i18n } from '../core/i18n.js';

class ProgressTracker {
    constructor() {
        this.achievements = [
            // Базовые / количественные
            { id: 'first_test',             icon: '🎯', condition: r => r.length >= 1 },
            { id: 'five_tests',             icon: '⭐',  condition: r => r.length >= 5 },
            { id: 'ten_tests',              icon: '🏆',  condition: r => r.length >= 10 },
            { id: 'explorer',               icon: '🔍',  condition: r => new Set(r.map(x => x.testId)).size >= 3 },
            { id: 'deep_diver',             icon: '🪂',  condition: r => {
                const counts = {};
                r.forEach(res => counts[res.testId] = (counts[res.testId] || 0) + 1);
                return Object.values(counts).some(count => count >= 2);
            }},
            { id: 'self_reflection_marathon', icon: '🪞', condition: r => r.length >= 20 },
            { id: 'consistency_streak',     icon: '📊',  condition: r => new Set(r.map(x => new Date(x.date).toDateString())).size >= 3 },

            // Big Five related
            { id: 'big_five_complete',      icon: '🧠',  condition: r => r.some(res => res.testId === 'big_five') },
            { id: 'big_five_expert',        icon: '📈',  condition: r => r.filter(res => res.testId === 'big_five').length >= 3 },

            // Качественные / высокие результаты
            { id: 'balanced_personality',   icon: '⚖️',  condition: r => this.isBalancedBigFive(r) },
            { id: 'zen_master',             icon: '☯️',  condition: r => this.hasHighStressResistance(r) },
            { id: 'emotional_ninja',        icon: '🥷',  condition: r => this.hasHighEmotionalIntelligence(r) },
            { id: 'master_of_time',         icon: '⏳',  condition: r => this.hasLowProcrastination(r) },
            { id: 'internal_locus_legend',  icon: '🧭',  condition: r => this.hasHighInternalLocus(r) },
            { id: 'calm_under_pressure',    icon: '🛡️',  condition: r => this.isCalmUnderPressure(r) },

            // Экстремальные черты Big Five
            { id: 'low_neuroticism',        icon: '🌤️', condition: r => this.hasLowNeuroticism(r) },
            { id: 'high_openness',          icon: '🎨',  condition: r => this.hasHighOpenness(r) },

            // Долгосрочные / временные
            { id: 'six_months_journey',     icon: '📆',  condition: r => this.hasLongTermJourney(r) },
            { id: 'change_seeker',          icon: '🌱',  condition: r => this.hasSignificantChange(r) },

            // Коллекционные
            { id: 'all_tests_complete',     icon: '👑',  condition: r => {
                const required = ['big_five', 'anxiety', 'emotional_intelligence', 
                                 'locus_of_control', 'procrastination', 'stress_resistance'];
                return required.every(id => r.some(res => res.testId === id));
            }}
        ];
    }

    // ────────────────────────────────────────────────
    // Вспомогательные методы для условий ачивок
    // ────────────────────────────────────────────────

    isBalancedBigFive(results) {
        const latest = this.getLatestBigFive(results);
        if (!latest) return false;
        return Object.values(latest.scores).every(v => v >= 35 && v <= 65);
    }

    hasHighStressResistance(results) {
        const latest = this.getLatestResultByTest(results, 'stress_resistance');
        if (!latest) return false;
        return (latest.scores.stress_tolerance || 0) >= 75 || 
               (latest.scores.resilience || 0) >= 75;
    }

    hasHighEmotionalIntelligence(results) {
        const latest = this.getLatestResultByTest(results, 'emotional_intelligence');
        if (!latest) return false;
        const keys = Object.keys(latest.scores);
        if (keys.length === 0) return false;
        const avg = keys.reduce((sum, k) => sum + (latest.scores[k] || 0), 0) / keys.length;
        return avg >= 75;
    }

    hasLowProcrastination(results) {
        const latest = this.getLatestResultByTest(results, 'procrastination');
        if (!latest) return false;
        return (latest.scores.procrastination_tendency || 100) <= 30;
    }

    hasHighInternalLocus(results) {
        const latest = this.getLatestResultByTest(results, 'locus_of_control');
        if (!latest) return false;
        return (latest.scores.internal_locus || 0) >= 80;
    }

    isCalmUnderPressure(results) {
        const anxiety = this.getLatestResultByTest(results, 'anxiety');
        const stress = this.getLatestResultByTest(results, 'stress_resistance');
        if (!anxiety || !stress) return false;
        return (anxiety.scores.anxiety || 100) <= 30 && 
               (stress.scores.stress_tolerance || 0) >= 70;
    }

    hasLowNeuroticism(results) {
        const latest = this.getLatestBigFive(results);
        return latest && (latest.scores.neuroticism || 100) <= 25;
    }

    hasHighOpenness(results) {
        const latest = this.getLatestBigFive(results);
        return latest && (latest.scores.openness || 0) >= 80;
    }

    hasLongTermJourney(results) {
        if (results.length < 2) return false;
        const dates = results.map(r => new Date(r.date).getTime());
        const diffDays = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24);
        return diffDays >= 180;
    }

    hasSignificantChange(results) {
        if (results.length < 2) return false;
        
        const bigFive = results
            .filter(r => r.testId === 'big_five')
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (bigFive.length < 2) return false;

        const curr = bigFive[0].scores;
        const prev = bigFive[1].scores;

        return Object.keys(curr).some(k => Math.abs((curr[k] || 0) - (prev[k] || 0)) >= 15);
    }

    getLatestBigFive(results) {
        return results
            .filter(r => r.testId === 'big_five')
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }

    getLatestResultByTest(results, testId) {
        return results
            .filter(r => r.testId === testId)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    }

    // ────────────────────────────────────────────────
    // Старые методы — возвращаем их обратно
    // ────────────────────────────────────────────────

    async getProgress() {
        const results = await storage.getTestResults();

        return {
            totalTests: results.length,
            uniqueTests: new Set(results.map(r => r.testId)).size,
            streak: this.calculateStreak(results),
            achievements: this.getAchievements(results),
            stats: this.calculateStats(results),
            level: this.calculateLevel(results.length),
            nextMilestone: this.getNextMilestone(results.length)
        };
    }

    getAchievements(results) {
        const lang = i18n.getLanguage();
        
        return this.achievements.map(ach => ({
            id: ach.id,
            icon: ach.icon,
            unlocked: ach.condition(results),
            title: this.getAchievementTitle(ach.id, lang),
            description: this.getAchievementDescription(ach.id, lang)
        }));
    }

    calculateStats(results) {
        if (results.length === 0) {
            return {
                averageScore: 0,
                totalQuestions: 0,
                totalTime: 0,
                mostTestedTrait: null
            };
        }

        const allScores = results.flatMap(r => Object.values(r.scores));
        const averageScore = allScores.length > 0
            ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
            : 0;

        const totalQuestions = results.reduce((sum, r) => sum + (r.questionsAnswered || 0), 0);
        const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0);

        const traitCounts = {};
        results.forEach(r => {
            Object.keys(r.scores).forEach(trait => {
                traitCounts[trait] = (traitCounts[trait] || 0) + 1;
            });
        });
        
        const mostTested = Object.entries(traitCounts)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            averageScore,
            totalQuestions,
            totalTime,
            mostTestedTrait: mostTested ? mostTested[0] : null
        };
    }

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

    calculateLevel(totalTests) {
        if (totalTests >= 20) return { level: 5, title: 'Expert' };
        if (totalTests >= 15) return { level: 4, title: 'Advanced' };
        if (totalTests >= 10) return { level: 3, title: 'Intermediate' };
        if (totalTests >= 5)  return { level: 2, title: 'Beginner' };
        return { level: 1, title: 'Novice' };
    }

    getNextMilestone(totalTests) {
        const milestones = [1, 5, 10, 15, 20, 50];
        
        for (const m of milestones) {
            if (totalTests < m) {
                return {
                    target: m,
                    remaining: m - totalTests,
                    progress: Math.round((totalTests / m) * 100)
                };
            }
        }

        return { target: totalTests, remaining: 0, progress: 100 };
    }

    async getWeeklyProgress() {
        const results = await storage.getTestResults();
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const weekly = results.filter(r => new Date(r.date) >= weekAgo);

        const byDay = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(now - i * 24 * 60 * 60 * 1000);
            byDay[d.toDateString()] = 0;
        }

        weekly.forEach(r => {
            const key = new Date(r.date).toDateString();
            if (key in byDay) byDay[key]++;
        });

        return Object.entries(byDay)
            .reverse()
            .map(([date, count]) => ({ date, count }));
    }

    // ────────────────────────────────────────────────
    // Локализация ачивок
    // ────────────────────────────────────────────────

    getAchievementTitle(id, lang) {
        const map = {
            first_test:                 { en: 'First Steps',                     ru: 'Первые шаги' },
            five_tests:                 { en: 'Getting Serious',                ru: 'Серьёзный подход' },
            ten_tests:                  { en: 'Dedicated Explorer',             ru: 'Преданный исследователь' },
            explorer:                   { en: 'Explorer',                       ru: 'Исследователь' },
            deep_diver:                 { en: 'Deep Diver',                     ru: 'Глубокий ныряльщик' },
            self_reflection_marathon:   { en: 'Self-Reflection Marathon',      ru: 'Марафон самопознания' },
            consistency_streak:         { en: 'Consistent Tracker',            ru: 'Последовательный аналитик' },
            big_five_complete:          { en: 'Big Five Complete',              ru: 'Большая пятёрка пройдена' },
            big_five_expert:            { en: 'Big Five Expert',               ru: 'Эксперт по Большой пятёрке' },
            balanced_personality:       { en: 'Balanced Personality',          ru: 'Сбалансированная личность' },
            zen_master:                 { en: 'Zen Master',                     ru: 'Мастер дзен' },
            emotional_ninja:            { en: 'Emotional Ninja',                ru: 'Эмоциональный ниндзя' },
            master_of_time:             { en: 'Master of Time',                 ru: 'Мастер времени' },
            internal_locus_legend:      { en: 'Internal Locus Legend',         ru: 'Легенда внутреннего локуса' },
            calm_under_pressure:        { en: 'Calm Under Pressure',           ru: 'Спокоен под давлением' },
            low_neuroticism:            { en: 'Rock Solid',                     ru: 'Скала' },
            high_openness:              { en: 'Visionary',                      ru: 'Визионер' },
            six_months_journey:         { en: 'Six Months Journey',             ru: 'Путешествие длиной в полгода' },
            change_seeker:              { en: 'Change Seeker',                  ru: 'Искатель перемен' },
            all_tests_complete:         { en: 'Full Spectrum',                  ru: 'Полный спектр' }
        };
        return map[id]?.[lang] || id;
    }

    getAchievementDescription(id, lang) {
        const map = {
            first_test:                 { en: 'Complete your first psychological test', ru: 'Пройдите первый психологический тест' },
            explorer:                   { en: 'Completed at least 3 different tests',   ru: 'Пройдено минимум 3 разных теста' },
            deep_diver:                 { en: 'Repeated any test at least twice',       ru: 'Пройден один тест минимум 2 раза' },
            self_reflection_marathon:   { en: 'Completed 20 or more tests total',       ru: 'Пройдено 20+ тестов всего' },
            balanced_personality:       { en: 'All Big Five traits between 35–65%',     ru: 'Все шкалы Big Five в диапазоне 35–65%' },
            zen_master:                 { en: 'High stress tolerance or resilience',    ru: 'Высокая стрессоустойчивость или резилиентность' },
            emotional_ninja:            { en: 'Emotional Intelligence average ≥ 75%',   ru: 'Средний эмоциональный интеллект ≥ 75%' },
            master_of_time:             { en: 'General procrastination ≤ 30%',          ru: 'Общая прокрастинация ≤ 30%' },
            internal_locus_legend:      { en: 'Internal locus of control ≥ 80%',       ru: 'Внутренний локус контроля ≥ 80%' },
            calm_under_pressure:        { en: 'Low anxiety + high stress tolerance',   ru: 'Низкая тревожность + высокая стрессоустойчивость' },
            low_neuroticism:            { en: 'Neuroticism ≤ 25% in latest Big Five',   ru: 'Нейротизм ≤ 25% в последнем Big Five' },
            high_openness:              { en: 'Openness ≥ 80% in latest Big Five',      ru: 'Открытость опыту ≥ 80% в последнем Big Five' },
            six_months_journey:         { en: 'Testing journey spans 6+ months',        ru: 'Путешествие самопознания длится 6+ месяцев' },
            change_seeker:              { en: 'At least one trait changed by ±15% or more', ru: 'Хотя бы одна шкала изменилась на ±15% и более' },
            // остальные можно дополнить по желанию
        };
        return map[id]?.[lang] || '';
    }
}

export const progressTracker = new ProgressTracker();
export default progressTracker;