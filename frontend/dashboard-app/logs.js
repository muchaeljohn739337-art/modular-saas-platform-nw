// Logs Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeLogControls();
    initializeLogFilters();
    initializePagination();
    initializeAutoRefresh();
});

// Initialize log controls
function initializeLogControls() {
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    refreshBtn.addEventListener('click', refreshLogs);
    exportBtn.addEventListener('click', exportLogs);
    searchBtn.addEventListener('click', searchLogs);
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchLogs();
        }
    });
}

// Initialize log filters
function initializeLogFilters() {
    const logLevel = document.getElementById('logLevel');
    const service = document.getElementById('service');
    const timeRange = document.getElementById('timeRange');

    logLevel.addEventListener('change', applyFilters);
    service.addEventListener('change', applyFilters);
    timeRange.addEventListener('change', applyFilters);
}

// Initialize pagination
function initializePagination() {
    const pageButtons = document.querySelectorAll('.page-btn');
    
    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled && !this.querySelector('.fa-chevron-left') && !this.querySelector('.fa-chevron-right')) {
                // Remove active class from all buttons
                pageButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                this.classList.add('active');
                
                // Load logs for selected page
                const page = this.textContent;
                loadLogsForPage(page);
            }
        });
    });
}

// Initialize auto-refresh
function initializeAutoRefresh() {
    // Auto-refresh logs every 30 seconds
    setInterval(refreshLogs, 30000);
}

// Refresh logs
function refreshLogs() {
    const refreshBtn = document.getElementById('refreshBtn');
    const icon = refreshBtn.querySelector('i');
    
    // Add spinning animation
    icon.style.animation = 'spin 1s linear infinite';
    
    // Simulate API call
    setTimeout(() => {
        updateLogEntries();
        updateLogStats();
        
        // Remove spinning animation
        icon.style.animation = '';
        
        // Show success message
        showNotification('Logs refreshed successfully', 'success');
    }, 1000);
}

