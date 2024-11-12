// Region type for location selection
export type Region = 'UK' | 'US' | 'both';

// View mode for calendar display
export type ViewMode = 'week' | 'month' | 'year';

// Holiday type definition
export interface Holiday {
  date: string;
  name: string;
  region: Region;
}

// Team member availability type
export interface TeamMember {
  id: string;
  name: string;
  region: Region;
}

// Team availability type
export interface TeamAvailability {
  userId: string;
  dates: string[];  // Array of dates when team member is unavailable
  type: 'PTO' | 'HOLIDAY' | 'OTHER';
}

// Calendar day type
export interface CalendarDay {
  date: Date;
  holidays: Holiday[];
  teamAvailability: TeamAvailability[];
}

// Leave request type
export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: 'PTO' | 'HOLIDAY' | 'OTHER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}
