// Part 1: Configuration and Core Setup
// =========================================

const CONFIG = {
    DEBUG: true,
    COLORS: {
        PTO: '#059669',
        BANK_HOLIDAY: '#f59e0b',
        WEEKEND: '#e5e7eb'
    },
    INITIAL_YEAR: 2024,
    MAX_PTO: 50,
    DEFAULT_PTO: 0,
    ANIMATION_DELAY: 100
};

// Global State Management
const GlobalState = {
    currentYear: CONFIG.INITIAL_YEAR,
    getCurrentYear: function() {
        return this.currentYear;
    },
    setCurrentYear: function(year) {
        this.currentYear = year;
    }
};

// Bank Holidays Data
const BANK_HOLIDAYS = {
    2024: [
        { date: '2024-01-01', title: "New Year's Day" },
        { date: '2024-03-29', title: "Good Friday" },
        { date: '2024-04-01', title: "Easter Monday" },
        { date: '2024-05-06', title: "Early May Bank Holiday" },
        { date: '2024-05-27', title: "Spring Bank Holiday" },
        { date: '2024-08-26', title: "Summer Bank Holiday" },
        { date: '2024-12-25', title: "Christmas Day" },
        { date: '2024-12-26', title: "Boxing Day" }
    ],
    2025: [
        { date: '2025-01-01', title: "New Year's Day" },
        { date: '2025-04-18', title: "Good Friday" },
        { date: '2025-04-21', title: "Easter Monday" },
        { date: '2025-05-05', title: "Early May Bank Holiday" },
        { date: '2025-05-26', title: "Spring Bank Holiday" },
        { date: '2025-08-25', title: "Summer Bank Holiday" },
        { date: '2025-12-25', title: "Christmas Day" },
        { date: '2025-12-26', title: "Boxing Day" }
    ],
    2026: [
        { date: '2026-01-01', title: "New Year's Day" },
        { date: '2026-04-03', title: "Good Friday" },
        { date: '2026-04-06', title: "Easter Monday" },
        { date: '2026-05-04', title: "Early May Bank Holiday" },
        { date: '2026-05-25', title: "Spring Bank Holiday" },
        { date: '2026-08-31', title: "Summer Bank Holiday" },
        { date: '2026-12-25', title: "Christmas Day" },
        { date: '2026-12-28', title: "Boxing Day (Substitute)" }
    ],
    2027: [
        { date: '2027-01-01', title: "New Year's Day" },
        { date: '2027-03-26', title: "Good Friday" },
        { date: '2027-03-29', title: "Easter Monday" },
        { date: '2027-05-03', title: "Early May Bank Holiday" },
        { date: '2027-05-31', title: "Spring Bank Holiday" },
        { date: '2027-08-30', title: "Summer Bank Holiday" },
        { date: '2027-12-27', title: "Christmas Day (Substitute)" },
        { date: '2027-12-28', title: "Boxing Day (Substitute)" }
    ],
    2028: [
        { date: '2028-01-03', title: "New Year's Day (Substitute)" },
        { date: '2028-04-14', title: "Good Friday" },
        { date: '2028-04-17', title: "Easter Monday" },
        { date: '2028-05-01', title: "Early May Bank Holiday" },
        { date: '2028-05-29', title: "Spring Bank Holiday" },
        { date: '2028-08-28', title: "Summer Bank Holiday" },
        { date: '2028-12-25', title: "Christmas Day" },
        { date: '2028-12-26', title: "Boxing Day" }
    ]
};

// Debug Utilities
function debugLog(message, data) {
    if (CONFIG.DEBUG) {
        console.log(`DEBUG: ${message}`, data || '');
    }
}

// Core Helper Functions
function formatDisplayDate(date) {
    return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
}

function isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
}

function isBankHoliday(date) {
    const dateStr = formatDate(date);
    return BANK_HOLIDAYS[GlobalState.getCurrentYear()]?.some(holiday => holiday.date === dateStr) || false;
}

function calculateWorkingDays(start, end) {
    let count = 0;
    let current = new Date(start);
    const endDate = new Date(end);
    
    while (current <= endDate) {
        if (!isWeekend(current) && !isBankHoliday(current)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return count;
}

// Month Names for Reference
const MONTH_NAMES = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
];
// Part 2: Core Classes
// =========================================

class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }

    emit(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => callback(data));
        }
    }
}

class StorageManager {
    constructor() {
        this.storageKey = 'alfie_pto_data_v1';
    }

    async save(data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(this.storageKey, serialized);
            debugLog('Data saved successfully', data);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }

