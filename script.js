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
            .fc-day-bank-holiday {
                background-color: rgba(245, 158, 11, 0.1) !important;
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
                background-color: var(--pto-green) !important;
                border-color: var(--pto-green) !important;
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
                    debugLog('Event clicked:', info.event);
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

    handleDateSelection(selectInfo) {
        const startDate = selectInfo.start;
        const endDate = selectInfo.end;
        
        if (startDate < new Date()) {
            this.ptoManager.uiManager.showError('Cannot select past dates');
            return;
        }

        const workingDays = calculateWorkingDays(startDate, endDate);
        if (workingDays === 0) {
            this.ptoManager.uiManager.showError('No working days selected');
            return;
        }

        if (this.ptoManager.state.userData.plannedPTO + workingDays > this.ptoManager.state.userData.totalPTO) {
            this.ptoManager.uiManager.showError(
                `Not enough PTO days remaining. You have ${
                    this.ptoManager.state.userData.totalPTO - this.ptoManager.state.userData.plannedPTO
                } days left.`
            );
            return;
        }

        Swal.fire({
            title: 'Confirm PTO Selection',
            text: `Add ${workingDays} PTO day(s) from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}?`,
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

    addPTODays(start, end) {
        const currentYear = GlobalState.getCurrentYear();
        if (!this.ptoManager.state.userData.selectedDates[currentYear]) {
            this.ptoManager.state.userData.selectedDates[currentYear] = [];
        }

        let current = new Date(start);
        const endDate = new Date(end);
        let addedDays = 0;

        while (current < endDate) {
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

    generateEvents() {
        const events = [];
        
        // Add bank holidays
        const currentYearHolidays = BANK_HOLIDAYS[GlobalState.getCurrentYear()];
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

    markBankHolidays() {
        const currentYearHolidays = BANK_HOLIDAYS[GlobalState.getCurrentYear()];
        if (!currentYearHolidays) return;

        currentYearHolidays.forEach(holiday => {
            const dateEl = document.querySelector(`td[data-date="${holiday.date}"]`);
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
    }

    showStep(step) {
        document.querySelectorAll('.wizard-step').forEach(el => {
            el.setAttribute('data-state', 'hidden');
        });
        
        const stepElement = document.querySelector(`.wizard-step[data-step="${step}"]`);
        if (stepElement) {
            stepElement.setAttribute('data-state', 'active');
        }

        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');

        if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'block';
        if (nextBtn) {
            nextBtn.textContent = step === this.totalSteps ? 'Finish' : 'Next';
        }
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
                if (this.currentStep < this.totalSteps) {
                    this.currentStep++;
                    this.showStep(this.currentStep);
                } else {
                    this.saveAndClose();
                }
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.handleClose();
            });
        }
    }

    saveAndClose() {
        const totalPTOInput = document.getElementById('totalPTOInput');
        const plannedPTOInput = document.getElementById('plannedPTOInput');

        if (totalPTOInput && plannedPTOInput) {
            const totalPTO = parseInt(totalPTOInput.value);
            const plannedPTO = parseInt(plannedPTOInput.value);

            if (isNaN(totalPTO) || totalPTO < 0 || totalPTO > CONFIG.MAX_PTO) {
                this.ptoManager.uiManager.showError(`Please enter a valid PTO amount (0-${CONFIG.MAX_PTO})`);
                return;
            }

            if (isNaN(plannedPTO) || plannedPTO < 0 || plannedPTO > totalPTO) {
                this.ptoManager.uiManager.showError('Planned PTO cannot exceed total PTO');
                return;
            }

            this.ptoManager.state.userData.totalPTO = totalPTO;
            this.ptoManager.state.userData.plannedPTO = plannedPTO;
            this.ptoManager.storageManager.save(this.ptoManager.state.userData);
            this.handleClose();
            this.ptoManager.uiManager.updateSummary();
            this.ptoManager.uiManager.showSuccess('PTO setup completed successfully');
        }
    }

    handleClose() {
        const modal = document.getElementById('setupModal');
        if (modal) {
            modal.style.display = 'none';
            this.currentStep = 1;
            this.showStep(1);
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
    }

    async initialize() {
        debugLog('Initializing PTO Manager');
        this.uiManager.showLoading();
        
        try {
            await this.loadSavedData();
            this.setupEventListeners();
            this.uiManager.addCalendarStyles();
            this.uiManager.updateSummary();
        } catch (error) {
            console.error('Initialization error:', error);
            this.uiManager.showError('Failed to initialize application');
        } finally {
            this.uiManager.hideLoading();
        }
    }

    setupEventListeners() {
        const getStartedBtn = document.getElementById('getStartedBtn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => this.handleGetStarted());
        }

        const setupPTOBtn = document.getElementById('setupPTOBtn');
        if (setupPTOBtn) {
            setupPTOBtn.addEventListener('click', () => this.setupWizard.initialize());
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCalendar());
        }

        const yearSelect = document.getElementById('yearSelect');
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

    async loadSavedData() {
        const savedData = await this.storageManager.load();
        if (savedData) {
            this.state.userData = savedData;
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
