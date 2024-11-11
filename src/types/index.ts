// Existing types remain the same
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
export type Region = 'US' | 'UK' | 'both';
export type ViewMode = 'month' | 'week' | 'year';

// Existing interfaces remain
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

export interface Holiday {
    date: Date;
    name: string;
    type: 'regular' | 'observed' | 'weekend';
    region: Region;
}

export interface TeamMember {
    id: string;
    name: string;
    avatar?: string;
}

export interface TeamAvailability {
    date: Date;
    availableMembers: TeamMember[];
    awayMembers: TeamMember[];
}

// New types for Week View
export interface WeekViewTimeSlot {
    id: string;
    startTime: Date;
    endTime: Date;
    isAvailable: boolean;
}

export interface WeekViewEvent {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    type: LeaveType;
    status: LeaveStatus;
    userId: string;
    backgroundColor?: string;
    borderColor?: string;
}

export interface WeekColumn {
    date: Date;
    timeSlots: WeekViewTimeSlot[];
    events: WeekViewEvent[];
}

export interface WeekViewState {
    selectedSlots: WeekViewTimeSlot[];
    isDragging: boolean;
    dragStart: Date | null;
    dragEnd: Date | null;
}

// Calendar view specific interfaces
export interface DayInfo {
    date: Date;
    isToday: boolean;
    isCurrentMonth: boolean;
    holidays: Holiday[];
    events: WeekViewEvent[];
    teamAvailability: TeamAvailability;
}

// Constants for the Week View
export const CALENDAR_CONSTANTS = {
    WORK_HOURS: {
        start: 9,  // 9 AM
        end: 17,   // 5 PM
    },
    TIME_SLOT_HEIGHT: 64, // height in pixels
    COLORS: {
        primary: '#7c3aed',     // Purple
        secondary: '#4f46e5',   // Indigo
        success: '#10b981',     // Green
        warning: '#f59e0b',     // Orange
        danger: '#ef4444',      // Red
        info: '#3b82f6',        // Blue
    },
    EVENT_TYPES: {
        vacation: {
            backgroundColor: '#7c3aed',
            borderColor: '#6d28d9',
        },
        sick: {
            backgroundColor: '#ef4444',
            borderColor: '#dc2626',
        },
        personal: {
            backgroundColor: '#f59e0b',
            borderColor: '#d97706',
        },
        'bank-holiday': {
            backgroundColor: '#10b981',
            borderColor: '#059669',
        },
    },
} as const;

// Type guards
export const isWeekViewEvent = (event: any): event is WeekViewEvent => {
    return (
        typeof event === 'object' &&
        event !== null &&
        'id' in event &&
        'startDate' in event &&
        'endDate' in event &&
        'type' in event &&
        'status' in event
    );
};

export const isTimeSlot = (slot: any): slot is WeekViewTimeSlot => {
    return (
        typeof slot === 'object' &&
        slot !== null &&
        'id' in slot &&
        'startTime' in slot &&
        'endTime' in slot &&
        'isAvailable' in slot
    );
};
