   // Version 2.0 - Updated Calendar Service
// File: src/utils/calendar.ts

import { HolidayCalculator } from './holidayCalculator';
import { Holiday } from '../types/holidays';

export class Calendar {
    // [Previous Calendar code goes here]
    // Copy the entire Calendar class from the earlier code
}
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { LeaveRequest, CalendarEvent } from '../types';
import { CONFIG } from './config';

export class CalendarService {
    static initializeCalendar(
        element: HTMLElement,
        events: LeaveRequest[],
        onSelect: (start: Date, end: Date) => void
    ): Calendar {
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

    static convertRequestsToEvents(requests: LeaveRequest[]): CalendarEvent[] {
        return requests.map(request => ({
            title: `${request.type} Leave (${request.status})`,
            start: request.startDate,
            end: request.endDate,
            backgroundColor: CONFIG.COLORS[request.type]
        }));
    }

    static calculateBusinessDays(start: Date, end: Date): number {
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
