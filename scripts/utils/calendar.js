// Version 2.0 - Updated Calendar Service
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CONFIG } from './config';
export class CalendarService {
    static initializeCalendar(element, events, onSelect) {
        return new Calendar(element, {
            plugins: [dayGridPlugin],
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            selectable: true,
            editable: true,
            events: this.convertRequestsToEvents(events),
            select: (info) => {
                onSelect(info.start, info.end);
            }
        });
    }
    static convertRequestsToEvents(requests) {
        return requests.map(request => ({
            title: `${request.type} Leave (${request.status})`,
            start: request.startDate,
            end: request.endDate,
            backgroundColor: CONFIG.COLORS[request.type]
        }));
    }
    static calculateBusinessDays(start, end) {
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            if (current.getDay() !== 0 && current.getDay() !== 6) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    }
}
