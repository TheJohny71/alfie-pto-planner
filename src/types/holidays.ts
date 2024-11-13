export interface Holiday {
    date: Date;
    name: string;
    type: HolidayType;
    region: string;
}

export enum HolidayType {
    Public = 'public',
    Bank = 'bank',
    Religious = 'religious',
    Other = 'other'
}

export interface HolidayResponse {
    holidays: Holiday[];
    region: string;
}
