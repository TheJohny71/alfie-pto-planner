// src/types/index.ts
export interface LeaveState {
    leaves: LeaveRequest[];
    allowance: number;
    loading: boolean;
    error: Error | null;
    currentYear: number;
}

export interface LeaveRequest {
    id?: string;
    startDate: Date;
    endDate: Date;
    type: LeaveType;
    notes?: string;
    status: LeaveStatus;
    workingDays: number;
}

export type LeaveType = 'annual' | 'sick' | 'compassionate' | 'bank';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}

export type LeaveAction =
    | { type: 'REQUEST_STARTED' }
    | { type: 'REQUEST_SUCCEEDED'; payload: LeaveRequest }
    | { type: 'REQUEST_FAILED'; payload: string[] }
    | { type: 'LEAVE_CANCELLED'; payload: string }
    | { type: 'ERROR_OCCURRED'; payload: Error };
