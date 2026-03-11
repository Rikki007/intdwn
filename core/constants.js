/**
 * INTDWN - Application Constants
 */

export const APP_NAME = 'INTDWN';
export const APP_VERSION = '1.0.0';

export const DB_NAME = 'psychology_app_db';
export const DB_VERSION = 1;

export const STORES = {
    USER: 'user',
    TEST_RESULTS: 'tests_results',
    SETTINGS: 'settings'
};

export const SUPPORTED_LANGUAGES = ['en', 'ru'];
export const DEFAULT_LANGUAGE = 'en';

export const ANSWER_SCALE = {
    STRONGLY_DISAGREE: 1,
    DISAGREE: 2,
    NEUTRAL: 3,
    AGREE: 4,
    STRONGLY_AGREE: 5
};

export const ANSWER_LABELS = {
    en: {
        1: 'Strongly Disagree',
        2: 'Disagree',
        3: 'Neutral',
        4: 'Agree',
        5: 'Strongly Agree'
    },
    ru: {
        1: 'Полностью не согласен',
        2: 'Не согласен',
        3: 'Нейтрально',
        4: 'Согласен',
        5: 'Полностью согласен'
    }
};

export const TRAIT_LEVELS = {
    LOW: { min: 0, max: 30, label: 'low' },
    MEDIUM: { min: 30, max: 70, label: 'medium' },
    HIGH: { min: 70, max: 100, label: 'high' }
};

export const TEST_CONFIG = {
    MIN_QUESTIONS: 15,
    MAX_QUESTIONS: 35,
    CONFIDENCE_THRESHOLD: 0.85
};

export const COLORS = {
    primary: {
        cyan: '#00d4ff',
        blue: '#0066ff',
        violet: '#8b5cf6',
        purple: '#a855f7'
    },
    background: {
        primary: '#0a0a1a',
        secondary: '#0f0f2a',
        tertiary: '#151530'
    },
    text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        tertiary: 'rgba(255, 255, 255, 0.5)'
    },
    status: {
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
    }
};

export const CHART_COLORS = [
    'rgba(0, 212, 255, 0.8)',
    'rgba(0, 102, 255, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(34, 211, 238, 0.8)'
];

export const VIEWS = {
    HOME: 'home',
    TESTS: 'tests',
    PROFILE: 'profile',
    ABOUT: 'about',
    ONBOARDING: 'onboarding',
    TEST_RUNNER: 'test-runner',
    RESULTS: 'results'
};

export const EVENTS = {
    ROUTE_CHANGE: 'route:change',
    TEST_START: 'test:start',
    TEST_ANSWER: 'test:answer',
    TEST_COMPLETE: 'test:complete',
    PROFILE_UPDATE: 'profile:update',
    LANGUAGE_CHANGE: 'language:change',
    STORAGE_READY: 'storage:ready'
};
