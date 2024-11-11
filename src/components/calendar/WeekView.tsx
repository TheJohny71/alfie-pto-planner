import React from 'react';
import { useWeekView } from '../../hooks/useWeekView';
import { WeekViewTimeSlot, WeekViewEvent } from '../../types';

interface WeekViewProps {
  currentDate: Date;
  holidays: any[];
  teamAvailability: any[];
}

const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  holidays,
  teamAvailability,
}) => {
  const {
    weekColumns,
    selectedSlots,
    isDragging,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    getCurrentTimeIndicatorPosition,
  } = useWeekView(currentDate);

  // Format time for display (e.g., "9:00 AM")
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Render time column on the left
  const renderTimeColumn = () => {
    const times = [];
    for (let hour = 9; hour < 17; hour++) {
      const time = new Date(currentDate);
      time.setHours(hour, 0, 0, 0);
      times.push(
        <div key={hour} className="h-16 border-b border-gray-200 text-sm text-gray-500 pr-2 text-right">
          {formatTime(time)}
        </div>
      );
    }
    return times;
  };

  const timeIndicator = getCurrentTimeIndicatorPosition();

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Week Header */}
      <div className="flex border-b border-gray-200">
        <div className="w-20" /> {/* Time column spacer */}
        {weekColumns.map((column) => (
          <div
            key={column.date.toISOString()}
            className="flex-1 text-center py-2 border-l border-gray-200"
          >
            <div className="font-medium">
              {column.date.toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="text-sm text-gray-500">
              {column.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex flex-1 overflow-y-auto">
        {/* Time Column */}
        <div className="w-20 flex flex-col sticky left-0 bg-white z-10">
          {renderTimeColumn()}
        </div>

        {/* Day Columns */}
        {weekColumns.map((column) => (
          <div
            key={column.date.toISOString()}
            className="flex-1 border-l border-gray-200 relative"
          >
            {/* Time slots */}
            {column.timeSlots.map((slot) => (
              <div
                key={slot.id}
                className={`h-16 border-b border-gray-200 relative 
                  ${selectedSlots.includes(slot) ? 'bg-purple-100' : 'hover:bg-purple-50'}`}
                draggable
                onDragStart={() => handleDragStart(slot)}
                onDragEnter={() => handleDragEnter(slot)}
                onDragEnd={handleDragEnd}
              />
            ))}

            {/* Events */}
            {column.events.map((event) => (
              <div
                key={event.id}
                className="absolute left-0 right-0 mx-1 rounded-md p-1 text-xs text-white"
                style={{
                  top: `${(event.startDate.getHours() - 9) * 64}px`,
                  height: '64px',
                  backgroundColor: event.backgroundColor || '#7c3aed',
                }}
              >
                <div className="font-medium truncate">{event.title}</div>
                <div className="truncate">
                  {formatTime(event.startDate)} - {formatTime(event.endDate)}
                </div>
              </div>
            ))}

            {/* Current time indicator */}
            {timeIndicator && column.date.toDateString() === new Date().toDateString() && (
              <div
                className="absolute left-0 right-0 flex items-center z-20"
                style={{ top: `${timeIndicator.top}px` }}
              >
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                <div className="flex-1 border-t border-red-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;