// Export logs
function exportLogs() {
    const logEntries = document.querySelectorAll('.log-entry');
    let csvContent = 'Timestamp,Level,Service,Source,Message\n';
    
    logEntries.forEach(entry => {
        const timestamp = entry.querySelector('.log-timestamp').textContent;
        const level = entry.querySelector('.log-level').textContent;
        const service = entry.querySelector('.log-service').textContent;
        const source = entry.querySelector('.log-source').textContent;
        const message = entry.querySelector('.log-message').textContent;
        
        csvContent += `"${timestamp}","${level}","${service}","${source}","${message}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Logs exported successfully', 'success');
}

// Search logs
function searchLogs() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const logEntries = document.querySelectorAll('.log-entry');
    
    logEntries.forEach(entry => {
        const message = entry.querySelector('.log-message').textContent.toLowerCase();
        const service = entry.querySelector('.log-service').textContent.toLowerCase();
        
        if (message.includes(searchTerm) || service.includes(searchTerm)) {
            entry.style.display = 'block';
        } else {
            entry.style.display = 'none';
        }
    });
}

// Apply filters
function applyFilters() {
    const logLevel = document.getElementById('logLevel').value;
    const service = document.getElementById('service').value;
    const logEntries = document.querySelectorAll('.log-entry');
    
    logEntries.forEach(entry => {
        let show = true;
        
        // Filter by log level
        if (logLevel !== 'all') {
            const entryLevel = entry.querySelector('.log-level').textContent.toLowerCase();
            if (entryLevel !== logLevel) {
                show = false;
            }
        }
        
        // Filter by service
        if (service !== 'all') {
            const entryService = entry.querySelector('.log-service').textContent;
            if (entryService !== service) {
                show = false;
            }
        }
        
        entry.style.display = show ? 'block' : 'none';
    });
}

// Load logs for specific page
function loadLogsForPage(page) {
    // Simulate loading logs for different pages
    console.log(`Loading logs for page ${page}`);
    
    // In a real application, this would make an API call
    setTimeout(() => {
        updateLogEntries();
        showNotification(`Loaded page ${page}`, 'info');
    }, 500);
}

// Update log entries (simulation)
function updateLogEntries() {
    // In a real application, this would fetch new data from an API
    const logEntries = document.querySelectorAll('.log-entry');
    
    logEntries.forEach(entry => {
        // Add a subtle animation to indicate update
        entry.style.backgroundColor = '#f0f9ff';
        setTimeout(() => {
            entry.style.backgroundColor = '';
        }, 1000);
    });
}

// Update log statistics
function updateLogStats() {
    // Simulate updating statistics
    const statValues = document.querySelectorAll('.stat-value');
    
    statValues.forEach(stat => {
        const currentValue = parseInt(stat.textContent.replace(',', ''));
        const change = Math.floor(Math.random() * 10) - 5; // Random change between -5 and +5
        const newValue = Math.max(0, currentValue + change);
        
        // Animate the number change
        animateValue(stat, currentValue, newValue, 500);
    });
}

// Animate number changes
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f59e0b';
            break;
        default:
            notification.style.backgroundColor = '#3b82f6';
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add styles for logs page
const logsStyles = `
.logs-container {
    padding: 2rem;
}

.log-controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    align-items: center;
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.control-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.control-group label {
    font-weight: 500;
    color: #475569;
    font-size: 0.875rem;
}

.control-group select,
.control-group input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
}

.control-group input {
    width: 200px;
}

.control-group button {
    padding: 0.5rem 0.75rem;
    border: none;
    background: #667eea;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.control-group button:hover {
    background: #5a67d8;
}

.control-actions {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
}

.btn-primary {
    padding: 0.5rem 1rem;
    border: none;
    background: #667eea;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
}

.btn-primary:hover {
    background: #5a67d8;
}

.btn-secondary {
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    background: white;
    color: #475569;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-secondary:hover {
    background: #f8fafc;
    border-color: #9ca3af;
}

.log-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-card.error {
    border-left: 4px solid #ef4444;
}

.stat-card.warning {
    border-left: 4px solid #f59e0b;
}

.stat-card.info {
    border-left: 4px solid #3b82f6;
}

.stat-card.debug {
    border-left: 4px solid #6b7280;
}

.stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
}

.stat-card.error .stat-icon {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.stat-card.warning .stat-icon {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
}

.stat-card.info .stat-icon {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
}

.stat-card.debug .stat-icon {
    background: rgba(107, 114, 128, 0.1);
    color: #6b7280;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
}

.stat-label {
    font-size: 0.875rem;
    color: #64748b;
}

.log-entries {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    overflow: hidden;
    margin-bottom: 2rem;
}

.log-entry {
    border-bottom: 1px solid #e2e8f0;
    transition: background-color 0.2s ease;
}

.log-entry:last-child {
    border-bottom: none;
}

.log-entry:hover {
    background: #f8fafc;
}

.log-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    font-size: 0.875rem;
    flex-wrap: wrap;
}

.log-timestamp {
    color: #64748b;
    font-family: 'Courier New', monospace;
}

.log-level {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
}

.log-level.error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.log-level.warning {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
}

.log-level.info {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
}

.log-level.debug {
    background: rgba(107, 114, 128, 0.1);
    color: #6b7280;
}

.log-service {
    color: #475569;
    font-weight: 500;
}

.log-source {
    color: #64748b;
    font-family: 'Courier New', monospace;
}

.log-message {
    padding: 0 1.5rem 1rem;
    color: #1e293b;
    line-height: 1.5;
}

.log-details {
    padding: 0 1.5rem 1rem;
    display: none;
}

.log-entry:hover .log-details {
    display: block;
}

.log-stack-trace pre {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #64748b;
    overflow-x: auto;
    border: 1px solid #e2e8f0;
}

.pagination {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
}

.page-btn {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    background: white;
    color: #475569;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    min-width: 40px;
}

.page-btn:hover:not(:disabled) {
    background: #f8fafc;
    border-color: #9ca3af;
}

.page-btn.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

@media (max-width: 768px) {
    .log-controls {
        flex-direction: column;
        align-items: stretch;
    }
    
    .control-actions {
        margin-left: 0;
        margin-top: 1rem;
    }
    
    .log-stats {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .log-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}
`;

// Inject logs styles
const styleSheet = document.createElement('style');
styleSheet.textContent = logsStyles;
document.head.appendChild(styleSheet);
