/**
 * INTDWN - Trait Timeline Chart Component
 */

export async function createTraitTimelineChart(containerId, data, options = {}) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const { i18n } = await import('../../core/i18n.js');
    const lang = i18n.getLanguage();

    const colors = [
        'rgba(0, 212, 255, 1)',
        'rgba(0, 102, 255, 1)',
        'rgba(139, 92, 246, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(236, 72, 153, 1)'
    ];

    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)'
                }
            },
            y: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)'
                }
            }
        },
        layout: {
            padding: {
                bottom: 40
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    };

    const datasets = data.traits.map((trait, index) => ({
        label: trait.label,
        data: trait.values,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('1)', '0.1)'),
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6
    }));

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: datasets
        },
        options: { ...defaultOptions, ...options }
    });
}

export function prepareTimelineData(testHistory, scaleLabels, language) {
    if (!testHistory || testHistory.length === 0) {
        return null;
    }

    // Sort by date
    const sorted = [...testHistory].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );

    // Get all unique scales
    const allScales = new Set();
    sorted.forEach(result => {
        Object.keys(result.scores).forEach(scale => allScales.add(scale));
    });

    // Create labels (dates)
    const labels = sorted.map(result => {
        const date = new Date(result.date);
        return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
            month: 'short',
            day: 'numeric'
        });
    });

    // Create datasets for each scale
    const traits = Array.from(allScales).map(scale => {
        const values = sorted.map(result => result.scores[scale] || null);
        return {
            scale,
            label: scaleLabels[scale]?.[`short_${language}`] || 
                   scaleLabels[scale]?.[language] || 
                   scaleLabels[scale]?.en || 
                   scale,
            values
        };
    }).filter(trait => trait.values.some(v => v !== null));

    return {
        labels,
        traits
    };
}
