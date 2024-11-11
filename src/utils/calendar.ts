// Utilities for calendar manipulation

export type CalendarUtils = {
  addDays: (date: Date, days: number) => Date;
  subtractDays: (date: Date, days: number) => Date;
  formatDate: (date: Date) => string;
};

// Add a specific number of days to a date
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Subtract a specific number of days from a date
export const subtractDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

// Format a date as 'Month Day, Year'
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};
