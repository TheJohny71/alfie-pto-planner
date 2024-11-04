/**
 * Alfie PTO Planner Pro - Enterprise Edition
 * Version 2.0.0
 */

// Types and Interfaces
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

interface ValidationResult {
    valid: boolean;
    errors?: string[];
}

// Configuration
const CONFIG = {
    LEAVE_YEAR: {
        START_MONTH: 3,  // April (0-based)
        START_DAY: 1,
        DEFAULT_ALLOWANCE: 25
    },
    VALIDATION: {
        MIN_NOTICE_DAYS: 14,
        MAX_CONSECUTIVE_DAYS: 15,
        MAX_ADVANCE_BOOK_MONTHS: 12
    },
    RETRY: {
        MAX_ATTEMPTS: 3,
        BASE_DELAY: 1000
    },
    CACHE: {
        WORKING_DAYS: 5 * 60 * 1000, // 5 minutes
        CALENDAR_EVENTS: 60 * 1000    // 1 minute
    }
};

// Bank Holidays Database
const UK_BANK_HOLIDAYS = {
    2024: [
        { title: "New Year's Day", date: '2024-01-01', type: 'bank' as LeaveType },
        { title: "Good Friday", date: '2024-03-29', type: 'bank' as LeaveType },
        // ... (other 2024 holidays)
    ],
    2025: [
        { title: "New Year's Day", date: '2025-01-01', type: 'bank' as LeaveType },
        { title: "Good Friday", date: '2025-04-18', type: 'bank' as LeaveType },
        // ... (other 2025 holidays)
    ]
    // ... (future years)
};

// Custom Error Types
class LeaveError extends Error {
    constructor(
        public code: string,
        message: string,
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = 'LeaveError';
        Object.setPrototypeOf(this, LeaveError.prototype);
    }
}

// Action Types
type LeaveAction = 
    | { type: 'REQUEST_STARTED' }
    | { type: 'REQUEST_SUCCEEDED'; payload: LeaveRequest }
    | { type: 'REQUEST_FAILED'; payload: string[] }
    | { type: 'LEAVE_CANCELLED'; payload: string }
    | { type: 'ERROR_OCCURRED'; payload: Error };
/**
 * Reactive State Management
 */
class LeaveStore {
    private state$: BehaviorSubject<LeaveState>;
    private readonly initialState: LeaveState = {
        leaves: [],
        allowance: CONFIG.LEAVE_YEAR.DEFAULT_ALLOWANCE,
        loading: false,
        error: null,
        currentYear: new Date().getFullYear()
    };

    constructor() {
        this.state$ = new BehaviorSubject<LeaveState>(this.initialState);
    }

    // State Access Methods
    getState(): LeaveState {
        return this.state$.value;
    }

    select<T>(selector: (state: LeaveState) => T): Observable<T> {
        return this.state$.pipe(
            map(selector),
            distinctUntilChanged()
        );
    }

    // State Updates
    dispatch(action: LeaveAction): void {
        const currentState = this.state$.value;
        const newState = this.reducer(currentState, action);
        this.state$.next(newState);
    }

    private reducer(state: LeaveState, action: LeaveAction): LeaveState {
        switch (action.type) {
            case 'REQUEST_STARTED':
                return {
                    ...state,
                    loading: true,
                    error: null
                };

            case 'REQUEST_SUCCEEDED':
                return {
                    ...state,
                    loading: false,
                    leaves: [...state.leaves, action.payload]
                };

            case 'REQUEST_FAILED':
                return {
                    ...state,
                    loading: false,
                    error: new Error(action.payload.join(', '))
                };

            case 'LEAVE_CANCELLED':
                return {
                    ...state,
                    leaves: state.leaves.filter(leave => leave.id !== action.payload)
                };

            case 'ERROR_OCCURRED':
                return {
                    ...state,
                    loading: false,
                    error: action.payload
                };

            default:
                return state;
        }
    }
}

/**
 * Storage Service with Retry Logic
 */
class StorageService implements IStorageService {
    constructor(private readonly storage: Storage = localStorage) {}

    async save(key: string, data: any): Promise<void> {
        return this.withRetry(async () => {
            try {
                const serialized = JSON.stringify(data);
                this.storage.setItem(key, serialized);
            } catch (error) {
                throw new LeaveError('STORAGE_ERROR', 'Failed to save data', { key });
            }
        });
    }

    async load(key: string): Promise<any> {
        return this.withRetry(async () => {
            try {
                const data = this.storage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (error) {
                throw new LeaveError('STORAGE_ERROR', 'Failed to load data', { key });
            }
        });
    }

    private async withRetry<T>(
        operation: () => Promise<T>,
        attempts: number = CONFIG.RETRY.MAX_ATTEMPTS
    ): Promise<T> {
        for (let i = 0; i < attempts; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === attempts - 1) throw error;
                await new Promise(resolve => 
                    setTimeout(resolve, CONFIG.RETRY.BASE_DELAY * Math.pow(2, i))
                );
            }
        }
        throw new LeaveError('RETRY_EXHAUSTED', 'Operation failed after retries');
    }
}

