// Calendar.js - Simple calendar component for Alfie PTO Planner
class Calendar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const calendar = document.createElement('div');
        calendar.className = 'calendar-container';
        
        calendar.innerHTML = `
            <div class="calendar-header">
                <button class="nav-btn" id="prevMonth">&lt;</button>
                <h2>${this.getMonthName(month)} ${year}</h2>
                <button class="nav-btn" id="nextMonth">&gt;</button>
            </div>
            <div class="calendar-grid">
                ${this.generateWeekdayHeader()}
                ${this.generateDaysGrid(year, month)}
            </div>
        `;
        
        this.container.innerHTML = '';
        this.container.appendChild(calendar);
    }

    generateWeekdayHeader() {
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `
            <div class="weekday-header">
                ${weekdays.map(day => `<div class="weekday">${day}</div>`).join('')}
            </div>
        `;
    }

    generateDaysGrid(year, month) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();
        
        let days = [];
        
        // Previous month's days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push(`<div class="calendar-day prev-month">${prevMonthDays - i}</div>`);
        }
        
        // Current month's days
        for (let i = 1; i <= daysInMonth; i++) {
            const isToday = this.isToday(year, month, i);
            const isSelected = this.isSelected(year, month, i);
            const isWeekend = this.isWeekend(year, month, i);
            
            days.push(`
                <div class="calendar-day current-month${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isWeekend ? ' weekend' : ''}" 
                    data-date="${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}">
                    ${i}
                </div>
            `);
        }
        
        // Next month's days
        const remainingDays = 42 - days.length; // Always show 6 weeks
        for (let i = 1; i <= remainingDays; i++) {
            days.push(`<div class="calendar-day next-month">${i}</div>`);
        }
        
        return `<div class="days-grid">${days.join('')}</div>`;
    }

    attachEventListeners() {
        // Month navigation
        this.container.querySelector('#prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });
        
        this.container.querySelector('#nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
        
        // Day selection
        this.container.addEventListener('click', (e) => {
            const dayCell = e.target.closest('.calendar-day.current-month');
            if (dayCell) {
                const dateStr = dayCell.dataset.date;
                this.selectedDate = new Date(dateStr);
                this.render();
                
                // Emit custom event for date selection
                const event = new CustomEvent('dateSelected', {
                    detail: { date: this.selectedDate }
                });
                this.container.dispatchEvent(event);
            }
        });
    }

    // Helper methods
    getMonthName(month) {
        return new Date(2000, month).toLocaleString('default', { month: 'long' });
    }

    isToday(year, month, day) {
        const today = new Date();
        return year === today.getFullYear() 
            && month === today.getMonth() 
            && day === today.getDate();
    }

    isSelected(year, month, day) {
        return year === this.selectedDate.getFullYear() 
            && month === this.selectedDate.getMonth() 
            && day === this.selectedDate.getDate();
    }

    isWeekend(year, month, day) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    }
}

export default Calendar;
