export interface Holiday {
  date: string;
  name: string;
  type: 'regular' | 'observed';
  region: 'US' | 'UK';
}

export interface HolidayMap {
  [key: string]: Holiday;
}

export type Region = 'US' | 'UK';

export interface DateSelection {
  date: Date;
  type: 'PTO' | 'Annual Leave';
  status: 'pending' | 'approved' | 'rejected';
}
