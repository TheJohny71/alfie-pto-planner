import React, { useState, useEffect } from 'react';
import { useHolidays } from '../hooks/useHolidays';
import { useTeamAvailability } from '../hooks/useTeamAvailability';
import type { Region, ViewMode } from '../types';

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
    <div className="flex rounded-md overflow-hidden border border-purple-200">
      {['Month', 'Week', 'Year'].map((view) => (
        <button
          key={view}
          className={`px-3 py-1 text-sm ${
            currentView === view.toLowerCase()
              ? 'bg-purple-600 text-white'
              : 'bg-white text-purple-600 hover:bg-purple-50'
          }`}
          onClick={() => onViewChange(view.toLowerCase() as ViewMode)}
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
        >
          ←
        </button>
        <button
          onClick={onNext}
          className="p-2 hover:bg-purple-50 rounded-full"
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
  holidays: any[];
  teamAvailability: any;
}> = ({ currentDate, viewMode, holidays, teamAvailability }) => {
  // Basic calendar grid rendering - we'll expand this soon
  return (
    <div className="grid grid-cols-7 gap-1">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="p-2 text-center text-gray-600 font-medium">
          {day}
        </div>
      ))}
      {/* Calendar days will be rendered here */}
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
          {/* Add PTO button will be added later */}
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
