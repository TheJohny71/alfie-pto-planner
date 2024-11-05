export interface LeaveRequest {
    id: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    notes?: string;
    category: LeaveCategory;
    department: string;
    status: LeaveStatus;
}

export type LeaveType = 'annual' | 'sick' | 'compassionate' | 'bank-holiday';
export type LeaveCategory = 'vacation' | 'medical' | 'personal';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveData {
    total: number;
    used: number;
    remaining: number;
    requests: LeaveRequest[];
}

export interface PTOSettings {
    darkMode: boolean;
    department: string;
    yearlyAllowance: number;
    bankHolidays: boolean;
}

export interface CalendarEvent {
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    display?: string;
}
