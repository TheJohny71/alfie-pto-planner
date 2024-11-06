// Main JavaScript as a module
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initializeUI();
    
    // Check for first visit
    showWelcomeMessage();
});

function initializeUI() {
    const getStartedBtn = document.querySelector('.btn');
    const loadingElement = document.querySelector('.loading');

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', async () => {
            try {
                // Show loading spinner
                if (loadingElement) {
                    loadingElement.style.display = 'block';
                }

                // Simulate loading delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Navigate to calendar
                window.location.href = 'calendar.html';
            } catch (error) {
                console.error('Navigation error:', error);
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                }
            }
        });
    }
}

function showWelcomeMessage() {
    if (!localStorage.getItem('hasVisitedBefore')) {
        Swal.fire({
            title: 'Welcome to Alfie!',
            text: 'Let\'s help you plan your time off.',
            icon: 'info',
            confirmButtonText: 'Get Started',
            confirmButtonColor: '#4e54c8',
            background: '#fff'
        });
        localStorage.setItem('hasVisitedBefore', 'true');
    }
}
