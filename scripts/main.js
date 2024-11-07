// Basic initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Get DOM elements
        const loadingElement = document.getElementById('loading');
        const appElement = document.getElementById('app');
        const errorContainer = document.getElementById('error-container');

        // Hide loading, show app
        if (loadingElement && appElement) {
            loadingElement.style.display = 'none';
            appElement.classList.remove('hidden');
            
            // Display initial content
            appElement.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h1>PTO Calendar</h1>
                    <p>Calendar component is being initialized...</p>
                    <div>
                        <small>Version: 1.0.0</small>
                    </div>
                </div>
            `;
        }
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
