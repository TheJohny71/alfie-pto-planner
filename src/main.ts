import React from 'react';
import ReactDOM from 'react-dom/client';
import WelcomePage from './components/welcome/WelcomePage';
import { Calendar } from './components/calendar/Calendar';
import './styles/main.css';

document.addEventListener('DOMContentLoaded', () => {
    // Handle welcome page rendering (index.html)
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        const rootElement = document.getElementById('root');
        if (rootElement) {
            ReactDOM.createRoot(rootElement).render(
                <React.StrictMode>
                    <WelcomePage />
                </React.StrictMode>
            );
        }
    }

    // Handle calendar page (calendar.html)
    if (window.location.pathname.includes('calendar.html')) {
        const loadingEl = document.getElementById('loading');
        const calendarContainer = document.getElementById('calendar-container');
        
        try {
            if (calendarContainer) {
                const calendar = new Calendar('calendar-container');
            }
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
    }
});
