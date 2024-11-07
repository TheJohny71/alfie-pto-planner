import React, { useState, useEffect } from 'react';
import { Region, Holiday, DateSelection } from '../types/holidays';
import { isWeekend, getHolidayInfo, getHolidaysForMonth } from '../utils/holidayCalculator';
import { showHolidayConfirmation, showError, showSuccess } from '../utils/alerts';

interface CalendarProps {
  initialRegion?: Region;
}

interface CalendarDay {
  date: Date;
  isSelected: boolean;
  isWeekend: boolean;
  holiday: Holiday | null;
}

const Calendar: React.FC<CalendarProps> = ({ initialRegion = 'US' }) => {
  const [selectedRegion, setSelectedRegion] = useState<Region>(initialRegion);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDates, setSelectedDates] = useState<DateSelection[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Continue in next part...
  // Date handling functions
  const handleDateClick = async (date: Date) => {
    try {
      if (isWeekend(date)) {
        showError('Cannot select weekends');
        return;
      }

      const holiday = getHolidayInfo(date, selectedRegion);
      const leaveType = selectedRegion === 'US' ? 'PTO' : 'Annual Leave';

      if (holiday) {
        const confirmed = await showHolidayConfirmation(holiday, leaveType);
        if (!confirmed) {
          return;
        }
      }

      setSelectedDates(prev => {
        const existingSelection = prev.find(d => 
          d.date.toISOString() === date.toISOString()
        );

        if (existingSelection) {
          return prev.filter(d => 
            d.date.toISOString() !== date.toISOString()
          );
        }

        return [...prev, {
          date: date,
          type: leaveType,
          status: 'pending'
        }];
      });

      setErrorMessage('');
    } catch (error) {
      setErrorMessage(`Error selecting date: ${error.message}`);
      showError(`Error selecting date: ${error.message}`);
    }
  };

  const handleMonthChange = (increment: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + increment);
      return newDate;
    });
  };

  // Continue in next part...
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    // Add padding for days before the first of the month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const paddingDate = new Date(firstDay);
      paddingDate.setDate(paddingDate.getDate() - (firstDayOfWeek - i));
      days.push({
        date: paddingDate,
        isSelected: false,
        isWeekend: isWeekend(paddingDate),
        holiday: getHolidayInfo(paddingDate, selectedRegion)
      });
    }

    // Add all days of the month
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      days.push({
        date: currentDate,
        isSelected: selectedDates.some(d => 
          d.date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
        ),
        isWeekend: isWeekend(currentDate),
        holiday: getHolidayInfo(currentDate, selectedRegion)
      });
    }

    // Add padding for days after the last of the month
    const lastDayOfWeek = lastDay.getDay();
    for (let i = lastDayOfWeek; i < 6; i++) {
      const paddingDate = new Date(lastDay);
      paddingDate.setDate(paddingDate.getDate() + (i - lastDayOfWeek + 1));
      days.push({
        date: paddingDate,
        isSelected: false,
        isWeekend: isWeekend(paddingDate),
        holiday: getHolidayInfo(paddingDate, selectedRegion)
      });
    }

    return days;
  };

  // Continue in next part... 
  const renderHeader = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div className="calendar-header">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              {selectedRegion === 'US' ? 'PTO' : 'Annual Leave'} Calendar
            </h2>
            <select
              className="border p-2 rounded"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as Region)}
            >
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleMonthChange(-1)}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              ←
            </button>
            <span className="font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button 
              onClick={() => handleMonthChange(1)}
              className="px-3 py-1 border rounded hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }; 
    const renderDayHeaders = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map(day => (
          <div 
            key={day} 
            className="p-2 text-center font-bold bg-gray-100 text-gray-700"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCalendarDay = (day: CalendarDay) => {
    const isCurrentMonth = day.date.getMonth() === currentDate.getMonth();
    const dateStr = day.date.getDate().toString();
    
    const dayClasses = [
      'calendar-day p-2 min-h-[80px] border relative',
      isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400',
      day.isWeekend ? 'bg-gray-100' : '',
      day.isSelected ? 'border-blue-500 border-2' : '',
      day.holiday ? 'border-red-500' : '',
      !day.isWeekend && isCurrentMonth ? 'cursor-pointer hover:bg-blue-50' : '',
    ].filter(Boolean).join(' ');

    return (
      <div
        key={day.date.toISOString()}
        className={dayClasses}
        onClick={() => isCurrentMonth && !day.isWeekend && handleDateClick(day.date)}
      >
        <div className="flex justify-between">
          <span className="font-semibold">{dateStr}</span>
          {day.holiday && (
            <span className="text-xs text-red-500">
              {day.holiday.type === 'observed' ? '👀' : '🏢'}
            </span>
          )}
        </div>
        
        {day.holiday && (
          <div className="text-xs text-red-500 mt-1">
            {day.holiday.name}
            {day.holiday.type === 'observed' && (
              <div className="text-orange-500">(Observed)</div>
            )}
          </div>
        )}

        {day.isSelected && (
          <div className="absolute bottom-1 right-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
      </div>
    );
  };
    const renderLegend = () => {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Legend</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100"></div>
            <span>Weekend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-red-500"></div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-500"></div>
            <span>Observed Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500"></div>
            <span>{selectedRegion === 'US' ? 'PTO' : 'Annual Leave'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="calendar-container p-4">
      {renderHeader()}
      <div className="calendar-body bg-white rounded-lg shadow">
        {renderDayHeaders()}
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays().map(day => renderCalendarDay(day))}
        </div>
      </div>
      {renderLegend()}
      
      {/* Selected Dates Summary */}
      {selectedDates.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Selected Dates</h3>
          <div className="space-y-1">
            {selectedDates.map(selection => (
              <div key={selection.date.toISOString()} className="flex justify-between">
                <span>
                  {selection.date.toLocaleDateString()} - {selection.type}
                </span>
                <span className="text-gray-600">
                  {selection.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
