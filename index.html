document.addEventListener('DOMContentLoaded', function() {
    // Element references
    const ptoForm = document.getElementById('ptoForm');
    const submitFormBtn = document.getElementById('submitFormBtn');
    const calendarContainer = document.getElementById('calendarContainer');
    const calendarEl = document.getElementById('calendar');
    const leaveSummary = document.getElementById('leaveSummary');
    const leaveSummaryContent = document.getElementById('leaveSummaryContent');
    const downloadPDFBtn = document.getElementById('downloadPDFBtn');
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');

    // Debug check for calendar element
    if (!calendarEl) {
        console.error('Calendar element not found. Please check the HTML structure.');
        return;
    }

    let calendar = null; // Global calendar reference

    // Initialize calendar on page load
    function initializeCalendar() {
        try {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                },
                selectable: true,
                selectMirror: true,
                weekends: true,
                height: 'auto',
                displayEventTime: false,
                dayCellDidMount: function(info) {
                    const day = info.date.getDay();
                    if (day === 0 || day === 6) {
                        info.el.style.backgroundColor = '#f8d7da';
                    }
                },
                select: handleDateSelection,
                eventClick: handleEventClick
            });

            calendar.render();
            console.log('Calendar initialized successfully');
        } catch (error) {
            console.error('Error initializing calendar:', error);
        }
    }

    // Call initialize after everything is loaded
    initializeCalendar();

    // ... rest of your JavaScript code ...
});
