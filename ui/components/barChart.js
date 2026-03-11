/**
 * INTDWN - Bar Chart Component
 */

import { CHART_COLORS } from '../../core/constants.js';

export function createBarChart(containerId, data, labels, options = {}) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const colors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

    const defaultOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)'
                }
            },
            y: {
                grid: {
                    display: false
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    };

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: { ...defaultOptions, ...options }
    });
}

export function updateBarChart(chart, data, labels) {
    if (!chart) return;
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}
