// Basic enums and types
export type Region = 'UK' | 'US' | 'both';
export type ViewMode = 'week' | 'month' | 'year';
export type LeaveType = 'PTO' | 'HOLIDAY' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Date related types
export type ISODateString = string; // YYYY-MM-DD format
export interface DateRange {
  startDate: ISODateString;
  endDate: ISODateString;
}

// Holiday related types
export interface Holiday {
  date: ISODateString;
  name: string;
  region: Region;
  type?: 'PUBLIC' | 'COMPANY';  // Added to distinguish holiday types
}

export interface HolidayResponse {
  holidays: Holiday[];
  loading: boolean;
  error: Error | null;
}

// Team member related types
export interface TeamMember {
  id: string;
  name: string;
  region: Region;
  role?: string;
  email?: string;
}

// Team availability related types
export interface TeamAvailability {
  userId: string;
  dates: ISODateString[];
  type: LeaveType;
  teamMember?: TeamMember;  // Optional reference to team member details
}

export interface TeamAvailabilityResponse {
  teamAvailability: TeamAvailability[];
  loading: boolean;
  error: Error | null;
}

// Calendar related types
export interface CalendarDay {
  date: Date;
  holidays: Holiday[];
  teamAvailability: TeamAvailability[];
  isWeekend?: boolean;
  isToday?: boolean;
  isCurrentMonth?: boolean;
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

// Leave request related types
export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: ISODateString;
  endDate: ISODateString;
  type: LeaveType;
  status: LeaveStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedBy?: string;
}

export interface LeaveRequestFormData {
  startDate: ISODateString;
  endDate: ISODateString;
  type: LeaveType;
  notes?: string;
}

// Hook response types
export interface UseCalendarOptions {
  region?: Region;
  viewMode?: ViewMode;
  initialDate?: Date;
}

export interface CalendarState {
  currentDate: Date;
  selectedDate?: Date;
  viewMode: ViewMode;
  region: Region;
}

// Error types
export interface ApiError extends Error {
  code?: string;
  status?: number;
  details?: unknown;
}
