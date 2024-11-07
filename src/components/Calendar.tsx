import { Holiday } from '../types';
import { HolidayCalculator } from '../utils/calendar';

export class Calendar {
    private readonly container: HTMLElement;
    private currentDate: Date;
    private region: 'US' | 'UK' | 'both';
    private holidays: Holiday[];

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }
        
        this.container = container;
        this.currentDate = new Date();
        this.region = 'both';
        this.holidays = [];
        
        this.initialize();
    }

    private initialize(): void {
        this.createRegionToggle();
        this.updateHolidays();
        this.render();

        // Add navigation buttons
        this.createNavigationButtons();
    }

    private createNavigationButtons(): void {
        const navigationContainer = document.createElement('div');
        navigationContainer.className = 'calendar-navigation';

        const prevButton = document.createElement('button');
        prevButton.textContent = '← Previous Month';
        prevButton.onclick = () => this.previousMonth();

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next Month →';
        nextButton.onclick = () => this.nextMonth();

        const monthDisplay = document.createElement('div');
        monthDisplay.className = 'current-month';
        monthDisplay.textContent = this.formatMonthYear();

        navigationContainer.appendChild(prevButton);
        navigationContainer.appendChild(monthDisplay);
        navigationContainer.appendChild(nextButton);

        this.container.insertBefore(navigationContainer, this.container.firstChild);
    }

    private formatMonthYear(): string {
        return new Intl.DateTimeFormat('en-US', { 
            month: 'long', 
            year: 'numeric' 
        }).format(this.currentDate);
    }

    private createRegionToggle(): void {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'region-toggle';

        const regions: Array<'US' | 'UK' | 'both'> = ['US', 'UK', 'both'];
        regions.forEach(region => {
            const button = document.createElement('button');
            button.textContent = region === 'both' ? 'All Regions' : region;
            button.className = region === this.region ? 'active' : '';
            button.onclick = () => this.setRegion(region);
            toggleContainer.appendChild(button);
        });

        this.container.appendChild(toggleContainer);
    }

    private setRegion(region: 'US' | 'UK' | 'both'): void {
        this.region = region;
        this.updateHolidays();
        this.render();
    }

    private updateHolidays(): void {
        const calculator = new HolidayCalculator(this.currentDate.getFullYear(), this.region);
        this.holidays = calculator.getHolidays();
    }

    private getHolidaysForDate(date: Date): Holiday[] {
        return this.holidays.filter(holiday => 
            holiday.date.getDate() === date.getDate() &&
            holiday.date.getMonth() === date.getMonth() &&
            holiday.date.getFullYear() === date.getFullYear()
        );
    }

    private createDayElement(date: Date): HTMLElement {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        if (isWeekend) {
            dayEl.classList.add('weekend');
        }

        const isToday = this.isToday(date);
        if (isToday) {
            dayEl.classList.add('today');
        }

        const dateNumber = document.createElement('div');
        dateNumber.className = 'date-number';
        dateNumber.textContent = date.getDate().toString();
        dayEl.appendChild(dateNumber);

        const holidays = this.getHolidaysForDate(date);
        holidays.forEach(holiday => {
            const indicator = document.createElement('div');
            indicator.className = `holiday-indicator holiday-${holiday.type}`;
            dayEl.appendChild(indicator);

            const holidayName = document.createElement('div');
            holidayName.className = 'holiday-name';
            holidayName.textContent = holiday.name;
            dayEl.appendChild(holidayName);
        });

        return dayEl;
    }

    private isToday(date: Date): boolean {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    private render(): void {
        // Clear existing content except navigation
        const navigation = this.container.querySelector('.calendar-navigation');
        const regionToggle = this.container.querySelector('.region-toggle');
        this.container.innerHTML = '';
        if (navigation) this.container.appendChild(navigation);
        if (regionToggle) this.container.appendChild(regionToggle);

        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';

        // Create header row
        const headerRow = document.createElement('div');
        headerRow.className = 'calendar-header';
        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header-cell';
            dayHeader.textContent = day;
            headerRow.appendChild(dayHeader);
        });
        calendarGrid.appendChild(headerRow);

        // Calculate dates
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);

        // Add padding for first week
        const firstDayOfWeek = firstDay.getDay();
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }

        // Add all days of the month
        for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
            calendarGrid.appendChild(this.createDayElement(new Date(date)));
        }

        this.container.appendChild(calendarGrid);
    }

    public nextMonth(): void {
        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() + 1,
            1
        );
        this.updateHolidays();
        this.render();
    }

    public previousMonth(): void {
        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() - 1,
            1
        );
        this.updateHolidays();
        this.render();
    }
}
