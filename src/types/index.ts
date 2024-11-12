export interface CalendarState {
    date: Date;
    viewMode: ViewMode;
    region: string;
}

export enum ViewMode {
    Day = 'day',
    Week = 'week',
    Month = 'month'
}

export interface TeamAvailability {
    region: string;
    teamAvailability: boolean;
}

export interface LeaveRequest {
    id?: string;
    startDate: Date;
    endDate: Date;
    status: LeaveStatus;
    type: LeaveType;
    notes?: string;
}

export enum LeaveStatus {
    Pending = 'pending',
    Approved = 'approved',
    Rejected = 'rejected'
}

export enum LeaveType {
    Vacation = 'vacation',
    Sick = 'sick',
    Personal = 'personal'
}

export type Region = string;
