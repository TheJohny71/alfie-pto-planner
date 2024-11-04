import { CalendarEvent, LeaveRequest } from '../types';
import { StorageManager } from './storage';

export class CalendarManager {
    private calendar: any;

    constructor(element: HTMLElement) {
        this.initializeCalendar(element);
    }

    private initializeCalendar(element: HTMLElement): void {
        this.calendar = new FullCalendar.Calendar(element, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            events: this.getEvents(),
            eventClick: this.handleEventClick.bind(this),
            selectable: true,
            select: this.handleDateSelect.bind(this)
        });

        this.calendar.render();
    }

    private getEvents(): CalendarEvent[] {
        const requests = StorageManager.getLeaveRequests();
        return requests.map(request => this.convertToCalendarEvent(request));
    }

    private convertToCalendarEvent(request: LeaveRequest): CalendarEvent {
        const colors = {
            annual: '#4CAF50',
            sick: '#F44336',
            compassionate: '#2196F3'
        };

        return {
            id: request.id,
            title: `${request.type.charAt(0).toUpperCase() + request.type.slice(1)} Leave`,
            start: request.startDate,
            end: request.endDate,
            color: colors[request.type],
            type: request.type
        };
    }
}
