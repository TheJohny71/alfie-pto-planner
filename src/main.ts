// src/main.ts
import { Calendar } from './components/Calendar';

document.addEventListener('DOMContentLoaded', () => {
    const loadingEl = document.getElementById('loading');
    
    try {
        const calendar = new Calendar('calendar-container');
        // Remove loading message once calendar is initialized
        if (loadingEl) {
            loadingEl.remove();
        }
    } catch (error) {
        console.error('Failed to initialize calendar:', error);
        if (loadingEl) {
            loadingEl.textContent = 'Failed to load calendar. Please try again.';
        }
    }
});
