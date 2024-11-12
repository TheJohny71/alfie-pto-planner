import { useReducer, useCallback } from 'react';
import type { CalendarState, ViewMode, Region } from '../types';

type CalendarAction =
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_REGION'; payload: Region }
  | { type: 'SET_SELECTED_DATE'; payload: Date | undefined };

const initialState: CalendarState = {
  currentDate: new Date(),
  selectedDate: undefined,
  viewMode: 'month',
  region: 'UK'
};

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, currentDate: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_REGION':
      return { ...state, region: action.payload };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    default:
      return state;
  }
}

export function useCalendarState() {
  const [state, dispatch] = useReducer(calendarReducer, initialState);

  const setDate = useCallback((date: Date) => {
    dispatch({ type: 'SET_DATE', payload: date });
  }, []);

  const setViewMode = useCallback((viewMode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: viewMode });
  }, []);

  const setRegion = useCallback((region: Region) => {
    dispatch({ type: 'SET_REGION', payload: region });
  }, []);

  const setSelectedDate = useCallback((date: Date | undefined) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  }, []);

  return {
    state,
    setDate,
    setViewMode,
    setRegion,
    setSelectedDate
  };
}
