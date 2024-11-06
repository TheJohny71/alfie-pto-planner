// Initialize calendar when DOM is ready
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
    // Show leave request form
    Swal.fire({
        title: 'Request Leave',
        html: `
            <input type="text" id="title" class="swal2-input" placeholder="Leave description">
            <input type="number" id="days" class="swal2-input" placeholder="Number of days" min="1" max="14">
        `,
        showCancelButton: true,
        confirmButtonText: 'Submit Request',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            const title = document.getElementById('title').value;
            const days = parseInt(document.getElementById('days').value);
            
            if (!title || !days) {
                Swal.showValidationMessage('Please fill in all fields');
                return false;
            }
            
            if (days < CONFIG.MIN_LEAVE_DAYS || days > CONFIG.MAX_LEAVE_DAYS) {
                Swal.showValidationMessage(`Leave days must be between ${CONFIG.MIN_LEAVE_DAYS} and ${CONFIG.MAX_LEAVE_DAYS}`);
                return false;
            }
            
            return { title, days };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const event = {
                id: Date.now().toString(),
                title: result.value.title,
                start: selectInfo.startStr,
                end: selectInfo.endStr,
                days: result.value.days
            };
            
            addEvent(event);
            selectInfo.view.calendar.addEvent(event);
        }
    });
}

function handleEventClick(clickInfo) {
    Swal.fire({
        title: 'Leave Request Details',
        html: `
            <p><strong>Description:</strong> ${clickInfo.event.title}</p>
            <p><strong>Start:</strong> ${clickInfo.event.startStr}</p>
            <p><strong>End:</strong> ${clickInfo.event.endStr}</p>
            <p><strong>Days:</strong> ${clickInfo.event.extendedProps.days}</p>
        `,
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Delete Request'
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            removeEvent(clickInfo.event.id);
            clickInfo.event.remove();
        }
    });
}

function loadEvents(info, successCallback, failureCallback) {
    try {
        const events = getEvents();
        successCallback(events);
    } catch (error) {
        console.error('Error loading events:', error);
        failureCallback(error);
    }
}
