import React from 'react';
import ReactDOM from 'react-dom/client';
import WelcomePage from './components/welcome/WelcomePage';
import { Calendar } from './components/calendar/Calendar';
import './styles/main.css';
import './styles/components/gradients.css';  // Add this import

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  // Create a component to handle calendar page
  const CalendarPage: React.FC = () => {
    const calendarRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (calendarRef.current) {
        try {
          const calendar = new Calendar('calendar-container');
          
          // Cleanup on unmount
          return () => {
            // Add any cleanup needed for calendar
          };
        } catch (error) {
          console.error('Failed to initialize calendar:', error);
          const loadingEl = document.getElementById('loading');
          if (loadingEl) {
            loadingEl.textContent = 'Failed to load calendar. Please try again.';
          }
        }
      }
    }, []);

    return (
      <div className="calendar-page">
        <div id="loading">Loading calendar...</div>
        <div id="calendar-container" ref={calendarRef}></div>
      </div>
    );
  };

  // Determine which page to render based on URL
  const getCurrentPage = () => {
    const path = window.location.pathname;
    // Updated to handle base path for GitHub Pages
    const basePath = '/alfie-pto-planner';
    if (path.includes('calendar.html') || path === `${basePath}/calendar.html`) {
      return <CalendarPage />;
    }
    return <WelcomePage />;
  };

  // Render the appropriate page
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <div className="app-container">
        {getCurrentPage()}
      </div>
    </React.StrictMode>
  );
};

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}

// Export for development/testing
export { renderApp };
