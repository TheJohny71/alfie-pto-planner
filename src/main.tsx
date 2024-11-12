import React from 'react';
import ReactDOM from 'react-dom/client';
import WelcomePage from './components/welcome/WelcomePage';
import { Calendar } from './components/calendar/Calendar';
import './styles/main.css';
import './styles/components/gradients.css';

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const CalendarPage: React.FC = () => {
    const calendarRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (calendarRef.current) {
        try {
          const calendar = new Calendar('calendar-container');
          return () => {
            // Cleanup logic if needed
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

  const getCurrentPage = () => {
    const path = window.location.pathname;
    const basePath = import.meta.env.BASE_URL;
    if (path.includes('calendar.html') || path === `${basePath}calendar.html`) {
      return <CalendarPage />;
    }
    return <WelcomePage />;
  };

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <div className="app-container">
        {getCurrentPage()}
      </div>
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}

export { renderApp };