/**
 * Date Service for Timezone-aware Operations
 */
class DateService {
    private timezone: string = 'Europe/London';

    formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: this.timezone,
            ...options
        }).format(date);
    }

    @memoize({ maxAge: CONFIG.CACHE.WORKING_DAYS })
    calculateWorkingDays(start: Date, end: Date): number {
        let count = 0;
        let current = new Date(start);

        while (current <= end) {
            if (this.isWorkingDay(current)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }

        return count;
    }

    isWorkingDay(date: Date): boolean {
        const day = date.getDay();
        if (day === 0 || day === 6) return false; // Weekend

        const dateStr = this.formatDate(date, { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });

        // Check bank holidays
        const year = date.getFullYear();
        return !UK_BANK_HOLIDAYS[year]?.some(holiday => 
            holiday.date === dateStr
        );
    }
}
/**
 * Leave Validator Service
 */
class LeaveValidator {
    constructor(
        private dateService: DateService,
        private store: LeaveStore
    ) {}

    async validate(request: LeaveRequest): Promise<ValidationResult> {
        const errors: string[] = [];

        // Run all validations
        await Promise.all([
            this.validateDates(request, errors),
            this.validateNoticePeriod(request, errors),
            this.validateOverlap(request, errors),
            this.validateAllowance(request, errors)
        ]);

        return {
            valid: errors.length === 0,
            errors
        };
    }

    private async validateDates(request: LeaveRequest, errors: string[]): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (request.startDate < today) {
            errors.push('Cannot book leave in the past');
        }

        if (request.endDate < request.startDate) {
            errors.push('End date must be after start date');
        }

        const workingDays = this.dateService.calculateWorkingDays(
            request.startDate, 
            request.endDate
        );

        if (workingDays > CONFIG.VALIDATION.MAX_CONSECUTIVE_DAYS) {
            errors.push(`Maximum consecutive working days is ${CONFIG.VALIDATION.MAX_CONSECUTIVE_DAYS}`);
        }
    }

    private async validateNoticePeriod(request: LeaveRequest, errors: string[]): Promise<void> {
        const noticeRequired = CONFIG.VALIDATION.MIN_NOTICE_DAYS;
        const noticeDate = new Date();
        noticeDate.setDate(noticeDate.getDate() + noticeRequired);

        if (request.startDate < noticeDate) {
            errors.push(`Minimum ${noticeRequired} days notice required`);
        }
    }

    private async validateOverlap(request: LeaveRequest, errors: string[]): Promise<void> {
        const existingLeaves = this.store.getState().leaves;
        
        const hasOverlap = existingLeaves.some(leave => 
            leave.status !== 'cancelled' &&
            request.startDate <= new Date(leave.endDate) &&
            request.endDate >= new Date(leave.startDate)
        );

        if (hasOverlap) {
            errors.push('Leave dates overlap with existing booking');
        }
    }

    private async validateAllowance(request: LeaveRequest, errors: string[]): Promise<void> {
        const state = this.store.getState();
        const workingDays = this.dateService.calculateWorkingDays(
            request.startDate, 
            request.endDate
        );

        const usedDays = state.leaves
            .filter(leave => leave.status !== 'cancelled')
            .reduce((total, leave) => total + leave.workingDays, 0);

        if (workingDays + usedDays > state.allowance) {
            errors.push('Insufficient leave allowance remaining');
        }
    }
}

/**
 * Core Leave Manager Class
 */
class LeaveManager {
    private calendar: FullCalendar.Calendar;
    private readonly eventCache: WeakMap<Element, any>;

    constructor(
        private store: LeaveStore,
        private validator: LeaveValidator,
        private dateService: DateService,
        private storage: StorageService,
        private telemetry: TelemetryService
    ) {
        this.eventCache = new WeakMap();
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            await this.loadStoredData();
            this.initializeCalendar();
            this.bindEventHandlers();
            this.telemetry.trackEvent('LeaveManagerInitialized');
        } catch (error) {
            this.handleError(error);
        }
    }

    @measureOperation('requestLeave')
    async requestLeave(request: LeaveRequest): Promise<RequestResult> {
        this.store.dispatch({ type: 'REQUEST_STARTED' });

        try {
            const validation = await this.validator.validate(request);
            if (!validation.valid) {
                this.store.dispatch({ 
                    type: 'REQUEST_FAILED', 
                    payload: validation.errors 
                });
                return { success: false, errors: validation.errors };
            }

            const leaveId = this.generateLeaveId();
            const leaveRequest = {
                ...request,
                id: leaveId,
                status: 'pending' as LeaveStatus,
                workingDays: this.dateService.calculateWorkingDays(
                    request.startDate, 
                    request.endDate
                )
            };

            await this.storage.save('leaves', [
                ...this.store.getState().leaves,
                leaveRequest
            ]);

            this.store.dispatch({ 
                type: 'REQUEST_SUCCEEDED', 
                payload: leaveRequest 
            });

            this.telemetry.trackEvent('LeaveRequested', {
                leaveId,
                type: request.type,
                workingDays: leaveRequest.workingDays
            });

            return {
                success: true,
                leaveId,
                message: 'Leave request submitted successfully'
            };

        } catch (error) {
            this.handleError(error);
            return {
                success: false,
                errors: ['An unexpected error occurred']
            };
        }
    }

    // ... (continuing in next part)
