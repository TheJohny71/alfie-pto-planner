// src/hooks/useCalendarState.ts
import { useReducer, useCallback } from 'react';
import { CalendarState, PTOEvent } from '@/types/calendar';
import { calendarReducer, initialState } from '@/utils/calendarReducer';

export const useCalendarState = () => {
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const handleAddEvent = useCallback((event: PTOEvent) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
  }, []);

  return { state, dispatch, handleUndo, handleRedo, handleAddEvent };
};

// src/hooks/useCalendarGrid.ts
import { useState, useEffect } from 'react';
import { CalendarDay } from '@/types/calendar';
import { useCalendarContext } from './useCalendarContext';
import { HolidayCalculator } from '@/utils/holidayCalculator';

export const useCalendarGrid = () => {
  const { state } = useCalendarContext();
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const holidayCalculator = new HolidayCalculator();

  useEffect(() => {
    const generateDays = () => {
      const { selectedDate, events } = state;
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startPadding = firstDay.getDay();
      const endPadding = 6 - lastDay.getDay();
      
      const daysArray: CalendarDay[] = [];

      // Add padding days from previous month
      const prevMonth = new Date(year, month - 1);
      for (let i = startPadding - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonth.getDate() - i);
        daysArray.push(createDayObject(date, false));
      }

      // Add days of current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        daysArray.push(createDayObject(date, true));
      }

      // Add padding days from next month
      for (let i = 1; i <= endPadding; i++) {
        const date = new Date(year, month + 1, i);
        daysArray.push(createDayObject(date, false));
      }

      setDays(daysArray);
      setIsLoading(false);
    };

    const createDayObject = (date: Date, isCurrentMonth: boolean): CalendarDay => {
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const isHoliday = holidayCalculator.isHoliday(date, 'US');
      const holidayName = isHoliday ? holidayCalculator.getHolidayName(date, 'US') : undefined;
      
      return {
        date,
        isCurrentMonth,
        isToday,
        isHoliday,
        holidayName,
        events: state.events.filter(event => 
          date >= event.startDate && date <= event.endDate
        )
      };
    };

    generateDays();
  }, [state.selectedDate, state.events]);

  return { days, isLoading };
};

// src/hooks/useCalendarKeyboard.ts
import { useCallback, useEffect } from 'react';
import { useCalendarContext } from './useCalendarContext';

export const useCalendarKeyboard = () => {
  const { dispatch } = useCalendarContext();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'z':
          if (event.shiftKey) {
            dispatch({ type: 'REDO' });
          } else {
            dispatch({ type: 'UNDO' });
          }
          event.preventDefault();
          break;
        case 'f':
          dispatch({ type: 'TOGGLE_SEARCH' });
          event.preventDefault();
          break;
      }
    } else {
      switch (event.key) {
        case 'ArrowLeft':
          dispatch({ type: 'PREV_DAY' });
          event.preventDefault();
          break;
        case 'ArrowRight':
          dispatch({ type: 'NEXT_DAY' });
          event.preventDefault();
          break;
        case 'ArrowUp':
          dispatch({ type: 'PREV_WEEK' });
          event.preventDefault();
          break;
        case 'ArrowDown':
          dispatch({ type: 'NEXT_WEEK' });
          event.preventDefault();
          break;
      }
    }
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    keyboardProps: {
      role: 'application',
      'aria-label': 'Calendar',
      tabIndex: 0,
    }
  };
};

// src/hooks/usePTOEvents.ts
import { useState, useEffect } from 'react';
import { PTOEvent } from '@/types/calendar';
import { storage } from '@/utils/storage';

export const usePTOEvents = () => {
  const [events, setEvents] = useState<PTOEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const storedEvents = await storage.getEvents();
        setEvents(storedEvents);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load events'));
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const addEvent = async (event: Omit<PTOEvent, 'id'>) => {
    try {
      const newEvent = await storage.addEvent(event);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add event'));
      throw err;
    }
  };

  return {
    events,
    isLoading,
    error,
    addEvent
  };
};
// src/hooks/useCalendarState.ts
import { useReducer, useCallback } from 'react';
import { CalendarState, PTOEvent } from '@/types/calendar';
import { calendarReducer, initialState } from '@/utils/calendarReducer';

export const useCalendarState = () => {
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const handleAddEvent = useCallback((event: PTOEvent) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
  }, []);

  const handleUpdateEvent = useCallback((event: PTOEvent) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event });
  }, []);

  const handleDeleteEvent = useCallback((eventId: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: eventId });
  }, []);

  return {
    state,
    dispatch,
    handlers: {
      handleUndo,
      handleRedo,
      handleAddEvent,
      handleUpdateEvent,
      handleDeleteEvent
    }
  };
};
// src/hooks/useCalendarGrid.ts
import { useState, useEffect } from 'react';
import { CalendarDay } from '@/types/calendar';
import { useCalendarContext } from './useCalendarContext';
import { HolidayCalculator } from '@/utils/holidayCalculator';

