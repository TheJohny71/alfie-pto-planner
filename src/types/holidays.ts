// File: src/types/holidays.ts

export interface Holiday {
    date: Date;
    name: string;
    type: 'regular' | 'observed' | 'weekend';
    region: 'US' | 'UK' | 'both';
}
