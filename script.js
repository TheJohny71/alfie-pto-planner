// Part 1: Configuration and Core Setup
// =========================================

// Global Configuration
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

// Debug State Management
window.debugState = {
    lastAction: null,
    selectedDates: [],
    events: []
};

// Debug Utilities
function debugLog(message, data) {
    if (CONFIG.DEBUG) {
        console.log(`DEBUG: ${message}`, data || '');
    }
}

function logState(action, data) {
    if (CONFIG.DEBUG) {
        window.debugState.lastAction = action;
        console.group(`PTO Action: ${action}`);
        console.log('Data:', data);
        console.log('Current userData:', JSON.parse(JSON.stringify(userData)));
        console.log('Calendar State:', calendar ? 'Initialized' : 'Not Initialized');
        console.groupEnd();
    }
}

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
        { date: '2026-12-28', title: "Boxing Day (Substitute Day)" }
    ]
};

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
    
    while (current <= end) {
        if (!isWeekend(current) && !isBankHoliday(current)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return count;
}
// Part 2: Core Classes
// =========================================

// Event Management
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

// Storage Management
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
            debugLog('Data loaded', data);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Load error:', error);
            return null;
        }
    }
}

// UI Management
class UIManager {
    constructor(ptoManager) {
        this.ptoManager = ptoManager;
    }

    showLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.classList.remove('hidden');
            debugLog('Loading indicator shown');
        }
    }

    hideLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.classList.add('hidden');
            debugLog('Loading indicator hidden');
        }
    }

    showError(message) {
        debugLog('Error:', message);
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonColor: CONFIG.COLORS.PTO
        });
    }

    showSuccess(message) {
        debugLog('Success:', message);
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
            .fc-day-bank-holiday {
                background-color: rgba(245, 158, 11, 0.1) !important;
            }
            
            .bank-holiday {
                font-weight: 600 !important;
                font-size: 0.95em !important;
                margin: 1px 0 !important;
                padding: 2px !important;
                color: #B45309 !important;
                text-shadow: 0px 0px 1px rgba(255, 255, 255, 0.8);
            }

            .pto-day {
                font-weight: 500 !important;
                font-size: 0.9em !important;
                margin: 1px 0 !important;
                padding: 2px !important;
                color: white !important;
                background-color: var(--pto-green) !important;
                border-color: var(--pto-green) !important;
            }
        `;
        document.head.appendChild(styleSheet);
        debugLog('Calendar styles added');
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
        if (elements.bankHolidays && BANK_HOLIDAYS[GlobalState.getCurrentYear()]) {
            elements.bankHolidays.textContent = BANK_HOLIDAYS[GlobalState.getCurrentYear()].length;
        }
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
                    // Add any event-specific styling here
                    if (info.event.classNames.includes('bank-holiday')) {
                        info.el.style.backgroundColor = CONFIG.COLORS.BANK_HOLIDAY;
                    }
                },
                events: (info, successCallback) => {
                    const events = this.generateEvents();
                    successCallback(events);
                },
                eventClick: (info) => {
                    // Handle event clicks here
                    debugLog('Event clicked:', info.event);
                },
                dayCellDidMount: (arg) => {
                    // Handle day cell mounting here
                    const date = arg.date;
                    if (isBankHoliday(date)) {
                        arg.el.classList.add('fc-day-bank-holiday');
                    }
                },
                displayEventTime: false,
                eventDisplay: 'block',
                height: 'auto',
                dayMaxEvents: true,
                eventColor: CONFIG.COLORS.PTO,
                selectOverlap: false
            });

            await this.calendar.render();
            this.markBankHolidays();
            debugLog('Calendar initialized successfully');

        } catch (error) {
            console.error('Calendar initialization error:', error);
            throw error;
        }
    }

    // ... rest of your CalendarManager methods remain the same ...
}

    handleDateSelection(selectInfo) {
        debugLog('Date selection started', selectInfo);
        const startDate = selectInfo.start;
        const endDate = selectInfo.end;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            this.ptoManager.uiManager.showError('Cannot select past dates');
            return;
        }

        const workingDays = calculateWorkingDays(startDate, endDate);
        if (this.ptoManager.state.userData.plannedPTO + workingDays > this.ptoManager.state.userData.totalPTO) {
            this.ptoManager.uiManager.showError(
                `Not enough PTO days remaining. You have ${
                    this.ptoManager.state.userData.totalPTO - this.ptoManager.state.userData.plannedPTO
                } days left.`
            );
            return;
        }

        this.confirmPTOSelection(startDate, endDate);
    }

    markBankHolidays() {
        debugLog('Marking bank holidays');
        const currentYearHolidays = BANK_HOLIDAYS[GlobalState.getCurrentYear()];
        if (!currentYearHolidays) return;

        currentYearHolidays.forEach(holiday => {
            const dateStr = holiday.date;
            const dayEl = document.querySelector(`td[data-date="${dateStr}"]`);
            if (dayEl) {
                dayEl.classList.add('fc-day-bank-holiday');
                dayEl.setAttribute('title', holiday.title);
            }
        });
    }

    refreshCalendar() {
        if (this.calendar) {
            this.calendar.removeAllEvents();
            const events = this.generateEvents();
            this.calendar.addEventSource(events);
            this.calendar.render();
            
            setTimeout(() => {
                this.markBankHolidays();
            }, CONFIG.ANIMATION_DELAY);
        }
    }

    generateEvents() {
        const events = [];
        const currentYearHolidays = BANK_HOLIDAYS[GlobalState.getCurrentYear()];
        
        // Add bank holidays
        if (currentYearHolidays) {
            currentYearHolidays.forEach(holiday => {
                events.push({
                    title: holiday.title,
                    start: holiday.date,
                    className: 'bank-holiday',
                    color: CONFIG.COLORS.BANK_HOLIDAY
                });
            });
        }

        // Add PTO days
        const ptoEvents = this.ptoManager.state.userData.selectedDates[GlobalState.getCurrentYear()] || [];
        ptoEvents.forEach(date => {
            events.push({
                title: 'PTO Day',
                start: date,
                className: 'pto-day',
                color: CONFIG.COLORS.PTO
            });
        });

        return events;
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

        try {
            modal.style.display = 'flex';
            this.showStep(1);
            this.populateBankHolidays();
            this.populateMonthSelector();
            this.setupEventListeners();
        } catch (error) {
            console.error('Setup wizard initialization error:', error);
            this.ptoManager.uiManager.showError('Failed to initialize setup wizard');
        }
    }

    populateBankHolidays() {
        debugLog('Populating bank holidays');
        const container = document.querySelector('.bank-holiday-list');
        if (!container) return;

        const currentYearHolidays = BANK_HOLIDAYS[GlobalState.getCurrentYear()];
        if (!currentYearHolidays) {
            container.innerHTML = '<p>No bank holidays available for selected year.</p>';
            return;
        }

        const holidaysHtml = currentYearHolidays.map(holiday => `
            <div class="holiday-item">
                <label class="holiday-check">
                    <input type="checkbox" id="holiday-${holiday.date}" data-date="${holiday.date}">
                    <span>${holiday.title} (${formatDisplayDate(new Date(holiday.date))})</span>
                </label>
                <select class="extension-type" data-date="${holiday.date}">
                    <option value="before">Day Before</option>
                    <option value="after">Day After</option>
                    <option value="both">Both Days</option>
                </select>
            </div>
        `).join('');

        container.innerHTML = holidaysHtml;
        this.setupHolidayListeners();
    }

    saveWizardData() {
        const totalPTOInput = document.getElementById('totalPTOInput');
        const plannedPTOInput = document.getElementById('plannedPTOInput');

        if (totalPTOInput && plannedPTOInput) {
            try {
                this.ptoManager.state.userData.totalPTO = parseInt(totalPTOInput.value);
                this.ptoManager.state.userData.plannedPTO = parseInt(plannedPTOInput.value);

                this.ptoManager.state.userData.preferences = {
                    schoolHolidays: Array.from(
                        document.querySelectorAll('input[name="schoolHolidays"]:checked')
                    ).map(input => input.value),

                    preferredMonths: Array.from(
                        document.querySelectorAll('input[name="preferredMonth"]:checked')
                    ).map(input => input.value),

                    extendBankHolidays: Array.from(
                        document.querySelectorAll('.holiday-item input[type="checkbox"]:checked')
                    ).map(input => ({
                        date: input.dataset.date,
                        extensionType: input.closest('.holiday-item')
                            .querySelector('.extension-type').value
                    }))
                };

                this.ptoManager.storageManager.save(this.ptoManager.state.userData);
                this.handleModalClose();
                
                if (!this.ptoManager.calendarManager.calendar) {
                    this.ptoManager.calendarManager.initialize();
                } else {
                    this.ptoManager.calendarManager.refreshCalendar();
                }

                this.ptoManager.uiManager.showSuccess('PTO setup completed successfully');
            } catch (error) {
                console.error('Error saving wizard data:', error);
                this.ptoManager.uiManager.showError('Failed to save setup data');
            }
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
                selectedDates: {
                    [GlobalState.getCurrentYear()]: []
                },
                preferences: {
                    extendBankHolidays: [],
                    preferredMonths: []
                }
            }
        };

        this.eventEmitter = new EventEmitter();
        this.storageManager = new StorageManager();
        this.uiManager = new UIManager(this);
        this.calendarManager = new CalendarManager(this);
        this.setupWizard = new SetupWizard(this);

        if (CONFIG.DEBUG) {
            window.debugApp = this.createDebugUtilities();
        }
    }

    async initialize() {
        debugLog('Initializing PTO Manager');
        this.uiManager.showLoading();
        
        try {
            await this.loadSavedData();
            this.setupEventListeners();
            this.uiManager.addCalendarStyles();
            
            // Only initialize calendar if we're past the welcome screen
            const welcomeScreen = document.getElementById('welcomeScreen');
            if (welcomeScreen.classList.contains('hidden')) {
                await this.calendarManager.initialize();
            }
            
            this.uiManager.updateSummary();
        } catch (error) {
            console.error('Initialization error:', error);
            this.uiManager.showError('Failed to initialize application');
        } finally {
            this.uiManager.hideLoading();
        }
    }

    setupEventListeners() {
        // Get Started Button
        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                debugLog('Get Started button clicked');
                this.handleGetStarted();
            });
        }

        // Setup PTO Button
        const setupPTOBtn = document.getElementById('setupPTOBtn');
        if (setupPTOBtn) {
            setupPTOBtn.addEventListener('click', () => {
                debugLog('Setup PTO button clicked');
                this.setupWizard.initialize();
            });
        }

        // Export Button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                debugLog('Export button clicked');
                this.exportCalendar();
            });
        }

        // Year Select
        const yearSelect = document.getElementById('yearSelect');
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                debugLog('Year changed');
                this.handleYearChange(e);
            });
        }
    }

    handleGetStarted() {
        debugLog('Handling Get Started action');
        const welcomeScreen = document.getElementById('welcomeScreen');
        const appContainer = document.getElementById('appContainer');
        
        if (welcomeScreen && appContainer) {
            welcomeScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            
            // Initialize calendar after welcome screen is hidden
            this.calendarManager.initialize().then(() => {
                debugLog('Calendar initialized after welcome screen');
                this.setupWizard.initialize();
            }).catch(error => {
                console.error('Failed to initialize calendar:', error);
                this.uiManager.showError('Failed to initialize calendar');
            });
        } else {
            console.error('Welcome screen or app container elements not found');
        }
    }

    handleYearChange(e) {
        const newYear = parseInt(e.target.value);
        debugLog('Year changing to:', newYear);
        
        if (newYear !== GlobalState.getCurrentYear()) {
            GlobalState.setCurrentYear(newYear);
            if (!this.state.userData.selectedDates[newYear]) {
                this.state.userData.selectedDates[newYear] = [];
            }
            this.calendarManager.refreshCalendar();
            this.uiManager.updateSummary();
        }
    }

    async loadSavedData() {
        debugLog('Loading saved data');
        const savedData = await this.storageManager.load();
        if (savedData) {
            this.state.userData = savedData;
            debugLog('Saved data loaded:', savedData);
        }
    }

    async exportCalendar() {
        debugLog('Exporting calendar');
        try {
            const events = this.calendarManager.generateEvents();
            const exportData = {
                events: events,
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

    createDebugUtilities() {
        return {
            getCurrentState: () => ({
                userData: this.state.userData,
                currentYear: GlobalState.getCurrentYear(),
                calendarInitialized: !!this.calendarManager.calendar
            }),
            clearData: () => {
                localStorage.clear();
                location.reload();
            },
            forceRefresh: () => {
                this.calendarManager.refreshCalendar();
                this.uiManager.updateSummary();
            }
        };
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM Content Loaded - Starting initialization');
    
    try {
        const app = new PTOManager();
        app.initialize().catch(error => {
            console.error('Application initialization failed:', error);
            if (CONFIG.DEBUG) {
                console.error('Detailed error:', error.stack);
            }
        });
    } catch (error) {
        console.error('Critical initialization error:', error);
        if (CONFIG.DEBUG) {
            console.error('Detailed error:', error.stack);
        }
    }
});
