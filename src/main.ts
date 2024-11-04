import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Memoize } from 'typescript-memoize';
import { EventInput, DateClickInfo, EventClickInfo, EventApi } from '@fullcalendar/core';

// Types
interface LeaveState {
    leaves: LeaveRequest[];
    allowance: number;
    loading: boolean;
    error: Error | null;
    currentYear: number;
}

interface LeaveRequest {
    id?: string;
    startDate: Date;
    endDate: Date;
    type: LeaveType;
    notes?: string;
    status: LeaveStatus;
    workingDays: number;
}

type LeaveType = 'annual' | 'sick' | 'compassionate' | 'bank';
type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Configuration
const CONFIG = {
    LEAVE_YEAR: {
        START_MONTH: 3, // April (0-based)
        START_DAY: 1,
        DEFAULT_ALLOWANCE: 25
    },
    VALIDATION: {
        MIN_NOTICE_DAYS: 14,
        MAX_CONSECUTIVE_DAYS: 15,
        MAX_ADVANCE_BOOK_MONTHS: 12
    },
    CACHE: {
        WORKING_DAYS: 5 * 60 * 1000, // 5 minutes
        CALENDAR_EVENTS: 60 * 1000 // 1 minute
    }
};

// Store
class LeaveStore {
    private state: BehaviorSubject<LeaveState>;

    constructor() {
        this.state = new BehaviorSubject<LeaveState>({
            leaves: [],
            allowance: CONFIG.LEAVE_YEAR.DEFAULT_ALLOWANCE,
            loading: false,
            error: null,
            currentYear: new Date().getFullYear()
        });
    }

    select<T>(selector: (state: LeaveState) => T): Observable<T> {
        return this.state.pipe(
            map(selector),
            distinctUntilChanged()
        );
    }

    setState(newState: Partial<LeaveState>): void {
        this.state.next({
            ...this.state.value,
            ...newState
        });
    }

    getState(): LeaveState {
        return this.state.value;
    }
}

// Services
class StorageService {
    private static readonly STORAGE_KEY = 'leave_requests';

    static saveLeaves(leaves: LeaveRequest[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(leaves));
        } catch (error) {
            console.error('Failed to save leaves:', error);
            throw error;
        }
    }

    static getLeaves(): LeaveRequest[] {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to retrieve leaves:', error);
            return [];
        }
    }
}

class DateService {
    @Memoize({ maxAge: CONFIG.CACHE.WORKING_DAYS })
    static isWorkingDay(date: Date): boolean {
        const day = date.getDay();
        return day !== 0 && day !== 6; // Not Sunday(0) or Saturday(6)
    }

    static calculateWorkingDays(start: Date, end: Date): number {
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            if (this.isWorkingDay(current)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    }
}

class LeaveValidator {
    static validateRequest(request: Partial<LeaveRequest>): string[] {
        const errors: string[] = [];

        if (!request.startDate || !request.endDate) {
            errors.push('Start and end dates are required');
            return errors;
        }

        const start = new Date(request.startDate);
        const end = new Date(request.endDate);

        if (start > end) {
            errors.push('Start date must be before end date');
        }

        const workingDays = DateService.calculateWorkingDays(start, end);
        if (workingDays > CONFIG.VALIDATION.MAX_CONSECUTIVE_DAYS) {
            errors.push(`Maximum consecutive working days is ${CONFIG.VALIDATION.MAX_CONSECUTIVE_DAYS}`);
        }

        const today = new Date();
        const noticeDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (noticeDays < CONFIG.VALIDATION.MIN_NOTICE_DAYS) {
            errors.push(`Minimum notice period is ${CONFIG.VALIDATION.MIN_NOTICE_DAYS} days`);
        }

        return errors;
    }
}

// Main Application
class LeaveManager {
    private store: LeaveStore;
    private readonly eventCache: WeakMap<HTMLElement, EventListener>;

    constructor() {
        this.store = new LeaveStore();
        this.eventCache = new WeakMap();
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            const leaves = StorageService.getLeaves();
            this.store.setState({ leaves });
            this.setupEventListeners();
            await this.initializeCalendar();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.store.setState({ error: error as Error });
        }
    }

    private setupEventListeners(): void {
        const form = document.getElementById('leaveRequestForm');
        if (form) {
            this.addEventListenerWithCleanup(form, 'submit', this.handleLeaveRequest.bind(this));
        }
    }

    private addEventListenerWithCleanup(
        element: HTMLElement,
        event: string,
        handler: EventListener
    ): void {
        const existingHandler = this.eventCache.get(element);
        if (existingHandler) {
            element.removeEventListener(event, existingHandler);
        }
        this.eventCache.set(element, handler);
        element.addEventListener(event, handler);
    }

    private async initializeCalendar(): Promise<void> {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            events: this.getCalendarEvents.bind(this),
            eventClick: this.handleEventClick.bind(this),
            dateClick: this.handleDateClick.bind(this)
        });

        calendar.render();
    }

    @Memoize({ maxAge: CONFIG.CACHE.CALENDAR_EVENTS })
    private async getCalendarEvents(fetchInfo: any): Promise<EventInput[]> {
        const leaves = this.store.getState().leaves;
        return leaves.map(leave => ({
            id: leave.id,
            title: `${leave.type} Leave`,
            start: leave.startDate,
            end: leave.endDate,
            backgroundColor: this.getEventColor(leave.status)
        }));
    }

    private getEventColor(status: LeaveStatus): string {
        const colors = {
            pending: '#FFA500',
            approved: '#4CAF50',
            rejected: '#F44336',
            cancelled: '#9E9E9E'
        };
        return colors[status];
    }

    private async handleLeaveRequest(event: Event): Promise<void> {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        const request: Partial<LeaveRequest> = {
            startDate: new Date(formData.get('startDate') as string),
            endDate: new Date(formData.get('endDate') as string),
            type: formData.get('type') as LeaveType,
            notes: formData.get('notes') as string
        };

        const errors = LeaveValidator.validateRequest(request);
        if (errors.length > 0) {
            this.showErrors(errors);
            return;
        }

        try {
            this.store.setState({ loading: true });
            const workingDays = DateService.calculateWorkingDays(
                request.startDate!,
                request.endDate!
            );

            const newLeave: LeaveRequest = {
                ...request as Required<typeof request>,
                id: crypto.randomUUID(),
                status: 'pending',
                workingDays
            };

            const leaves = [...this.store.getState().leaves, newLeave];
            StorageService.saveLeaves(leaves);
            this.store.setState({ leaves, loading: false });
            this.showSuccess('Leave request submitted successfully');
            form.reset();
        } catch (error) {
            console.error('Failed to submit leave request:', error);
            this.store.setState({ loading: false, error: error as Error });
            this.showErrors(['Failed to submit leave request']);
        }
    }

    private showErrors(errors: string[]): void {
        // Implement error display logic
        console.error(errors);
    }

    private showSuccess(message: string): void {
        // Implement success message display logic
        console.log(message);
    }

    private handleEventClick(info: EventClickInfo): void {
        // Implement event click handling
        console.log('Event clicked:', info.event);
    }

    private handleDateClick(info: DateClickInfo): void {
        // Implement date click handling
        console.log('Date clicked:', info.date);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new LeaveManager();
});
