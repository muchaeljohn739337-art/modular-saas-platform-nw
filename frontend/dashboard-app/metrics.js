// Metrics Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
    initializeTimeRangeSelector();
    initializeChartControls();
});

// Initialize all charts
function initializeCharts() {
    // Request Volume Chart
    const requestVolumeCtx = document.getElementById('requestVolumeChart').getContext('2d');
    new Chart(requestVolumeCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [{
                label: 'Requests',
                data: [1200, 1900, 3000, 5000, 4200, 3100, 2100],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Response Time Chart
    const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
    new Chart(responseTimeCtx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [{
                label: 'Response Time (ms)',
                data: [89, 95, 87, 124, 98, 92, 88],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Error Rate Chart
    const errorRateCtx = document.getElementById('errorRateChart').getContext('2d');
    new Chart(errorRateCtx, {
        type: 'bar',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
            datasets: [{
                label: 'Error Rate (%)',
                data: [0.1, 0.2, 0.1, 0.3, 0.2, 0.1, 0.1],
                backgroundColor: '#ef4444'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1
                }
            }
        }
    });

    // User Activity Chart
    const userActivityCtx = document.getElementById('userActivityChart').getContext('2d');
    new Chart(userActivityCtx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'Idle', 'Offline'],
            datasets: [{
                data: [2847, 1234, 567],
                backgroundColor: ['#10b981', '#f59e0b', '#6b7280']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Initialize time range selector
function initializeTimeRangeSelector() {
    const timeButtons = document.querySelectorAll('.time-btn');
    
    timeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            timeButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update charts with new time range
            const range = this.dataset.range;
            updateChartsForTimeRange(range);
        });
    });
}

// Initialize chart controls
function initializeChartControls() {
    const chartButtons = document.querySelectorAll('.chart-btn');
    
    chartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            
            if (icon.classList.contains('fa-download')) {
                // Download chart data
                downloadChartData();
            } else if (icon.classList.contains('fa-expand')) {
                // Expand chart to fullscreen
                expandChart(this.closest('.chart-card'));
            }
        });
    });
}

// Update charts for selected time range
function updateChartsForTimeRange(range) {
    // This would typically make an API call to get new data
    console.log(`Updating charts for range: ${range}`);
    
    // Simulate data update with random values
    updateChartData();
}

// Update chart data (simulation)
function updateChartData() {
    // In a real application, this would fetch new data from an API
    Chart.helpers.each(Chart.instances, function(instance) {
        instance.data.datasets.forEach(function(dataset) {
            dataset.data = dataset.data.map(() => Math.floor(Math.random() * 1000));
        });
        instance.update();
    });
}

// Download chart data
function downloadChartData() {
    // Create CSV content
    let csvContent = "Time,Requests,Response Time,Error Rate\n";
    
    // Add sample data
    const times = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
    times.forEach(time => {
        const requests = Math.floor(Math.random() * 5000);
        const responseTime = Math.floor(Math.random() * 200);
        const errorRate = (Math.random() * 0.5).toFixed(2);
        csvContent += `${time},${requests},${responseTime},${errorRate}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Expand chart to fullscreen
function expandChart(chartCard) {
    if (chartCard.requestFullscreen) {
        chartCard.requestFullscreen();
    } else if (chartCard.webkitRequestFullscreen) {
        chartCard.webkitRequestFullscreen();
    } else if (chartCard.msRequestFullscreen) {
        chartCard.msRequestFullscreen();
    }
}

// Add styles for metrics page
const metricsStyles = `
.metrics-container {
    padding: 2rem;
}

.time-range-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    background: white;
    padding: 0.5rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    width: fit-content;
}

.time-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: #64748b;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.time-btn:hover {
    background: #f1f5f9;
}

.time-btn.active {
    background: #667eea;
    color: white;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.chart-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    overflow: hidden;
}

.chart-card .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.chart-controls {
    display: flex;
    gap: 0.5rem;
}

.chart-btn {
    padding: 0.5rem;
    border: none;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.chart-btn:hover {
    background: #e2e8f0;
    color: #1e293b;
}

.chart-card .card-content {
    padding: 1.5rem;
    height: 300px;
}

.key-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.table-container {
    overflow-x: auto;
}

.performance-table {
    width: 100%;
    border-collapse: collapse;
}

.performance-table th,
.performance-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}

.performance-table th {
    background: #f8fafc;
    font-weight: 600;
    color: #475569;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.performance-table tr:hover {
    background: #f8fafc;
}

@media (max-width: 768px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }
    
    .time-range-selector {
        flex-wrap: wrap;
        width: 100%;
    }
    
    .key-metrics {
        grid-template-columns: repeat(2, 1fr);
    }
}
`;

// Inject metrics styles
const styleSheet = document.createElement('style');
styleSheet.textContent = metricsStyles;
document.head.appendChild(styleSheet);
