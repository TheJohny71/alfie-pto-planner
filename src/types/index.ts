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
// Add these new types to your existing index.ts file

export type Region = 'US' | 'UK' | 'both';
export type ViewMode = 'month' | 'week' | 'year';

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

export interface PTORequest {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  type: 'vacation' | 'sick' | 'personal';
  status: 'pending' | 'approved' | 'rejected';
}

export interface TeamAvailability {
  date: Date;
  availableMembers: TeamMember[];
  awayMembers: TeamMember[];
}

export interface DayInfo {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  holidays: Holiday[];
  ptoRequests: PTORequest[];
  teamAvailability: TeamAvailability;
}
