import React, { useState } from 'react';
import { useHolidays } from '../hooks/useHolidays';
import { useTeamAvailability } from '../hooks/useTeamAvailability';
import WeekView from './WeekView';
import type { Region, ViewMode } from '../types';

// Header Buttons Component
const HeaderButton: React.FC<{
  children: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
}> = ({ children, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
      ${isActive 
        ? 'bg-white text-purple-600' 
        : 'text-white hover:bg-white/10'}`}
  >
    {children}
  </button>
);

// Calendar Grid Component
const CalendarGrid: React.FC<{
  currentDate: Date;
  viewMode: ViewMode;
}> = ({ currentDate, viewMode }) => {
  const days = Array.from({ length: 35 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(1);
    date.setDate(1 - date.getDay() + i);
    return date;
  });

  return (
    <div className="grid grid-cols-7 gap-0 bg-white rounded-lg p-6">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="pb-4 text-center text-gray-600">
          {day}
        </div>
      ))}
      
      {days.map((date, i) => {
        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
        const isToday = date.toDateString() === new Date().toDateString();
        
        return (
          <div
            key={i}
            className={`aspect-square p-2 border-t border-l first:border-l-0 
              ${i % 7 === 6 ? 'border-r' : ''} 
              ${i >= 28 ? 'border-b' : ''}
              ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
              ${isToday ? 'bg-purple-50' : ''}`}
          >
            <span className={`text-sm inline-flex w-7 h-7 items-center justify-center rounded-full
              ${isToday ? 'bg-purple-600 text-white' : ''}`}>
              {date.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Main Calendar Component
const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRegion, setSelectedRegion] = useState<Region>('UK');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  
  // Use the hooks and extract the data
  const { holidays } = useHolidays();
  const { teamAvailability } = useTeamAvailability();

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-600 text-white p-4">
        <div className="container mx-auto">
          {/* Top row */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">PTO Calendar</h1>
            <div className="flex gap-2">
              <HeaderButton 
                isActive={viewMode === 'month'} 
                onClick={() => setViewMode('month')}
              >
                Month
              </HeaderButton>
              <HeaderButton 
                isActive={viewMode === 'week'} 
                onClick={() => setViewMode('week')}
              >
                Week
              </HeaderButton>
              <HeaderButton 
                isActive={viewMode === 'year'} 
                onClick={() => setViewMode('year')}
              >
                Year
              </HeaderButton>
              <HeaderButton onClick={() => console.log('Add PTO')}>
                Add PTO
              </HeaderButton>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as Region)}
                className="bg-transparent border border-white/30 rounded-full px-3 text-sm"
              >
                <option value="UK">UK</option>
                <option value="US">US</option>
                <option value="both">All Regions</option>
              </select>
              <HeaderButton onClick={() => console.log('Statistics')}>
                Statistics
              </HeaderButton>
              <HeaderButton onClick={() => console.log('Export')}>
                Export
              </HeaderButton>
            </div>
          </div>
          
          {/* Month and navigation row */}
          <div className="flex items-center gap-2">
            <button 
              className="p-1 hover:bg-white/10 rounded-full"
              onClick={handlePreviousMonth}
            >
              ⟨
            </button>
            <h2 className="text-xl">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long',
                year: 'numeric'
              })}
            </h2>
            <button 
              className="p-1 hover:bg-white/10 rounded-full"
              onClick={handleNextMonth}
            >
              ⟩
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto p-4">
        {viewMode === 'week' ? (
          <WeekView
            currentDate={currentDate}
            holidays={holidays || []}
            teamAvailability={teamAvailability || []}
          />
        ) : (
          <CalendarGrid 
            currentDate={currentDate}
            viewMode={viewMode}
          />
        )}
      </main>
    </div>
  );
};

export default Calendar;
