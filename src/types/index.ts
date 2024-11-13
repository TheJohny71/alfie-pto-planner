export type ViewMode = 'day' | 'week' | 'month';
export type Region = string;

export interface CalendarState {
    currentDate: Date;
    selectedDate?: Date;
    viewMode: ViewMode;
    region: Region;
}

export interface Holiday {
    date: Date;
    name: string;
    type: string;
}

export interface WeekViewProps {
    state: CalendarState;
    holidays?: Holiday[];
}
