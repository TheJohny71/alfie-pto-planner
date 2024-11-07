// Import components and utilities
import { Calendar } from './components/Calendar.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Hide loading spinner
        const loadingElement = document.getElementById('loading');
        const appElement = document.getElementById('app');
        
        if (loadingElement && appElement) {
            loadingElement.style.display = 'none';
            appElement.classList.remove('hidden');
        }

        // Initialize calendar
        const calendar = new Calendar({
            container: appElement,
            initialRegion: 'US'
        });

        calendar.init();
    } catch (error) {
        console.error('Failed to initialize calendar:', error);
        // Show error message to user
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div class="error-message">
                    <p>Failed to load calendar. Please try refreshing the page.</p>
                    <button onclick="location.reload()">Refresh Page</button>
                </div>
            `;
        }
    }
});
