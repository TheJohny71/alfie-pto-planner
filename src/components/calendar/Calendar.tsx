import React, { useCallback } from 'react';
import { WeekView } from './WeekView';
import type { CalendarState, ViewMode, Region } from '../types';

interface CalendarProps {
    state: CalendarState;
    setDate: (date: Date) => void;
    setViewMode: (mode: ViewMode) => void;
    setRegion: (region: Region) => void;
    setSelectedDate: (date: Date | undefined) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
    state,
    setDate,
    setViewMode,
    setRegion,
    setSelectedDate
}) => {
    const { currentDate, selectedDate, viewMode, region } = state;

    const handleDateChange = useCallback((date: Date) => {
        setDate(date);
    }, [setDate]);

    const handleViewModeChange = useCallback((mode: ViewMode) => {
        setViewMode(mode);
    }, [setViewMode]);

    const handleRegionChange = useCallback((newRegion: Region) => {
        setRegion(newRegion);
    }, [setRegion]);

    const handleDateSelect = useCallback((date: Date) => {
        setSelectedDate(date);
    }, [setSelectedDate]);

    const navigateMonth = useCallback((direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        setDate(newDate);
    }, [currentDate, setDate]);

    return (
        <div className="calendar">
            <div className="calendar-header">
                <div className="calendar-navigation">
                    <button onClick={() => navigateMonth('prev')}>&lt;</button>
                    <h2>{currentDate.toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                    })}</h2>
                    <button onClick={() => navigateMonth('next')}>&gt;</button>
                </div>
                
                <div className="view-mode-selector">
                    <button 
                        className={viewMode === 'day' ? 'active' : ''} 
                        onClick={() => handleViewModeChange('day')}
                    >
                        Day
                    </button>
                    <button 
                        className={viewMode === 'week' ? 'active' : ''} 
                        onClick={() => handleViewModeChange('week')}
                    >
                        Week
                    </button>
                    <button 
                        className={viewMode === 'month' ? 'active' : ''} 
                        onClick={() => handleViewModeChange('month')}
                    >
                        Month
                    </button>
                </div>

                <select 
                    value={region} 
                    onChange={(e) => handleRegionChange(e.target.value)}
                >
                    <option value="UK">United Kingdom</option>
                    <option value="US">United States</option>
                    <option value="EU">Europe</option>
                </select>
            </div>

            <div className="calendar-body">
                {viewMode === 'week' && (
                    <WeekView 
                        state={state}
                        holidays={[]} // Add your holidays data here
                    />
                )}
                {/* Add other view components here */}
            </div>
        </div>
    );
};
