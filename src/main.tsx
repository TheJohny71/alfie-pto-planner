import React from 'react';
import ReactDOM from 'react-dom/client';
import WelcomePage from './components/welcome/WelcomePage';
import Calendar from './components/calendar/Calendar';
import './styles/main.css';

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const getCurrentPage = () => {
    const path = window.location.pathname;
    const basePath = '/alfie-pto-planner/';
    
    if (path.includes('calendar.html') || path === `${basePath}calendar.html`) {
      return <Calendar />;
    }
    return <WelcomePage />;
  };

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {getCurrentPage()}
    </React.StrictMode>
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
