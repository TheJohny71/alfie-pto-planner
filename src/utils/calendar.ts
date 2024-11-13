// View Mode Types
export type ViewMode = 'day' | 'week' | 'month';
export type Region = string;

// Calendar State Interface
export interface CalendarState {
    currentDate: Date;
    selectedDate?: Date;
    viewMode: ViewMode;
    region: Region;
}

// Calendar Action Types
export type CalendarAction =
    | { type: 'SET_DATE'; payload: Date }
    | { type: 'SET_VIEW_MODE'; payload: ViewMode }
    | { type: 'SET_REGION'; payload: Region }
    | { type: 'SET_SELECTED_DATE'; payload: Date | undefined };

// Calendar Props Interface
export interface CalendarProps {
    state: CalendarState;
    setDate: (date: Date) => void;
    setViewMode: (mode: ViewMode) => void;
    setRegion: (region: Region) => void;
    setSelectedDate: (date: Date | undefined) => void;
}

// Holiday Types
export interface Holiday {
    date: Date;
    name: string;
    type: string;
}

// Week View Props Interface
export interface WeekViewProps {
    state: CalendarState;
    holidays?: Holiday[];
}

// Day View Props Interface
export interface DayViewProps {
    state: CalendarState;
    holidays?: Holiday[];
}

// Month View Props Interface
export interface MonthViewProps {
    state: CalendarState;
    holidays?: Holiday[];
}

// Calendar Event Interface
export interface CalendarEvent {
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    type: 'holiday' | 'leave' | 'meeting';
    description?: string;
}

// Calendar Navigation Props
export interface CalendarNavigationProps {
    currentDate: Date;
    onNavigate: (direction: 'prev' | 'next') => void;
}

// Calendar Header Props
export interface CalendarHeaderProps {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    region: Region;
    onRegionChange: (region: Region) => void;
}
