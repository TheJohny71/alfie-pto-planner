// At the top of your file
import { CalendarState, ViewMode } from '../../types';

interface CalendarProps {
    state: CalendarState;
    setDate: (date: Date) => void;
    setViewMode: (mode: ViewMode) => void;
    setRegion: (region: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ state, setDate, setViewMode, setRegion }) => {
    // Your component code
}
import React from 'react';
import { ViewMode } from '../../types';
import { useCalendarState } from '../../hooks/useCalendarState';
import { useHolidays } from '../../hooks/useHolidays';

interface CalendarProps {
  initialView?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  initialView = 'month',
  onViewChange 
}) => {
  const { calendarState } = useCalendarState();
  const { holidays } = useHolidays();

  return (
    <div className="calendar-container">
      {/* Your calendar content */}
    </div>
  );
};

export default Calendar;
