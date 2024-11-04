export interface LeaveRequest {
    id: string;
    startDate: Date;
    endDate: Date;
    type: 'annual' | 'sick' | 'compassionate';
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface UserSettings {
    theme: 'light' | 'dark';
    totalAllowance: number;
    year: number;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    color?: string;
    type: LeaveRequest['type'];
}