/**
 * Continuing LeaveManager Class
 */
class LeaveManager {
    // ... (previous code)

    private initializeCalendar(): void {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            throw new LeaveError('INIT_ERROR', 'Calendar element not found');
        }

        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listMonth'
            },
            firstDay: 1, // Monday start
            weekNumbers: true,
            weekNumberCalculation: 'ISO',
            businessHours: {
                daysOfWeek: [1, 2, 3, 4, 5],
                hours: { start: '09:00', end: '17:30' }
            },
            events: this.getCalendarEvents.bind(this),
            eventClassNames: this.getEventClassNames.bind(this),
            dateClick: this.handleDateClick.bind(this),
            eventClick: this.handleEventClick.bind(this),
            datesSet: this.handleDatesSet.bind(this),
            eventDidMount: this.handleEventMount.bind(this),
            eventContent: this.renderEventContent.bind(this)
        });

        // Subscribe to store changes
        this.store.select(state => state.leaves).subscribe(() => {
            this.refreshCalendar();
        });

        this.calendar.render();
    }

    @debounce(100)
    private refreshCalendar(): void {
        this.calendar.refetchEvents();
    }

    @memoize({ maxAge: CONFIG.CACHE.CALENDAR_EVENTS })
    private async getCalendarEvents(fetchInfo: any): Promise<EventInput[]> {
        const { start, end } = fetchInfo;
        const state = this.store.getState();
        
        // Combine leave requests and bank holidays
        return [
            ...this.getLeaveEvents(state.leaves, start, end),
            ...this.getBankHolidayEvents(start, end)
        ];
    }

    private getLeaveEvents(
        leaves: LeaveRequest[], 
        start: Date, 
        end: Date
    ): EventInput[] {
        return leaves
            .filter(leave => leave.status !== 'cancelled')
            .filter(leave => {
                const leaveStart = new Date(leave.startDate);
                const leaveEnd = new Date(leave.endDate);
                return leaveStart <= end && leaveEnd >= start;
            })
            .map(leave => ({
                id: leave.id,
                title: this.getEventTitle(leave),
                start: leave.startDate,
                end: leave.endDate,
                className: `leave-event leave-${leave.type}`,
                extendedProps: {
                    type: leave.type,
                    status: leave.status,
                    workingDays: leave.workingDays,
                    notes: leave.notes
                }
            }));
    }

    private getBankHolidayEvents(start: Date, end: Date): EventInput[] {
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        const years = Array.from(
            { length: endYear - startYear + 1 },
            (_, i) => startYear + i
        );

        return years.flatMap(year => 
            (UK_BANK_HOLIDAYS[year] || []).map(holiday => ({
                title: holiday.title,
                start: holiday.date,
                allDay: true,
                className: 'bank-holiday',
                extendedProps: {
                    type: 'bank'
                }
            }))
        );
    }

    private handleDateClick(info: DateClickInfo): void {
        if (!this.dateService.isWorkingDay(info.date)) {
            this.showNotification({
                title: 'Invalid Selection',
                message: 'Please select a working day',
                type: 'warning'
            });
            return;
        }

        this.showLeaveRequestModal(info.date);
    }

    private handleEventClick(info: EventClickInfo): void {
        const event = info.event;
        
        if (event.extendedProps.type === 'bank') {
            this.showBankHolidayDetails(event);
            return;
        }

        this.showLeaveDetails(event);
    }

    private showLeaveDetails(event: EventApi): void {
        const canCancel = this.canCancelLeave(event);

        Swal.fire({
            title: 'Leave Details',
            html: this.generateEventDetailsHtml(event),
            icon: 'info',
            showCancelButton: canCancel,
            cancelButtonText: 'Cancel Leave',
            confirmButtonText: 'Close'
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel) {
                this.cancelLeave(event.id);
            }
        });
    }

    @measureOperation('cancelLeave')
    private async cancelLeave(leaveId: string): Promise<void> {
        try {
            const state = this.store.getState();
            const leave = state.leaves.find(l => l.id === leaveId);

            if (!leave) {
                throw new LeaveError('INVALID_LEAVE', 'Leave request not found');
            }

            if (!this.canCancelLeave(leave)) {
                throw new LeaveError('CANCEL_ERROR', 'Leave cannot be cancelled');
            }

            await this.storage.save('leaves', state.leaves.map(l => 
                l.id === leaveId ? { ...l, status: 'cancelled' } : l
            ));

            this.store.dispatch({ 
                type: 'LEAVE_CANCELLED', 
                payload: leaveId 
            });

            this.showNotification({
                title: 'Success',
                message: 'Leave cancelled successfully',
                type: 'success'
            });

        } catch (error) {
            this.handleError(error);
        }
    }

    // ... (continuing in next part)
