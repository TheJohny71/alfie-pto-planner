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
    // ... your existing BANK_HOLIDAYS data ...
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

    // ... rest of your UIManager class methods ...
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

        if (typeof FullCalendar === 'undefined') {
            throw new Error('FullCalendar library not loaded');
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
                eventDidMount: (info) => this.handleEventMount(info),
                events: (info) => this.generateEvents(info),
                eventClick: (info) => this.handleEventClick(info),
                dayCellDidMount: (arg) => this.handleDayCellMount(arg),
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

    generateEvents() {
        const events = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add bank holidays
        const currentYearHolidays = BANK_HOLIDAYS[GlobalState.getCurrentYear()];
        if (currentYearHolidays) {
            currentYearHolidays.forEach(holiday => {
                const holidayDate = new Date(holiday.date);
                if (holidayDate >= today) {
                    events.push({
                        title: holiday.title,
                        start: holiday.date,
                        allDay: true,
                        className: 'bank-holiday-bg',
                        display: 'background',
                        backgroundColor: CONFIG.COLORS.BANK_HOLIDAY
                    });

                    events.push({
                        title: holiday.title,
                        start: holiday.date,
                        allDay: true,
                        className: 'bank-holiday',
                        display: 'block'
                    });
                }
            });
        }

        // Add PTO days
        const selectedDates = this.ptoManager.state.userData.selectedDates[GlobalState.getCurrentYear()];
        if (selectedDates) {
            selectedDates.forEach(date => {
                events.push({
                    title: 'PTO Day',
                    start: date,
                    allDay: true,
                    className: 'pto-day',
                    backgroundColor: CONFIG.COLORS.PTO,
                    borderColor: CONFIG.COLORS.PTO,
                    display: 'block',
                    editable: false
                });
            });
        }

        return events;
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

        if (!this.validateDateSelection(startDate, endDate)) {
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
        debugLog('Marking bank holidays for year', GlobalState.getCurrentYear());
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

    // ... rest of your CalendarManager methods remain the same ...
}


// Part 4: Setup Wizard
// =========================================

class SetupWizard {
    constructor(ptoManager) {
        this.ptoManager = ptoManager;
        this.currentStep = 1;
        this.totalSteps = 3;
        this.hasSetup = false;
    }

    initialize() {
        debugLog('Initializing setup wizard');
        const setupModal = document.getElementById('setupModal');
        
        if (!setupModal) {
            this.ptoManager.uiManager.showError('Setup wizard could not be initialized');
            return;
        }

        try {
            this.currentStep = 1;
            setupModal.style.display = 'flex';
            
            this.showStep(1);
            this.populateBankHolidays();
            this.populateMonthSelector();

            if (!this.hasSetup) {
                this.setupEventListeners(setupModal);
                this.hasSetup = true;
            }
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

                // Initialize selectedDates for the current year if it doesn't exist
                if (!this.ptoManager.state.userData.selectedDates[GlobalState.getCurrentYear()]) {
                    this.ptoManager.state.userData.selectedDates[GlobalState.getCurrentYear()] = [];
                }

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

    // ... rest of your SetupWizard methods remain the same ...
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

    handleYearChange(e) {
        const newYear = parseInt(e.target.value);
        if (newYear !== GlobalState.getCurrentYear()) {
            GlobalState.setCurrentYear(newYear);
            // Initialize selectedDates for the new year if it doesn't exist
            if (!this.state.userData.selectedDates[newYear]) {
                this.state.userData.selectedDates[newYear] = [];
            }
            this.calendarManager.refreshCalendar();
        }
    }

    exportCalendar() {
        const events = this.calendarManager.calendar.getEvents()
            .filter(event => event.classNames.includes('pto-day'))
            .map(event => ({
                date: formatDate(event.start),
                type: 'PTO Day'
            }));

        if (events.length === 0) {
            this.uiManager.showError('No PTO days to export');
            return;
        }

        try {
            const csvContent = "data:text/csv;charset=utf-8,"
                + "Date,Type\n"
                + events.map(e => `${e.date},${e.type}`).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `pto_calendar_${GlobalState.getCurrentYear()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

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
            reloadCalendar: () => {
                if (this.calendarManager.calendar) {
                    this.calendarManager.refreshCalendar();
                    return 'Calendar refreshed';
                }
                return 'Calendar not initialized';
            }
        };
    }

    // ... rest of your PTOManager methods remain the same ...
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
