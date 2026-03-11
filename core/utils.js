/**
 * INTDWN - Utility Functions
 */

/**
 * Generate a unique ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Map a value from one range to another
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Format date to locale string
 */
export function formatDate(date, locale = 'en') {
    const d = new Date(date);
    return d.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format relative time
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return formatDate(date);
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
    if (obj === null || obj === undefined) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
}

/**
 * Get random item from array
 */
export function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Calculate percentage
 */
export function percentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Round to decimal places
 */
export function roundTo(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Create element from HTML string
 */
export function createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

/**
 * Wait for specified milliseconds
 */
export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Load JSON file
 */
export async function loadJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load ${path}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading JSON from ${path}:`, error);
        return null;
    }
}

/**
 * Download data as JSON file
 */
export function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Read file as JSON
 */
export function readFileAsJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                resolve(json);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

/**
 * Calculate mean of array
 */
export function mean(array) {
    if (array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(array) {
    if (array.length === 0) return 0;
    const avg = mean(array);
    const squareDiffs = array.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(mean(squareDiffs));
}

/**
 * Normalize value to 0-100 range
 */
export function normalize(value, min, max) {
    return Math.round(((value - min) / (max - min)) * 100);
}
