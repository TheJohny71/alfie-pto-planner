// Calendar.js
class Calendar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.region = localStorage.getItem('preferredRegion') || 'US';
        this.holidays = {
            'US': {
                // 2024 US Federal Holidays
                '2024-01-01': { name: 'New Year\'s Day', type: 'federal' },
                '2024-01-15': { name: 'Martin Luther King Jr. Day', type: 'federal' },
                '2024-02-19': { name: 'Presidents Day', type: 'federal' },
                '2024-05-27': { name: 'Memorial Day', type: 'federal' },
                '2024-06-19': { name: 'Juneteenth', type: 'federal' },
                '2024-07-04': { name: 'Independence Day', type: 'federal' },
                '2024-09-02': { name: 'Labor Day', type: 'federal' },
                '2024-10-14': { name: 'Columbus Day', type: 'federal' },
                '2024-11-11': { name: 'Veterans Day', type: 'federal' },
                '2024-11-28': { name: 'Thanksgiving Day', type: 'federal' },
                '2024-12-25': { name: 'Christmas Day', type: 'federal' },
                // Common US Observances
                '2024-02-14': { name: 'Valentine\'s Day', type: 'observance' },
                '2024-03-17': { name: 'St. Patrick\'s Day', type: 'observance' },
                '2024-05-12': { name: 'Mother\'s Day', type: 'observance' },
                '2024-06-16': { name: 'Father\'s Day', type: 'observance' },
                '2024-10-31': { name: 'Halloween', type: 'observance' }
            },
            'UK': {
                // 2024 UK Bank Holidays
                '2024-01-01': { name: 'New Year\'s Day', type: 'bank' },
                '2024-03-29': { name: 'Good Friday', type: 'bank' },
                '2024-04-01': { name: 'Easter Monday', type: 'bank' },
                '2024-05-06': { name: 'Early May Bank Holiday', type: 'bank' },
                '2024-05-27': { name: 'Spring Bank Holiday', type: 'bank' },
                '2024-08-26': { name: 'Summer Bank Holiday', type: 'bank' },
                '2024-12-25': { name: 'Christmas Day', type: 'bank' },
                '2024-12-26': { name: 'Boxing Day', type: 'bank' },
                // Common UK Observances
                '2024-02-14': { name: 'Valentine\'s Day', type: 'observance' },
                '2024-03-17': { name: 'St. Patrick\'s Day', type: 'observance' },
                '2024-03-10': { name: 'Mother\'s Day', type: 'observance' },
                '2024-06-16': { name: 'Father\'s Day', type: 'observance' },
                '2024-10-31': { name: 'Halloween', type: 'observance' }
            }
        };
        this.init();
    }
    init() {
        this.createRegionSwitcher();
        this.render();
        this.attachEventListeners();
    }

    createRegionSwitcher() {
        const switcherContainer = document.createElement('div');
        switcherContainer.className = 'region-switcher';
        switcherContainer.innerHTML = `
            <label class="switch">
                <input type="checkbox" ${this.region === 'UK' ? 'checked' : ''}>
                <span class="slider"></span>
                <span class="region-label">US</span>
                <span class="region-label">UK</span>
            </label>
        `;
        this.container.appendChild(switcherContainer);
    }

    setRegion(region) {
        this.region = region;
        localStorage.setItem('preferredRegion', region);
        this.render();
    }

    getHolidayForDate(date) {
        const dateString = date.toISOString().split('T')[0];
        return this.holidays[this.region][dateString];
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
            <div class="pto-form-container" id="ptoForm"></div>
        `;
        
        // Keep the region switcher, clear the rest
        const regionSwitcher = this.container.querySelector('.region-switcher');
        this.container.innerHTML = '';
        this.container.appendChild(regionSwitcher);
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
            const currentDate = new Date(year, month, i);
            const isToday = this.isToday(year, month, i);
            const isSelected = this.isSelected(year, month, i);
            const isWeekend = this.isWeekend(year, month, i);
            const holiday = this.getHolidayForDate(currentDate);
            
            const classes = [
                'calendar-day',
                'current-month',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                isWeekend ? 'weekend' : '',
                holiday ? `holiday holiday-${holiday.type}` : ''
            ].filter(Boolean).join(' ');
            
            const holidayTitle = holiday ? `title="${holiday.name}"` : '';
            
            days.push(`
                <div class="${classes}"
                    data-date="${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}"
                    ${holidayTitle}>
                    ${i}
                    ${holiday ? `<div class="holiday-indicator ${holiday.type}"></div>` : ''}
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
        // Region switcher
        const switcher = this.container.querySelector('.switch input');
        switcher.addEventListener('change', (e) => {
            this.setRegion(e.target.checked ? 'UK' : 'US');
        });

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
                
                // Show PTO request form
                this.showPTOForm(this.selectedDate);
                
                // Emit date selection event
                const event = new CustomEvent('dateSelected', {
                    detail: { 
                        date: this.selectedDate,
                        holiday: this.getHolidayForDate(this.selectedDate)
                    }
                });
                this.container.dispatchEvent(event);
            }
        });
    }
    showPTOForm(date) {
        const formContainer = this.container.querySelector('#ptoForm');
        const holiday = this.getHolidayForDate(date);
        const dateString = date.toLocaleDateString();
        const isWeekend = this.isWeekend(date.getFullYear(), date.getMonth(), date.getDate());
        
        formContainer.innerHTML = `
            <div class="pto-form">
                <h3>${this.region === 'US' ? 'PTO' : 'Annual Leave'} Request</h3>
                <p>Selected Date: ${dateString}</p>
                ${holiday ? `<p class="holiday-note">Note: This is a ${holiday.type} holiday (${holiday.name})</p>` : ''}
                ${isWeekend ? `<p class="weekend-note">Note: This is a weekend</p>` : ''}
                <form id="ptoRequestForm">
                    <div class="form-group">
                        <label for="leaveType">Type of Leave:</label>
                        <select id="leaveType" required>
                            <option value="full">Full Day</option>
                            <option value="morning">Morning Only</option>
                            <option value="afternoon">Afternoon Only</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reason">Reason (optional):</label>
                        <textarea id="reason" rows="3"></textarea>
                    </div>
                    <button type="submit" class="submit-btn">Submit Request</button>
                </form>
            </div>
        `;

        // Add form submission handler
        const form = formContainer.querySelector('#ptoRequestForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                date: dateString,
                type: form.querySelector('#leaveType').value,
                reason: form.querySelector('#reason').value
            };
            this.submitPTORequest(formData);
        });
    }

    async submitPTORequest(formData) {
        try {
            // Show success message using SweetAlert2
            await Swal.fire({
                icon: 'success',
                title: `${this.region === 'US' ? 'PTO' : 'Annual Leave'} Request Submitted`,
                text: 'Your request has been submitted successfully!',
                confirmButtonColor: '#228be6'
            });
            
            // Clear the form
            const formContainer = this.container.querySelector('#ptoForm');
            formContainer.innerHTML = '';
            
            // Here you would typically send this to your backend
            console.log('PTO Request:', formData);
            
        } catch (error) {
            console.error('Error submitting PTO request:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'There was an error submitting your request. Please try again.',
                confirmButtonColor: '#228be6'
            });
        }
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
