import { CONFIG } from './config.js';
import { addEvent, getEvents, removeEvent } from './storage.js';
import { handleError } from './errors.js';
import { validateLeaveRequest } from './services.js';

export function handleDateSelect(selectInfo) {
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

export function handleEventClick(clickInfo) {
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

export function loadEvents(info, successCallback, failureCallback) {
    try {
        const events = getEvents();
        successCallback(events);
    } catch (error) {
        console.error('Error loading events:', error);
        failureCallback(error);
    }
}
