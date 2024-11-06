// main.js - no imports needed
document.addEventListener('DOMContentLoaded', function() {
    const getStartedBtn = document.querySelector('.btn');
    const loadingElement = document.querySelector('.loading');

    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', () => {
            // Show loading spinner
            if (loadingElement) {
                loadingElement.style.display = 'block';
            }

            // Navigate to calendar after a short delay
            setTimeout(() => {
                window.location.href = 'calendar.html';
            }, 1000);
        });
    }

    // First visit welcome message
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
});
