/**
 * INTDWN - Radar Chart Component
 */

import { CHART_COLORS } from '../../core/constants.js';

export function createRadarChart(containerId, data, labels, options = {}) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    stepSize: 20,
                    color: 'rgba(255, 255, 255, 0.5)',
                    backdropColor: 'transparent'
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                angleLines: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                pointLabels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: {
                        size: 12
                    }
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
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: 'rgba(0, 212, 255, 0.2)',
                borderColor: 'rgba(0, 212, 255, 0.8)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(0, 212, 255, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(0, 212, 255, 1)'
            }]
        },
        options: { ...defaultOptions, ...options }
    });
}

export function updateRadarChart(chart, data, labels) {
    if (!chart) return;
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
}
