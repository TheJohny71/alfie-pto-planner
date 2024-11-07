// Calendar.js - Enhanced version with region switching, holidays, and PTO requests
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedRegion = localStorage.getItem('selectedRegion') || 'US';
        this.holidays = {
            US: {
                federal: {
                    '2024-01-01': 'New Year\'s Day',
                    '2024-01-15': 'Martin Luther King Jr. Day',
                    '2024-02-19': 'Presidents\' Day',
                    '2024-05-27': 'Memorial Day',
                    '2024-06-19': 'Juneteenth',
                    '2024-07-04': 'Independence Day',
                    '2024-09-02': 'Labor Day',
                    '2024-10-14': 'Columbus Day',
                    '2024-11-11': 'Veterans Day',
                    '2024-11-28': 'Thanksgiving Day',
                    '2024-12-25': 'Christmas Day'
                },
                observance: {
                    '2024-02-14': 'Valentine\'s Day',
                    '2024-03-17': 'St. Patrick\'s Day',
                    '2024-10-31': 'Halloween',
                }
            },
            UK: {
                bank: {
                    '2024-01-01': 'New Year\'s Day',
                    '2024-03-29': 'Good Friday',
                    '2024-04-01': 'Easter Monday',
                    '2024-05-06': 'Early May Bank Holiday',
                    '2024-05-27': 'Spring Bank Holiday',
                    '2024-08-26': 'Summer Bank Holiday',
                    '2024-12-25': 'Christmas Day',
                    '2024-12-26': 'Boxing Day'
                },
                observance: {
                    '2024-02-14': 'Valentine\'s Day',
                    '2024-03-17': 'St. Patrick\'s Day',
                    '2024-10-31': 'Halloween',
                }
            }
        };
        
        this.initializeCalendar();
    }

    initializeCalendar() {
        this.setupRegionSwitcher();
        this.setupHolidayLegend();
        this.setupPTOForm();
        this.renderCalendar();
        this.setupEventListeners();
    }

    setupRegionSwitcher() {
        const regionContainer = document.createElement('div');
        regionContainer.className = 'region-switcher';
        regionContainer.innerHTML = `
            <label for="region-select">Select Region:</label>
            <select id="region-select" class="region-select">
                <option value="US" ${this.selectedRegion === 'US' ? 'selected' : ''}>United States</option>
                <option value="UK" ${this.selectedRegion === 'UK' ? 'selected' : ''}>United Kingdom</option>
            </select>
        `;
        document.querySelector('.calendar-container').prepend(regionContainer);
    }

    setupHolidayLegend() {
        const legendContainer = document.createElement('div');
        legendContainer.className = 'holiday-legend';
        legendContainer.innerHTML = `
            <div class="legend-item">
                <span class="legend-color federal-holiday"></span>
                <span>${this.selectedRegion === 'US' ? 'Federal Holiday' : 'Bank Holiday'}</span>
            </div>
            <div class="legend-item">
                <span class="legend-color observance-holiday"></span>
                <span>Observance</span>
            </div>
            <div class="legend-item">
                <span class="legend-color pto-day"></span>
                <span>${this.selectedRegion === 'US' ? 'PTO' : 'Annual Leave'}</span>
            </div>
        `;
        document.querySelector('.calendar-container').appendChild(legendContainer);
    }

    setupPTOForm() {
        const formContainer = document.createElement('div');
        formContainer.className = 'pto-form';
        formContainer.innerHTML = `
            <h3>${this.selectedRegion === 'US' ? 'Request PTO' : 'Request Annual Leave'}</h3>
            <form id="pto-request-form">
                <div class="form-group">
                    <label for="pto-start">Start Date:</label>
                    <input type="date" id="pto-start" required>
                </div>
                <div class="form-group">
                    <label for="pto-end">End Date:</label>
                    <input type="date" id="pto-end" required>
                </div>
                <div class="form-group">
                    <label for="pto-reason">Reason:</label>
                    <textarea id="pto-reason" required></textarea>
                </div>
                <button type="submit" class="submit-btn">Submit Request</button>
            </form>
        `;
        document.querySelector('.calendar-container').appendChild(formContainer);
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];

        const calendarGrid = document.querySelector('.calendar-grid');
        calendarGrid.innerHTML = '';

        // Render month and year
        document.querySelector('.current-month').textContent = `${monthNames[month]} ${year}`;

        // Render day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Add empty cells for days before the first of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        // Render days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'calendar-day';
            
            const currentDateString = this.formatDate(year, month + 1, day);
            const holidayType = this.getHolidayType(currentDateString);
            
            if (holidayType) {
                dateCell.classList.add(`${holidayType}-holiday`);
                dateCell.setAttribute('title', this.getHolidayName(currentDateString));
            }

            dateCell.textContent = day;
            calendarGrid.appendChild(dateCell);
        }
    }

    formatDate(year, month, day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    getHolidayType(dateString) {
        const regionHolidays = this.holidays[this.selectedRegion];
        if (regionHolidays.federal && dateString in regionHolidays.federal) return 'federal';
        if (regionHolidays.bank && dateString in regionHolidays.bank) return 'federal';
        if (regionHolidays.observance && dateString in regionHolidays.observance) return 'observance';
        return null;
    }

    getHolidayName(dateString) {
        const regionHolidays = this.holidays[this.selectedRegion];
        return regionHolidays.federal?.[dateString] || 
               regionHolidays.bank?.[dateString] || 
               regionHolidays.observance?.[dateString];
    }

    setupEventListeners() {
        // Region switcher
        document.getElementById('region-select').addEventListener('change', (e) => {
            this.selectedRegion = e.target.value;
            localStorage.setItem('selectedRegion', this.selectedRegion);
            this.renderCalendar();
            this.updateRegionSpecificText();
        });

        // Navigation buttons
        document.querySelector('.prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.querySelector('.next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // PTO form submission
        document.getElementById('pto-request-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePTOSubmission();
        });
    }

    updateRegionSpecificText() {
        const ptoTitle = document.querySelector('.pto-form h3');
        ptoTitle.textContent = this.selectedRegion === 'US' ? 'Request PTO' : 'Request Annual Leave';
        
        const legendItems = document.querySelectorAll('.legend-item');
        legendItems[0].querySelector('span:last-child').textContent = 
            this.selectedRegion === 'US' ? 'Federal Holiday' : 'Bank Holiday';
        legendItems[2].querySelector('span:last-child').textContent = 
            this.selectedRegion === 'US' ? 'PTO' : 'Annual Leave';
    }

    handlePTOSubmission() {
        const startDate = document.getElementById('pto-start').value;
        const endDate = document.getElementById('pto-end').value;
        const reason = document.getElementById('pto-reason').value;

        // SweetAlert2 confirmation
        Swal.fire({
            title: `${this.selectedRegion === 'US' ? 'PTO' : 'Annual Leave'} Request`,
            html: `
                <p>Start Date: ${startDate}</p>
                <p>End Date: ${endDate}</p>
                <p>Reason: ${reason}</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Submit Request',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // Here you would typically send the request to your backend
                Swal.fire(
                    'Success!',
                    `Your ${this.selectedRegion === 'US' ? 'PTO' : 'Annual Leave'} request has been submitted.`,
                    'success'
                );
                document.getElementById('pto-request-form').reset();
            }
        });
    }
}

// Export the Calendar class
export default Calendar;