/**
 * Continuing LeaveManager Class
 */
class LeaveManager {
    // ... (previous code)

    private canCancelLeave(leave: LeaveRequest): boolean {
        const startDate = new Date(leave.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return (
            leave.status !== 'cancelled' &&
            startDate > today &&
            startDate.getTime() - today.getTime() >= 
            CONFIG.VALIDATION.MIN_NOTICE_DAYS * 24 * 60 * 60 * 1000
        );
    }

    private generateEventDetailsHtml(event: EventApi): string {
        const props = event.extendedProps;
        return `
            <div class="leave-details">
                <p><strong>Type:</strong> ${this.formatLeaveType(props.type)}</p>
                <p><strong>Status:</strong> ${this.formatLeaveStatus(props.status)}</p>
                <p><strong>Dates:</strong> ${this.formatDateRange(event.start!, event.end!)}</p>
                <p><strong>Working Days:</strong> ${props.workingDays}</p>
                ${props.notes ? `<p><strong>Notes:</strong> ${this.sanitizeHtml(props.notes)}</p>` : ''}
            </div>
        `;
    }

    private formatDateRange(start: Date, end: Date): string {
        return `${this.dateService.formatDate(start)} - ${this.dateService.formatDate(end)}`;
    }

    private formatLeaveType(type: LeaveType): string {
        const types = {
            annual: 'Annual Leave',
            sick: 'Sick Leave',
            compassionate: 'Compassionate Leave',
            bank: 'Bank Holiday'
        };
        return types[type] || type;
    }

    private formatLeaveStatus(status: LeaveStatus): string {
        const statuses = {
            pending: 'Pending',
            approved: 'Approved',
            rejected: 'Rejected',
            cancelled: 'Cancelled'
        };
        return statuses[status] || status;
    }

    private sanitizeHtml(html: string): string {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    private showNotification({ title, message, type }: {
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
    }): void {
        Swal.fire({
            title,
            text: message,
            icon: type,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    private handleError(error: Error): void {
        this.telemetry.trackException(error);
        console.error('Leave Management Error:', error);

        this.store.dispatch({ 
            type: 'ERROR_OCCURRED', 
            payload: error 
        });

        this.showNotification({
            title: 'Error',
            message: error instanceof LeaveError ? 
                error.message : 
                'An unexpected error occurred',
            type: 'error'
        });
    }

    private generateLeaveId(): string {
        return `leave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Application Initialization
 */
class LeaveApplication {
    private static instance: LeaveApplication;
    private leaveManager: LeaveManager;

    private constructor() {
        const store = new LeaveStore();
        const storage = new StorageService();
        const dateService = new DateService();
        const telemetry = new TelemetryService();
        const validator = new LeaveValidator(dateService, store);

        this.leaveManager = new LeaveManager(
            store,
            validator,
            dateService,
            storage,
            telemetry
        );
    }

    static async initialize(): Promise<void> {
        try {
            if (!LeaveApplication.instance) {
                LeaveApplication.instance = new LeaveApplication();
            }

            // Initialize service worker
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('ServiceWorker registered:', registration);
            }

            // Initialize UI event listeners
            document.addEventListener('DOMContentLoaded', () => {
                LeaveApplication.instance.bindGlobalEventListeners();
            });

        } catch (error) {
            console.error('Failed to initialize application:', error);
            document.body.innerHTML = `
                <div class="error-container">
                    <h1>Application Error</h1>
                    <p>Please try refreshing the page or contact support.</p>
                </div>
            `;
        }
    }

    private bindGlobalEventListeners(): void {
        // Theme toggling
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            document.body.dataset.theme = 
                document.body.dataset.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', document.body.dataset.theme);
        });

        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.dataset.theme = savedTheme;
        }

        // Handle offline/online events
        window.addEventListener('online', () => {
            this.leaveManager.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.leaveManager.handleOffline();
        });
    }
}

// Initialize the application
LeaveApplication.initialize().catch(error => {
    console.error('Critical initialization error:', error);
});
