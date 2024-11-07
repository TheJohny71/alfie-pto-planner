import Calendar from './components/Calendar.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Get DOM elements
        const loadingElement = document.getElementById('loading');
        const appElement = document.getElementById('app');
        const errorContainer = document.getElementById('error-container');

        if (!loadingElement || !appElement) {
            throw new Error('Required DOM elements not found');
        }

        // Hide loading spinner
        loadingElement.style.display = 'none';
        appElement.classList.remove('hidden');

        // Initialize calendar
        window.calendar = new Calendar(appElement);
        window.calendar.render();

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
