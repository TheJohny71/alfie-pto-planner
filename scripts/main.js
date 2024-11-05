document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const welcomeScreen = document.getElementById('welcome-screen');
    const appInterface = document.getElementById('app');
    const startSetupBtn = document.getElementById('start-setup');
    const requestLeaveBtn = document.getElementById('request-leave');
    const leaveRequestModal = document.getElementById('leave-request-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelRequestBtn = document.querySelector('.cancel-request');

    // Initialize FullCalendar
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
            const calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                selectable: true,
                editable: true,
                events: []
            });
            calendar.render();
        }
    }

    // Event Listeners
    startSetupBtn.addEventListener('click', function() {
        welcomeScreen.classList.add('hidden');
        appInterface.classList.remove('hidden');
        initializeCalendar(); // Initialize calendar after showing the app interface
    });

    requestLeaveBtn?.addEventListener('click', function() {
        leaveRequestModal.style.display = 'block';
    });

    closeModalBtn?.addEventListener('click', function() {
        leaveRequestModal.style.display = 'none';
    });

    cancelRequestBtn?.addEventListener('click', function() {
        leaveRequestModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === leaveRequestModal) {
            leaveRequestModal.style.display = 'none';
        }
    });

    // Handle leave request form submission
    const leaveRequestForm = document.getElementById('leave-request-form');
    leaveRequestForm?.addEventListener('submit', function(event) {
        event.preventDefault();
        // Add leave request handling logic here
        leaveRequestModal.style.display = 'none';
    });
});
