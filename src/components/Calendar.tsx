import React, { useState, useEffect } from 'react';
import { useHolidays } from '../hooks/useHolidays';
import { useTeamAvailability } from '../hooks/useTeamAvailability';
import type { Region, ViewMode, Holiday, TeamAvailability } from '../types';

// Utility Functions
const getMonthDays = (currentDate: Date) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days: Date[] = [];
  
  // Add days from previous month
  for (let i = firstDay.getDay(); i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }
  
  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  // Add days from next month
  const remainingDays = 42 - days.length; // 6 rows × 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
};

const getWeekDays = (currentDate: Date) => {
  const date = new Date(currentDate);
  const day = date.getDay();
  const diff = date.getDate() - day;
  const weekDays: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    weekDays.push(new Date(date.setDate(diff + i)));
  }
  
  return weekDays;
};

// Component for selecting US/UK/Both regions
const RegionSelector: React.FC<{
  selectedRegion: Region;
  onRegionChange: (region: Region) => void;
}> = ({ selectedRegion, onRegionChange }) => {
  return (
    <select
      value={selectedRegion}
      onChange={(e) => onRegionChange(e.target.value as Region)}
      className="px-3 py-1 border border-purple-200 rounded-md text-sm bg-white"
      aria-label="Select region"
    >
      <option value="US">United States</option>
      <option value="UK">United Kingdom</option>
      <option value="both">All Regions</option>
    </select>
  );
};

// Component for switching between Month/Week/Year views
const ViewSelector: React.FC<{
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex rounded-md overflow-hidden border border-purple-200" role="group" aria-label="Calendar view options">
      {['Month', 'Week', 'Year'].map((view) => (
        <button
          key={view}
          className={`px-3 py-1 text-sm ${
            currentView === view.toLowerCase()
              ? 'bg-purple-600 text-white'
              : 'bg-white text-purple-600 hover:bg-purple-50'
          }`}
          onClick={() => onViewChange(view.toLowerCase() as ViewMode)}
          aria-pressed={currentView === view.toLowerCase()}
        >
          {view}
        </button>
      ))}
    </div>
  );
};

// Calendar Header showing current period and navigation
const CalendarHeader: React.FC<{
  currentDate: Date;
  viewMode: ViewMode;
  onPrevious: () => void;
  onNext: () => void;
}> = ({ currentDate, viewMode, onPrevious, onNext }) => {
  const formatHeader = () => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      ...(viewMode === 'week' && { day: 'numeric' })
    });
    return formatter.format(currentDate);
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-purple-800">{formatHeader()}</h2>
      <div className="flex gap-2">
        <button
          onClick={onPrevious}
          className="p-2 hover:bg-purple-50 rounded-full"
          aria-label="Previous period"
        >
          ←
        </button>
        <button
          onClick={() => {
            const today = new Date();
            if (viewMode === 'week') {
              today.setHours(0, 0, 0, 0);
            } else if (viewMode === 'month') {
              today.setDate(1);
            }
          }}
          className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-md"
        >
          Today
        </button>
        <button
          onClick={onNext}
          className="p-2 hover:bg-purple-50 rounded-full"
          aria-label="Next period"
        >
          →
        </button>
      </div>
    </div>
  );
};

// Calendar Grid Component
const CalendarGrid: React.FC<{
  currentDate: Date;
  viewMode: ViewMode;
  holidays: Holiday[];
  teamAvailability: TeamAvailability[];
}> = ({ currentDate, viewMode, holidays, teamAvailability }) => {
  const today = new Date();
  const days = viewMode === 'month' ? getMonthDays(currentDate) : getWeekDays(currentDate);

  const getHolidaysForDate = (date: Date) => {
    return holidays.filter(holiday => 
      holiday.date.getDate() === date.getDate() &&
      holiday.date.getMonth() === date.getMonth() &&
      holiday.date.getFullYear() === date.getFullYear()
    );
  };

  const getTeamAvailabilityForDate = (date: Date) => {
    return teamAvailability.find(ta => 
      ta.date.getDate() === date.getDate() &&
      ta.date.getMonth() === date.getMonth() &&
      ta.date.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div 
      className="grid grid-cols-7 gap-1" 
      role="grid" 
      aria-label="Calendar"
    >
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div 
          key={day} 
          className="p-2 text-center text-gray-600 font-medium"
          role="columnheader"
        >
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {days.map((date, index) => {
        const dateHolidays = getHolidaysForDate(date);
        const availability = getTeamAvailabilityForDate(date);
        
        return (
          <div
            key={index}
            className={`
              min-h-24 p-2 border rounded-lg transition-colors
              ${isToday(date) ? 'border-purple-500' : 'border-gray-100'}
              ${isCurrentMonth(date) ? 'bg-white' : 'bg-gray-50'}
              hover:border-purple-200
            `}
            role="gridcell"
            aria-selected={isToday(date)}
            tabIndex={0}
          >
            {/* Date number */}
            <div className="flex justify-between items-start">
              <span className={`
                text-sm font-medium rounded-full w-6 h-6 flex items-center justify-center
                ${isToday(date) ? 'bg-purple-500 text-white' : ''}
                ${!isCurrentMonth(date) ? 'text-gray-400' : 'text-gray-700'}
              `}>
                {date.getDate()}
              </span>
              
              {/* Team availability indicator */}
              {availability && availability.awayMembers.length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="bg-amber-100 text-amber-800 px-1 rounded">
                    {availability.awayMembers.length} away
                  </span>
                </div>
              )}
            </div>

            {/* Holidays */}
            {dateHolidays.map((holiday, i) => (
              <div
                key={i}
                className="mt-1 text-xs bg-blue-50 text-blue-700 p-1 rounded truncate"
                title={holiday.name}
              >
                {holiday.name}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// Main Calendar Component
const Calendar: React.FC = () => {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRegion, setSelectedRegion] = useState<Region>('both');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  
  // Custom hooks for features
  const { holidays } = useHolidays(selectedRegion);
  const { teamAvailability } = useTeamAvailability(currentDate);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.getAttribute('role') === 'gridcell') {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            handlePrevious();
            break;
          case 'ArrowRight':
            e.preventDefault();
            handleNext();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDate, viewMode]);

  // Navigation handlers
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setFullYear(currentDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setFullYear(currentDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-purple-600">PTO Calendar</h1>
        <div className="flex gap-2">
          <ViewSelector 
            currentView={viewMode} 
            onViewChange={setViewMode} 
          />
          <RegionSelector 
            selectedRegion={selectedRegion} 
            onRegionChange={setSelectedRegion} 
          />
        </div>
      </div>

      <CalendarHeader 
        currentDate={currentDate}
        viewMode={viewMode}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
      
      <CalendarGrid 
        currentDate={currentDate}
        viewMode={viewMode}
        holidays={holidays}
        teamAvailability={teamAvailability}
      />
    </div>
  );
};

export default Calendar;
