export interface CalendarState {
    date: Date;
    viewMode: ViewMode;
    region: string;
    selectedDate?: Date;
}

export enum ViewMode {
    Day = 'day',
    Week = 'week',
    Month = 'month'
}

export interface CalendarProps {
    state: CalendarState;
    setDate: (date: Date) => void;
    setViewMode: (mode: ViewMode) => void;
    setRegion: (region: string) => void;
    setSelectedDate?: (date: Date | undefined) => void;
}

export interface WeekViewProps {
    state: CalendarState;
    holidays?: Holiday[];
}

export interface Holiday {
    date: Date;
    name: string;
    type: string;
}
