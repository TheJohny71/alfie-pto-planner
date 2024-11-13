import React from 'react';
import { CalendarState } from '../types';

interface Holiday {
    date: Date;
    name: string;
    type: string;
}

interface WeekViewProps {
    state: CalendarState;
    holidays?: Holiday[];
}

export const WeekView: React.FC<WeekViewProps> = ({ state, holidays }) => {
    const { currentDate, selectedDate, viewMode, region } = state;

    const getWeekDays = (date: Date) => {
        const week = [];
        const current = new Date(date);
        current.setDate(current.getDate() - current.getDay()); // Start of week (Sunday)
        
        for (let i = 0; i < 7; i++) {
            week.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return week;
    };

    const weekDays = getWeekDays(currentDate);

    return (
        <div className="week-view">
            <div className="week-header">
                {weekDays.map((day, index) => (
                    <div 
                        key={day.toISOString()} 
                        className={`day-header ${
                            selectedDate && day.toDateString() === selectedDate.toDateString() 
                                ? 'selected' 
                                : ''
                        }`}
                    >
                        <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="day-date">{day.getDate()}</div>
                    </div>
                ))}
            </div>
            
            <div className="week-body">
                {weekDays.map((day) => {
                    const dayHolidays = holidays?.filter(
                        holiday => holiday.date.toDateString() === day.toDateString()
                    );
                    
                    return (
                        <div 
                            key={day.toISOString()} 
                            className={`day-column ${
                                selectedDate && day.toDateString() === selectedDate.toDateString()
                                    ? 'selected'
                                    : ''
                            }`}
                        >
                            {dayHolidays?.map((holiday, index) => (
                                <div key={index} className={`holiday-item ${holiday.type.toLowerCase()}`}>
                                    {holiday.name}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
