// scripts/main.js
document.addEventListener('DOMContentLoaded', () => {
    try {
        const loadingElement = document.getElementById('loading');
        const appElement = document.getElementById('app');

        if (!loadingElement || !appElement) {
            throw new Error('Required DOM elements not found');
        }

        // Initialize calendar
        const calendar = new Calendar(appElement);
        calendar.init();

        // Hide loading spinner
        loadingElement.style.display = 'none';
        appElement.classList.remove('hidden');

    } catch (error) {
        console.error('Failed to initialize:', error);
        const errorContainer = document.getElementById('error-container');
        const errorDetails = document.getElementById('error-details');
        
        if (errorContainer && errorDetails) {
            errorDetails.textContent = error.message || 'Failed to initialize application';
            errorContainer.style.display = 'block';
        }
    }
});
