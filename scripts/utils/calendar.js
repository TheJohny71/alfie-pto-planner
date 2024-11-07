// Calendar.js
class Calendar {
    constructor(container) {
        this.container = container;
        this.currentDate = new Date();
        this.selectedDates = [];
        this.region = 'US';
    }

    generateCalendarHTML() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

        let html = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="calendar-nav" onclick="calendar.prevMonth()">&lt;</button>
                    <h2>${monthNames[month]} ${year}</h2>
                    <button class="calendar-nav" onclick="calendar.nextMonth()">&gt;</button>
                </div>
                <div class="calendar-grid">
                    <div class="calendar-day-header">Sun</div>
                    <div class="calendar-day-header">Mon</div>
                    <div class="calendar-day-header">Tue</div>
                    <div class="calendar-day-header">Wed</div>
                    <div class="calendar-day-header">Thu</div>
                    <div class="calendar-day-header">Fri</div>
                    <div class="calendar-day-header">Sat</div>
        `;

        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Add cells for each day of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isSelected = this.selectedDates.some(d => 
                d.getDate() === day && 
                d.getMonth() === month && 
                d.getFullYear() === year
            );

            html += `
                <div class="calendar-day ${isWeekend ? 'weekend' : ''} ${isSelected ? 'selected' : ''}"
                     onclick="calendar.toggleDate(${year}, ${month}, ${day})">
                    ${day}
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    render() {
        this.container.innerHTML = this.generateCalendarHTML();
    }

    toggleDate(year, month, day) {
        const date = new Date(year, month, day);
        const index = this.selectedDates.findIndex(d => 
            d.getDate() === day && 
            d.getMonth() === month && 
            d.getFullYear() === year
        );

        if (index === -1) {
            this.selectedDates.push(date);
        } else {
            this.selectedDates.splice(index, 1);
        }

        this.render();
    }

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }
}

export default Calendar;
