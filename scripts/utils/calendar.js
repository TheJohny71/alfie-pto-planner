// scripts/components/Calendar.js
class Calendar {
    constructor(container) {
        this.container = container;
        this.currentDate = new Date();
        this.selectedDates = [];
        this.region = 'US';
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        this.container.innerHTML = `
            <div class="calendar">
                <div class="calendar-header">
                    <button id="prevMonth">&lt;</button>
                    <h2>${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}</h2>
                    <button id="nextMonth">&gt;</button>
                </div>
                ${this.generateCalendarGrid()}
            </div>
        `;
    }

    generateCalendarGrid() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        let html = '<div class="calendar-grid">';

        // Add day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });

        // Add padding for first week
        for (let i = 0; i < firstDay.getDay(); i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Add days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            html += `
                <div class="calendar-day${isWeekend ? ' weekend' : ''}" data-date="${date.toISOString()}">
                    ${day}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    attachEventListeners() {
        const prevButton = this.container.querySelector('#prevMonth');
        const nextButton = this.container.querySelector('#nextMonth');

        prevButton?.addEventListener('click', () => this.previousMonth());
        nextButton?.addEventListener('click', () => this.nextMonth());

        this.container.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', (e) => this.handleDateClick(e));
        });
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
        this.attachEventListeners();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
        this.attachEventListeners();
    }

    handleDateClick(event) {
        const dateStr = event.target.dataset.date;
        if (dateStr) {
            event.target.classList.toggle('selected');
            // Additional date selection logic can be added here
        }
    }
}

// Make Calendar available globally
window.Calendar = Calendar;
