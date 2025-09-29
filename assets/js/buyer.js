<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quickflip Buyer Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="assets/css/style.css?v=2">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#1976d2">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="QuickFlip">
  <link rel="apple-touch-icon" href="assets/images/apple-touch-icon.svg">
  <link rel="icon" href="assets/images/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="assets/images/icon-192.svg" type="image/svg+xml" sizes="192x192">
  <link rel="shortcut icon" href="assets/images/favicon.svg" type="image/svg+xml">
</head>
<body>
  <div id="root"></div>
  
  <!-- React and your bundle scripts -->
  <script src="path/to/your/react/bundle.js"></script>
  
  <script>
    /**
 * Quickflip Buyer Dashboard JavaScript
 * Handles dashboard functionality and data management
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize buyer dashboard
    initializeBuyerDashboard();
});

function initializeBuyerDashboard() {
    // Load saved data
    loadDashboardStats();
    loadUserProfile();
    setupEventListeners();
    
    // Auto-refresh stats every 30 seconds
    setInterval(loadDashboardStats, 30000);
}

function loadDashboardStats() {
    const stats = getBuyerStats();
    
    // Update dashboard elements if they exist
    updateElement('invoicesReceived', stats.invoicesReceived);
    updateElement('invoicesSettled', stats.invoicesSettled);
    updateElement('amountPaid', '$' + stats.amountPaid.toLocaleString());
    updateElement('amountPending', '$' + stats.amountPending.toLocaleString());
}

function getBuyerStats() {
    // Get stats from localStorage or return defaults
    const savedStats = localStorage.getItem('quickflip_buyer_stats');
    if (savedStats) {
        return JSON.parse(savedStats);
    }
    
    // Default demo stats
    return {
        invoicesReceived: 24,
        invoicesSettled: 18,
        amountPaid: 45750,
        amountPending: 12300
    };
}

function saveBuyerStats(stats) {
    localStorage.setItem('quickflip_buyer_stats', JSON.stringify(stats));
}

function loadUserProfile() {
    const profile = localStorage.getItem('quickflip_user_profile');
    if (profile) {
        return JSON.parse(profile);
    }
    return null;
}

function saveUserProfile(profile) {
    localStorage.setItem('quickflip_user_profile', JSON.stringify(profile));
}

function updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function setupEventListeners() {
    // Add event listeners for interactive elements
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('submit', handleFormSubmission);
}

function handleGlobalClick(event) {
    // Handle various click events
    const target = event.target;
    
    if (target.classList.contains('stat-card')) {
        // Animate stat card on click
        target.style.transform = 'scale(0.95)';
        setTimeout(() => {
            target.style.transform = '';
        }, 150);
    }
}

function handleFormSubmission(event) {
    // Handle form submissions
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Process form based on its purpose
    if (form.classList.contains('profile-form')) {
        handleProfileUpdate(formData);
    } else if (form.classList.contains('subscription-form')) {
        handleSubscriptionUpdate(formData);
    }
}

function handleProfileUpdate(formData) {
    const profile = {};
    for (let [key, value] of formData.entries()) {
        profile[key] = value;
    }
    
    saveUserProfile(profile);
    showMessage('Profile updated successfully!');
}

function handleSubscriptionUpdate(formData) {
    const subscription = {};
    for (let [key, value] of formData.entries()) {
        subscription[key] = value;
    }
    
    localStorage.setItem('quickflip_subscription', JSON.stringify(subscription));
    showMessage('Subscription updated successfully!');
}

function showMessage(message, type = 'success') {
    // Create and show message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Export functions for global use
window.loadDashboardStats = loadDashboardStats;
window.getBuyerStats = getBuyerStats;
window.saveBuyerStats = saveBuyerStats;
window.showMessage = showMessage;
  </script>
</body>
</html>