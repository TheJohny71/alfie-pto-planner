import { useState, useMemo, useCallback } from 'react';

export const useWeekView = (currentDate: Date) => {
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Generate array of dates for the week
  const getWeekDays = (date: Date): Date[] => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  // Generate time slots for a day
  const generateTimeSlots = (date: Date) => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(hour + 1, 0, 0, 0);
      
      slots.push({
        id: `${date.toDateString()}-${hour}`,
        startTime,
        endTime,
        isAvailable: true,
      });
    }
    return slots;
  };

  // Generate week columns with time slots
  const weekColumns = useMemo(() => {
    const days = getWeekDays(currentDate);
    
    return days.map(day => ({
      date: day,
      timeSlots: generateTimeSlots(day),
      events: [], // This will be populated from props
    }));
  }, [currentDate]);

  // Drag and drop handlers
  const handleDragStart = useCallback((slot: any) => {
    setIsDragging(true);
    setSelectedSlots([slot]);
  }, []);

  const handleDragEnter = useCallback((slot: any) => {
    if (!isDragging) return;
    if (!selectedSlots.includes(slot)) {
      setSelectedSlots(prev => [...prev, slot]);
    }
  }, [isDragging, selectedSlots]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Get current time indicator position
  const getCurrentTimeIndicatorPosition = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    
    if (hour < 9 || hour >= 17) return null;
    
    return {
      top: ((hour - 9) * 64) + ((minutes / 60) * 64),
      now,
    };
  }, []);

  return {
    weekColumns,
    selectedSlots,
    isDragging,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    getCurrentTimeIndicatorPosition,
  };
};
