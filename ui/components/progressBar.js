/**
 * INTDWN - Progress Bar Component
 */

export function createProgressBar(value, options = {}) {
    const {
        showLabel = true,
        animated = true,
        color = 'gradient',
        size = 'md'
    } = options;

    const sizeClasses = {
        sm: '4px',
        md: '8px',
        lg: '12px'
    };

    const height = sizeClasses[size] || sizeClasses.md;

    return `
        <div class="progress-container">
            ${showLabel ? `
                <div class="progress-header">
                    <span class="progress-label">${options.label || ''}</span>
                    <span class="progress-value">${value}%</span>
                </div>
            ` : ''}
            <div class="progress-bar" style="height: ${height}">
                <div class="progress-bar-fill" 
                     style="width: ${animated ? '0' : value}%; 
                            ${color === 'gradient' ? 'background: var(--gradient-primary);' : `background: ${color};`}"
                     ${animated ? `data-target="${value}"` : ''}>
                </div>
            </div>
        </div>
    `;
}

export function animateProgressBars() {
    const bars = document.querySelectorAll('.progress-bar-fill[data-target]');
    
    bars.forEach(bar => {
        const target = bar.dataset.target;
        setTimeout(() => {
            bar.style.transition = 'width 0.5s ease-out';
            bar.style.width = `${target}%`;
        }, 100);
    });
}

export function createCircularProgress(value, size = 120, strokeWidth = 8) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return `
        <div class="circular-progress" style="width: ${size}px; height: ${size}px;">
            <svg viewBox="0 0 ${size} ${size}">
                <circle
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    stroke-width="${strokeWidth}"
                />
                <circle
                    cx="${size / 2}"
                    cy="${size / 2}"
                    r="${radius}"
                    fill="none"
                    stroke="url(#progressGradient)"
                    stroke-width="${strokeWidth}"
                    stroke-linecap="round"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="${offset}"
                    transform="rotate(-90 ${size / 2} ${size / 2})"
                    style="transition: stroke-dashoffset 0.5s ease"
                />
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color: #00d4ff"/>
                        <stop offset="100%" style="stop-color: #8b5cf6"/>
                    </linearGradient>
                </defs>
            </svg>
            <div class="circular-progress-value">${value}%</div>
        </div>
    `;
}
