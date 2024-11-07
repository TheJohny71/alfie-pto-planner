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

// Add this to src/types/index.ts
export interface Holiday {
    date: Date;
    name: string;
    type: 'regular' | 'observed' | 'weekend';
    region: 'US' | 'UK' | 'both';
}
// Add this to src/types/index.ts

// Existing types...

// SweetAlert2 type definition
declare global {
    const Swal: any;
}

export {};
