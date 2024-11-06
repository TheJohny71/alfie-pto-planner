import { CONFIG } from './utils/config.js';
import { handleError } from './utils/errors.js';

// Add error handling for uncaught errors
window.addEventListener('error', (event) => {
    handleError(new Error(event.message));
});

// Add debugging information
console.log('App initialized with config:', CONFIG);

// Add global error handler for promises
window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason);
});