export const useCalendarGrid = () => {
  const { state } = useCalendarContext();
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const holidayCalculator = new HolidayCalculator();

  const createDayObject = (date: Date, isCurrentMonth: boolean): CalendarDay => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isHoliday = holidayCalculator.isHoliday(date, 'US');
    const holidayName = isHoliday 
      ? holidayCalculator.getHolidayName(date, 'US') 
      : undefined;
    
    return {
      date,
      isCurrentMonth,
      isToday,
      isHoliday,
      holidayName,
      events: state.events.filter(event => 
        date >= event.startDate && 
        date <= event.endDate
      )
    };
  };

  useEffect(() => {
    const generateDays = () => {
      const { selectedDate } = state;
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startPadding = firstDay.getDay();
      const endPadding = 6 - lastDay.getDay();
      
      const daysArray: CalendarDay[] = [];

      // Previous month padding
      const prevMonth = new Date(year, month - 1);
      for (let i = startPadding - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonth.getDate() - i);
        daysArray.push(createDayObject(date, false));
      }

      // Current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        daysArray.push(createDayObject(date, true));
      }

      // Next month padding
      for (let i = 1; i <= endPadding; i++) {
        const date = new Date(year, month + 1, i);
        daysArray.push(createDayObject(date, false));
      }

      setDays(daysArray);
      setIsLoading(false);
    };

    generateDays();
  }, [state.selectedDate, state.events]);

  return { days, isLoading };
};
// src/hooks/useCalendarKeyboard.ts
import { useCallback, useEffect } from 'react';
import { useCalendarContext } from './useCalendarContext';

export const useCalendarKeyboard = () => {
  const { dispatch } = useCalendarContext();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'z':
          if (event.shiftKey) {
            dispatch({ type: 'REDO' });
          } else {
            dispatch({ type: 'UNDO' });
          }
          event.preventDefault();
          break;
          
        case 'f':
          dispatch({ type: 'TOGGLE_SEARCH' });
          event.preventDefault();
          break;
          
        case 'p':
          dispatch({ type: 'OPEN_PRINT_VIEW' });
          event.preventDefault();
          break;
      }
    }
    
    // Handle navigation keys
    else {
      switch (event.key) {
        case 'ArrowLeft':
          dispatch({ type: 'NAVIGATE', payload: 'prev' });
          event.preventDefault();
          break;
          
        case 'ArrowRight':
          dispatch({ type: 'NAVIGATE', payload: 'next' });
          event.preventDefault();
          break;
          
        case 'ArrowUp':
          dispatch({ type: 'NAVIGATE', payload: 'up' });
          event.preventDefault();
          break;
          
        case 'ArrowDown':
          dispatch({ type: 'NAVIGATE', payload: 'down' });
          event.preventDefault();
          break;
          
        case 'Home':
          dispatch({ type: 'NAVIGATE_TO_START' });
          event.preventDefault();
          break;
          
        case 'End':
          dispatch({ type: 'NAVIGATE_TO_END' });
          event.preventDefault();
          break;
          
        case 'Enter':
        case ' ':
          dispatch({ type: 'SELECT_FOCUSED_DATE' });
          event.preventDefault();
          break;
      }
    }
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    keyboardProps: {
      role: 'application',
      'aria-label': 'Calendar',
      tabIndex: 0,
      'aria-roledescription': 'calendar',
    }
  };
};
// src/hooks/usePTOEvents.ts
import { useState, useEffect } from 'react';
import { PTOEvent } from '@/types/calendar';
import { storage } from '@/utils/storage';

export const usePTOEvents = () => {
  const [events, setEvents] = useState<PTOEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load events from storage
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const storedEvents = await storage.getEvents();
        setEvents(storedEvents);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load events'));
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  // CRUD operations
  const addEvent = async (event: Omit<PTOEvent, 'id'>) => {
    try {
      const newEvent = await storage.addEvent(event);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add event'));
      throw err;
    }
  };

  const updateEvent = async (event: PTOEvent) => {
    try {
      const updatedEvent = await storage.updateEvent(event);
      setEvents(prev => 
        prev.map(e => e.id === event.id ? updatedEvent : e)
      );
      return updatedEvent;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update event'));
      throw err;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await storage.deleteEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete event'));
      throw err;
    }
  };

  // Filter events
  const filterEvents = (filters: {
    startDate?: Date;
    endDate?: Date;
    type?: string;
    status?: string;
  }) => {
    return events.filter(event => {
      if (filters.startDate && event.startDate < filters.startDate) return false;
      if (filters.endDate && event.endDate > filters.endDate) return false;
      if (filters.type && event.type !== filters.type) return false;
      if (filters.status && event.status !== filters.status) return false;
      return true;
    });
  };

  return {
    events,
    isLoading,
    error,
    operations: {
      addEvent,
      updateEvent,
      deleteEvent,
      filterEvents
    }
  };
};
