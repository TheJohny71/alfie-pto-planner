import { Holiday, HolidayMap, Region } from '../types/holidays';

const US_HOLIDAYS_2024: HolidayMap = {
  '2024-01-01': { date: '2024-01-01', name: 'New Year\'s Day', type: 'regular', region: 'US' },
  '2024-01-15': { date: '2024-01-15', name: 'Martin Luther King Jr. Day', type: 'regular', region: 'US' },
  '2024-02-19': { date: '2024-02-19', name: 'Presidents Day', type: 'regular', region: 'US' },
  '2024-05-27': { date: '2024-05-27', name: 'Memorial Day', type: 'regular', region: 'US' },
  '2024-06-19': { date: '2024-06-19', name: 'Juneteenth', type: 'regular', region: 'US' },
  '2024-07-04': { date: '2024-07-04', name: 'Independence Day', type: 'regular', region: 'US' },
  '2024-09-02': { date: '2024-09-02', name: 'Labor Day', type: 'regular', region: 'US' },
  '2024-10-14': { date: '2024-10-14', name: 'Columbus Day', type: 'regular', region: 'US' },
  '2024-11-11': { date: '2024-11-11', name: 'Veterans Day', type: 'regular', region: 'US' },
  '2024-11-28': { date: '2024-11-28', name: 'Thanksgiving Day', type: 'regular', region: 'US' },
  '2024-12-25': { date: '2024-12-25', name: 'Christmas Day', type: 'regular', region: 'US' }
};

const UK_HOLIDAYS_2024: HolidayMap = {
  '2024-01-01': { date: '2024-01-01', name: 'New Year\'s Day', type: 'regular', region: 'UK' },
  '2024-03-29': { date: '2024-03-29', name: 'Good Friday', type: 'regular', region: 'UK' },
  '2024-04-01': { date: '2024-04-01', name: 'Easter Monday', type: 'regular', region: 'UK' },
  '2024-05-06': { date: '2024-05-06', name: 'Early May Bank Holiday', type: 'regular', region: 'UK' },
  '2024-05-27': { date: '2024-05-27', name: 'Spring Bank Holiday', type: 'regular', region: 'UK' },
  '2024-08-26': { date: '2024-08-26', name: 'Summer Bank Holiday', type: 'regular', region: 'UK' },
  '2024-12-25': { date: '2024-12-25', name: 'Christmas Day', type: 'regular', region: 'UK' },
  '2024-12-26': { date: '2024-12-26', name: 'Boxing Day', type: 'regular', region: 'UK' }
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const getHolidayInfo = (date: Date, region: Region): Holiday | null => {
  const dateStr = date.toISOString().split('T')[0];
  const holidays = region === 'US' ? US_HOLIDAYS_2024 : UK_HOLIDAYS_2024;
  
  const holiday = holidays[dateStr];
  if (!holiday) return null;

  // Check if holiday falls on weekend and needs to be observed on another day
  if (isWeekend(date)) {
    const day = date.getDay();
    const observedDate = new Date(date);
    
    if (day === 0) { // Sunday holiday observed on Monday
      observedDate.setDate(date.getDate() + 1);
    } else if (day === 6) { // Saturday holiday observed on Friday
      observedDate.setDate(date.getDate() - 1);
    }

    return {
      ...holiday,
      type: 'observed',
      date: observedDate.toISOString().split('T')[0]
    };
  }

  return holiday;
};

export const getHolidaysForMonth = (year: number, month: number, region: Region): Holiday[] => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const holidays: Holiday[] = [];

  const holidayMap = region === 'US' ? US_HOLIDAYS_2024 : UK_HOLIDAYS_2024;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const holiday = getHolidayInfo(d, region);
    if (holiday) {
      holidays.push(holiday);
    }
  }

  return holidays;
};
