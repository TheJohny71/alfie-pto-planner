// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    // Initialize SweetAlert2 with theme colors
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#4e54c8',
        color: '#fff'
    });

    // Get DOM elements
    const getStartedBtn = document.querySelector('.btn');
    const loadingElement = document.querySelector('.loading');

    // Handle Get Started button click
    getStartedBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        
        try {
            // Show loading state
            if (loadingElement) loadingElement.style.display = 'block';
            
            // Simulate loading (remove this in production)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Redirect to calendar page
            window.location.href = 'calendar.html';
            
        } catch (error) {
            console.error('Navigation error:', error);
            
            // Show error message
            await Toast.fire({
                icon: 'error',
                title: 'Unable to load calendar. Please try again.'
            });
        } finally {
            // Hide loading state
            if (loadingElement) loadingElement.style.display = 'none';
        }
    });

    // Initialize welcome message
    initializeApp();
});

function initializeApp() {
    // Check if we need to show the welcome message
    const isFirstVisit = !localStorage.getItem('hasVisitedBefore');
    if (isFirstVisit) {
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
