// Declare module types
declare module '*.css';
declare module '*.scss';

// Calendar Types
export interface CalendarType {
  id: string;
  title: string;
  date: Date;
  view: 'month' | 'week' | 'day';
}

// Export holiday types
export interface Holiday {
  date: string;
  name: string;
  type: 'public' | 'company' | 'personal';
}

// TeamAvailability types
export interface TeamMember {
  id: string;
  name: string;
  availability: boolean;
}

// Common types used across components
export type ViewMode = 'month' | 'week' | 'day';
export type Status = 'loading' | 'error' | 'success' | 'idle';
