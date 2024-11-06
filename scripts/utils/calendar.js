document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth'
        },
        selectable: true,
        select: handleDateSelect,
        events: loadEvents,
        eventClick: handleEventClick,
        height: 'auto'
    });

    calendar.render();
});

function handleDateSelect(selectInfo) {
    // Your existing date selection handling code
}

function handleEventClick(clickInfo) {
    // Your existing event click handling code
}

function loadEvents(info, successCallback, failureCallback) {
    try {
        const events = JSON.parse(localStorage.getItem('events')) || [];
        successCallback(events);
    } catch (error) {
        console.error('Error loading events:', error);
        failureCallback(error);
    }
}
