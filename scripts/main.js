// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Hide loading spinner
        const loadingElement = document.getElementById('loading');
        const appElement = document.getElementById('app');
        
        if (loadingElement && appElement) {
            // For now, just hide loading and show a basic message
            loadingElement.style.display = 'none';
            appElement.classList.remove('hidden');
            appElement.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h1>PTO Calendar</h1>
                    <p>Calendar component is being initialized...</p>
                </div>
            `;
        }
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