    async load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Load error:', error);
            return null;
        }
    }
}

class UIManager {
    constructor(ptoManager) {
        this.ptoManager = ptoManager;
    }

    showLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    showError(message) {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonColor: CONFIG.COLORS.PTO
        });
    }

    showSuccess(message) {
        Swal.fire({
            title: 'Success',
            text: message,
            icon: 'success',
            timer: 1500,
            confirmButtonColor: CONFIG.COLORS.PTO
        });
    }

    addCalendarStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .fc-day-sat, .fc-day-sun {
                background-color: ${CONFIG.COLORS.WEEKEND}40 !important;
            }
            
            .fc-day-bank-holiday {
                background-color: ${CONFIG.COLORS.BANK_HOLIDAY}20 !important;
            }
            
            .bank-holiday {
                font-weight: 600 !important;
                font-size: 0.95em !important;
                margin: 1px 0 !important;
                padding: 2px !important;
                color: #B45309 !important;
            }
            
            .pto-day {
                font-weight: 500 !important;
                font-size: 0.9em !important;
                margin: 1px 0 !important;
                padding: 2px !important;
                color: white !important;
                background-color: ${CONFIG.COLORS.PTO} !important;
                border-color: ${CONFIG.COLORS.PTO} !important;
            }
            
            .fc .fc-daygrid-day.fc-day-today {
                background-color: rgba(5, 150, 105, 0.15) !important;
            }
            
            .fc-event {
                border-radius: 2px !important;
                border: none !important;
            }
        `;
        document.head.appendChild(styleSheet);
    }

    updateSummary() {
        const elements = {
            totalPTO: document.getElementById('totalPTO'),
            plannedPTO: document.getElementById('plannedPTO'),
            remainingPTO: document.getElementById('remainingPTO'),
            bankHolidays: document.getElementById('bankHolidays')
        };

        if (elements.totalPTO) elements.totalPTO.textContent = this.ptoManager.state.userData.totalPTO;
        if (elements.plannedPTO) elements.plannedPTO.textContent = this.ptoManager.state.userData.plannedPTO;
        if (elements.remainingPTO) {
            elements.remainingPTO.textContent = 
                this.ptoManager.state.userData.totalPTO - this.ptoManager.state.userData.plannedPTO;
        }
        if (elements.bankHolidays) {
            elements.bankHolidays.textContent = BANK_HOLIDAYS[GlobalState.getCurrentYear()]?.length || 0;
        }

        this.updateUpcomingHolidays();
    }

    updateUpcomingHolidays() {
        const container = document.getElementById('upcomingHolidaysList');
        if (!container) return;

        const currentYear = GlobalState.getCurrentYear();
        const currentDate = new Date();
        const upcomingHolidays = BANK_HOLIDAYS[currentYear]
            ?.filter(holiday => new Date(holiday.date) >= currentDate)
            .slice(0, 3);

        container.innerHTML = upcomingHolidays?.length
            ? upcomingHolidays.map(holiday => `
                <div class="holiday-item">
                    <div class="holiday-date">${formatDisplayDate(holiday.date)}</div>
                    <div class="holiday-title">${holiday.title}</div>
                </div>
            `).join('')
            : '<p>No upcoming holidays</p>';
    }
}
// Part 3: Calendar Manager
// =========================================

class CalendarManager {
    constructor(ptoManager) {
        this.ptoManager = ptoManager;
        this.calendarEl = null;
        this.calendar = null;
    }

    async initialize() {
        debugLog('Initializing calendar manager');
        this.calendarEl = document.getElementById('calendar');
        
        if (!this.calendarEl) {
            throw new Error('Calendar element not found');
        }

        try {
            this.calendar = new FullCalendar.Calendar(this.calendarEl, {
                initialView: 'dayGridMonth',
                firstDay: 1,
                initialDate: `${GlobalState.getCurrentYear()}-01-01`,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek'
                },
                selectable: true,
                selectConstraint: {
                    start: `${GlobalState.getCurrentYear()}-01-01`,
                    end: `${GlobalState.getCurrentYear()}-12-31`
                },
                select: (selectInfo) => this.handleDateSelection(selectInfo),
                eventDidMount: (info) => {
                    if (info.event.classNames.includes('bank-holiday')) {
                        info.el.style.backgroundColor = CONFIG.COLORS.BANK_HOLIDAY;
                    }
                },
                events: (info, successCallback) => {
                    const events = this.generateEvents();
                    successCallback(events);
                },
                eventClick: (info) => {
                    if (info.event.classNames.includes('pto-day')) {
                        this.handlePTOClick(info.event);
                    }
                },
                dayCellDidMount: (arg) => {
                    if (isWeekend(arg.date)) {
                        arg.el.classList.add('fc-day-sat');
                    }
                    if (isBankHoliday(arg.date)) {
                        arg.el.classList.add('fc-day-bank-holiday');
                    }
                },
                displayEventTime: false,
                eventDisplay: 'block',
                height: 'auto',
                dayMaxEvents: true,
                eventColor: CONFIG.COLORS.PTO,
                selectOverlap: false,
                validRange: {
                    start: `${GlobalState.getCurrentYear()}-01-01`,
                    end: `${GlobalState.getCurrentYear()}-12-31`
                }
            });

            await this.calendar.render();
            this.markBankHolidays();
            debugLog('Calendar initialized successfully');

        } catch (error) {
            console.error('Calendar initialization error:', error);
            throw error;
        }
    }

    handleDateSelection(selectInfo) {
        const startDate = selectInfo.start;
        const endDate = new Date(selectInfo.end);
        endDate.setDate(endDate.getDate() - 1); // Adjust end date
        
        if (startDate < new Date()) {
            this.ptoManager.uiManager.showError('Cannot select past dates');
            return;
        }

        const workingDays = calculateWorkingDays(startDate, endDate);
        if (workingDays === 0) {
            this.ptoManager.uiManager.showError('No working days selected');
            return;
        }

        const remainingPTO = this.ptoManager.state.userData.totalPTO - this.ptoManager.state.userData.plannedPTO;
        if (workingDays > remainingPTO) {
            this.ptoManager.uiManager.showError(
                `Not enough PTO days remaining. You have ${remainingPTO} days left.`
            );
            return;
        }

        Swal.fire({
            title: 'Confirm PTO Selection',
            html: `
                <p>Selected dates: ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}</p>
                <p>Working days: ${workingDays}</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: CONFIG.COLORS.PTO,
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, add PTO'
        }).then((result) => {
            if (result.isConfirmed) {
                this.addPTODays(startDate, endDate);
            }
        });
    }

    handlePTOClick(event) {
        Swal.fire({
            title: 'Remove PTO Day?',
            text: `Would you like to remove the PTO day on ${formatDisplayDate(event.start)}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it'
        }).then((result) => {
            if (result.isConfirmed) {
                this.removePTODay(formatDate(event.start));
            }
        });
    }

    addPTODays(start, end) {
        const currentYear = GlobalState.getCurrentYear();
        if (!this.ptoManager.state.userData.selectedDates[currentYear]) {
            this.ptoManager.state.userData.selectedDates[currentYear] = [];
        }

        let current = new Date(start);
        const endDate = new Date(end);
        let addedDays = 0;

        while (current <= endDate) {
            if (!isWeekend(current) && !isBankHoliday(current)) {
                const dateStr = formatDate(current);
                if (!this.ptoManager.state.userData.selectedDates[currentYear].includes(dateStr)) {
                    this.ptoManager.state.userData.selectedDates[currentYear].push(dateStr);
                    addedDays++;
                }
            }
            current.setDate(current.getDate() + 1);
        }

        this.ptoManager.state.userData.plannedPTO += addedDays;
        this.ptoManager.storageManager.save(this.ptoManager.state.userData);
        this.refreshCalendar();
        this.ptoManager.uiManager.updateSummary();
        this.ptoManager.uiManager.showSuccess(`Added ${addedDays} PTO day(s)`);
    }

    removePTODay(dateStr) {
        const currentYear = GlobalState.getCurrentYear();
        const dates = this.ptoManager.state.userData.selectedDates[currentYear];
        
        if (dates) {
            const index = dates.indexOf(dateStr);
            if (index > -1) {
                dates.splice(index, 1);
                this.ptoManager.state.userData.plannedPTO--;
                this.ptoManager.storageManager.save(this.ptoManager.state.userData);
                this.refreshCalendar();
                this.ptoManager.uiManager.updateSummary();
                this.ptoManager.uiManager.showSuccess('PTO day removed');
            }
        }
    }

    generateEvents() {
        const events = [];
        const currentYear = GlobalState.getCurrentYear();
        
        // Add bank holidays
        const currentYearHolidays = BANK_HOLIDAYS[currentYear];
        if (currentYearHolidays) {
            currentYearHolidays.forEach(holiday => {
                events.push({
                    title: holiday.title,
                    start: holiday.date,
                    className: 'bank-holiday',
                    color: CONFIG.COLORS.BANK_HOLIDAY,
                    allDay: true
                });
            });
        }

        // Add PTO days
        const ptoEvents = this.ptoManager.state.userData.selectedDates[currentYear] || [];
        ptoEvents.forEach(date => {
            events.push({
                title: 'PTO Day',
                start: date,
                className: 'pto-day',
                color: CONFIG.COLORS.PTO,
                allDay: true
            });
        });

        return events;
    }

    markBankHolidays() {
        const currentYearHolidays = BANK_HOLIDAYS[GlobalState.getCurrentYear()];
        if (!currentYearHolidays) return;

        currentYearHolidays.forEach(holiday => {
            const dateEl = this.calendar.el.querySelector(`[data-date="${holiday.date}"]`);
            if (dateEl) {
                dateEl.classList.add('fc-day-bank-holiday');
                dateEl.setAttribute('title', holiday.title);
            }
        });
    }

    refreshCalendar() {
        if (this.calendar) {
            this.calendar.removeAllEvents();
            const events = this.generateEvents();
            this.calendar.addEventSource(events);
            this.markBankHolidays();
        }
    }
}
// Part 4: Setup Wizard
// =========================================

class SetupWizard {
    constructor(ptoManager) {
        this.ptoManager = ptoManager;
        this.currentStep = 1;
        this.totalSteps = 3;
    }

    initialize() {
        debugLog('Initializing setup wizard');
        const modal = document.getElementById('setupModal');
        
        if (!modal) {
            this.ptoManager.uiManager.showError('Setup wizard could not be initialized');
            return;
        }

        modal.style.display = 'flex';
        this.showStep(1);
        this.setupEventListeners();
        this.populateMonthSelector();
        this.populateBankHolidays();
    }

    showStep(step) {
        document.querySelectorAll('.wizard-step').forEach(el => {
            el.setAttribute('data-state', 'hidden');
        });
        
        const stepElement = document.querySelector(`.wizard-step[data-step="${step}"]`);
        if (stepElement) {
            stepElement.setAttribute('data-state', 'visible');
        }

        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');

        if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'block';
        if (nextBtn) {
            nextBtn.textContent = step === this.totalSteps ? 'Finish' : 'Next';
        }
    }

    populateMonthSelector() {
        const container = document.querySelector('.month-selector');
        if (!container) return;

        container.innerHTML = MONTH_NAMES.map((month, index) => `
            <div class="month-option">
                <input type="checkbox" id="month-${index}" value="${index}" 
                    ${this.ptoManager.state.userData.preferredMonths?.includes(index) ? 'checked' : ''}>
                <label for="month-${index}">${month}</label>
            </div>
        `).join('');
    }

    populateBankHolidays() {
        const container = document.querySelector('.bank-holiday-list');
        if (!container) return;

        const currentYear = GlobalState.getCurrentYear();
        const holidays = BANK_HOLIDAYS[currentYear];

        container.innerHTML = holidays ? holidays.map(holiday => `
            <div class="bank-holiday-item">
                <input type="checkbox" id="holiday-${holiday.date}" 
                    value="${holiday.date}"
                    ${this.ptoManager.state.userData.extendedHolidays?.includes(holiday.date) ? 'checked' : ''}>
                <label for="holiday-${holiday.date}">
                    <strong>${formatDisplayDate(holiday.date)}</strong>
                    <span>${holiday.title}</span>
                </label>
            </div>
        `).join('') : '<p>No bank holidays found for selected year</p>';
    }

    setupEventListeners() {
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');
        const closeBtn = document.getElementById('closeSetup');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentStep > 1) {
                    this.currentStep--;
                    this.showStep(this.currentStep);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.validateCurrentStep()) {
                    if (this.currentStep < this.totalSteps) {
                        this.currentStep++;
                        this.showStep(this.currentStep);
                    } else {
                        this.saveAndClose();
                    }
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.handleClose();
            });
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                const totalPTO = parseInt(document.getElementById('totalPTOInput').value);
                const plannedPTO = parseInt(document.getElementById('plannedPTOInput').value);
                
                if (isNaN(totalPTO) || totalPTO < 0 || totalPTO > CONFIG.MAX_PTO) {
                    this.ptoManager.uiManager.showError(`Please enter a valid PTO amount (0-${CONFIG.MAX_PTO})`);
                    return false;
                }
                
                if (isNaN(plannedPTO) || plannedPTO < 0 || plannedPTO > totalPTO) {
                    this.ptoManager.uiManager.showError('Invalid planned PTO amount');
                    return false;
                }
                return true;

            case 2:
            case 3:
                return true;

            default:
                return false;
        }
    }

    saveAndClose() {
        // Save PTO allocation
        const totalPTO = parseInt(document.getElementById('totalPTOInput').value);
        const plannedPTO = parseInt(document.getElementById('plannedPTOInput').value);
        
        // Save bank holiday extensions
        const extendedHolidays = Array.from(document.querySelectorAll('.bank-holiday-item input:checked'))
            .map(input => input.value);
            
        // Save preferred months
        const preferredMonths = Array.from(document.querySelectorAll('.month-option input:checked'))
            .map(input => parseInt(input.value));

        // Update state
        this.ptoManager.state.userData = {
            ...this.ptoManager.state.userData,
            totalPTO,
            plannedPTO,
            extendedHolidays,
            preferredMonths,
            selectedDates: this.ptoManager.state.userData.selectedDates || {}
        };

        // Save and update UI
        this.ptoManager.storageManager.save(this.ptoManager.state.userData);
        this.ptoManager.uiManager.updateSummary();
        this.ptoManager.calendarManager.refreshCalendar();
        
        // Close modal
        const modal = document.getElementById('setupModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        this.ptoManager.uiManager.showSuccess('Settings saved successfully');
    }

    handleClose() {
        const modal = document.getElementById('setupModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Part 5: Main PTO Manager and Initialization
// =========================================

class PTOManager {
    constructor() {
        this.state = {
            userData: {
                totalPTO: CONFIG.DEFAULT_PTO,
                plannedPTO: 0,
                selectedDates: {},
                extendedHolidays: [],
                preferredMonths: []
            }
        };
        
        this.eventEmitter = new EventEmitter();
        this.storageManager = new StorageManager();
        this.uiManager = new UIManager(this);
        this.setupWizard = new SetupWizard(this);
        this.calendarManager = new CalendarManager(this);
    }

    async initialize() {
        debugLog('Initializing PTO Manager');
        
        try {
            this.uiManager.showLoading();
            
            // Load saved data
            const savedData = await this.storageManager.load();
            if (savedData) {
                this.state.userData = savedData;
            }

            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI components
            this.uiManager.addCalendarStyles();
            this.uiManager.updateSummary();
            
            debugLog('PTO Manager initialized successfully');
            this.uiManager.hideLoading();

        } catch (error) {
            console.error('Initialization error:', error);
            this.uiManager.showError('Failed to initialize application');
            this.uiManager.hideLoading();
        }
    }

    setupEventListeners() {
        const getStartedBtn = document.getElementById('getStartedBtn');
        const setupPTOBtn = document.getElementById('setupPTOBtn');
        const exportBtn = document.getElementById('exportBtn');
        const yearSelect = document.getElementById('yearSelect');

        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => this.handleGetStarted());
        }

        if (setupPTOBtn) {
            setupPTOBtn.addEventListener('click', () => this.setupWizard.initialize());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCalendar());
        }

        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => this.handleYearChange(e));
        }
    }

    handleGetStarted() {
        debugLog('Handling Get Started action');
        const welcomeScreen = document.getElementById('welcomeScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (welcomeScreen && appContainer) {
            welcomeScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            
            this.calendarManager.initialize().then(() => {
                debugLog('Calendar initialized after welcome screen');
                this.setupWizard.initialize();
            }).catch(error => {
                console.error('Failed to initialize calendar:', error);
                this.uiManager.showError('Failed to initialize calendar');
            });
        }
    }

    handleYearChange(e) {
        const newYear = parseInt(e.target.value);
        if (newYear !== GlobalState.getCurrentYear()) {
            GlobalState.setCurrentYear(newYear);
            if (!this.state.userData.selectedDates[newYear]) {
                this.state.userData.selectedDates[newYear] = [];
            }
            this.calendarManager.refreshCalendar();
            this.uiManager.updateSummary();
        }
    }

    async exportCalendar() {
        try {
            const exportData = {
                events: this.calendarManager.generateEvents(),
                userData: this.state.userData,
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pto-calendar-export-${GlobalState.getCurrentYear()}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.uiManager.showSuccess('Calendar exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            this.uiManager.showError('Failed to export calendar');
        }
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM Content Loaded - Starting initialization');
    
    try {
        const app = new PTOManager();
        app.initialize().catch(error => {
            console.error('Application initialization failed:', error);
        });
    } catch (error) {
        console.error('Critical initialization error:', error);
    }
});
