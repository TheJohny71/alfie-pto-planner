document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    setupFormHandlers();
});

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        events: loadEvents(),
        editable: false,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        select: function(info) {
            const modal = document.getElementById('leaveRequestModal');
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');
            
            startDateInput.value = info.startStr;
            endDateInput.value = info.endStr;
            
            modal.style.display = 'block';
        }
    });

    calendar.render();
}

function setupFormHandlers() {
    const openFormBtn = document.getElementById('openFormBtn');
    const modal = document.getElementById('leaveRequestModal');
    const form = document.getElementById('leaveRequestForm');

    if (openFormBtn) {
        openFormBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const request = {
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        type: formData.get('leaveType'),
        description: formData.get('description')
    };

    // Save the request
    saveEvent(request);

    // Show success message
    Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Leave request has been submitted.',
        showConfirmButton: false,
        timer: 1500
    });

    // Reset form and close modal
    event.target.reset();
    document.getElementById('leaveRequestModal').style.display = 'none';
}

function loadEvents() {
    const savedEvents = localStorage.getItem('leaveRequests');
    return savedEvents ? JSON.parse(savedEvents) : [];
}

function saveEvent(event) {
    const events = loadEvents();
    events.push({
        ...event,
        id: Date.now(),
        title: event.type,
        start: event.startDate,
        end: event.endDate,
        backgroundColor: getEventColor(event.type)
    });
    localStorage.setItem('leaveRequests', JSON.stringify(events));
}

function getEventColor(type) {
    const colors = {
        vacation: '#4CAF50',
        sick: '#F44336',
        personal: '#2196F3'
    };
    return colors[type] || '#9E9E9E';
}
