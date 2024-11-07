import { Holiday } from '../types';

export class HolidayCalculator {
    private readonly year: number;
    private readonly region: 'US' | 'UK' | 'both';

    constructor(year: number, region: 'US' | 'UK' | 'both' = 'both') {
        this.year = year;
        this.region = region;
    }

    private calculateEasterSunday(): Date {
        const a = this.year % 19;
        const b = Math.floor(this.year / 100);
        const c = this.year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        
        return new Date(this.year, month - 1, day);
    }

    private getUSHolidays(): Holiday[] {
        const holidays: Holiday[] = [];
        
        // New Year's Day
        const newYearsDay = new Date(this.year, 0, 1);
        holidays.push({
            date: newYearsDay,
            name: "New Year's Day",
            type: 'regular',
            region: 'US'
        });

        // Martin Luther King Jr. Day
        const mlkDay = new Date(this.year, 0, 1);
        while (mlkDay.getDay() !== 1) {
            mlkDay.setDate(mlkDay.getDate() + 1);
        }
        mlkDay.setDate(mlkDay.getDate() + 14);
        holidays.push({
            date: mlkDay,
            name: "Martin Luther King Jr. Day",
            type: 'regular',
            region: 'US'
        });

        return holidays;
    }

    private getUKHolidays(): Holiday[] {
        const holidays: Holiday[] = [];
        
        // New Year's Day
        const newYearsDay = new Date(this.year, 0, 1);
        holidays.push({
            date: newYearsDay,
            name: "New Year's Day",
            type: 'regular',
            region: 'UK'
        });

        // Good Friday
        const easterSunday = this.calculateEasterSunday();
        const goodFriday = new Date(easterSunday);
        goodFriday.setDate(easterSunday.getDate() - 2);
        holidays.push({
            date: goodFriday,
            name: "Good Friday",
            type: 'regular',
            region: 'UK'
        });

        return holidays;
    }

    public getHolidays(): Holiday[] {
        let holidays: Holiday[] = [];
        
        if (this.region === 'US' || this.region === 'both') {
            holidays = holidays.concat(this.getUSHolidays());
        }
        
        if (this.region === 'UK' || this.region === 'both') {
            holidays = holidays.concat(this.getUKHolidays());
        }
        
        return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
} 
