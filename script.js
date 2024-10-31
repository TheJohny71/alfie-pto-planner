// Configuration and Debug Setup
const CONFIG = {
    DEBUG: true,
    COLORS: {
        PTO: '#059669',
        BANK_HOLIDAY: '#f59e0b',
        WEEKEND: '#e5e7eb'
    },
    INITIAL_YEAR: 2024,
    MAX_PTO: 50,
    ANIMATION_DELAY: 100
};

// Debug State Management
window.debugState = {
    lastAction: null,
    selectedDates: [],
    events: []
};

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

// Core Utility Class
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

// Storage Manager Class
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

// UI Manager Class
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
        if (elements.bankHolidays && BANK_HOLIDAYS[currentYear]) {
            elements.bankHolidays.textContent = BANK_HOLIDAYS[currentYear].length;
        }
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

            .fc .fc-daygrid-event {
                z-index: 6;
                margin-top: 1px;
            }

            .fc .fc-daygrid-day-events {
                min-height: 1.5em;
            }
        `;
        document.head.appendChild(styleSheet);
        debugLog('Calendar styles added');
    }
}

// Helper Functions
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

// Calendar Manager Class
[Previous Calendar Manager code remains the same until handleDayCellMount]

    handleDayCellMount(arg) {
        try {
            if (isWeekend(arg.date)) {
                arg.el.style.backgroundColor = CONFIG.COLORS.WEEKEND;
            }
        } catch (error) {
            console.error('Error mounting day cell:', error);
        }
    }

    handleEventClick(info) {
        debugLog('Event clicked', { title: info.event.title, date: info.event.start });
        if (info.event.classNames.includes('pto-day')) {
            this.confirmRemovePTODay(info.event);
        }
    }

    handleDatesSet(dateInfo) {
        const newYear = dateInfo.start.getFullYear();
        if (newYear !== currentYear) {
            debugLog('Year changed in calendar view', { from: currentYear, to: newYear });
            currentYear = newYear;
            this.refreshCalendar();
        }
    }

    markBankHolidays() {
        debugLog('Marking bank holidays for year', currentYear);
        if (!BANK_HOLIDAYS[currentYear]) return;

        BANK_HOLIDAYS[currentYear].forEach(holiday => {
            const dateStr = holiday.date;
            const dayEl = document.querySelector(`td[data-date="${dateStr}"]`);
            if (dayEl) {
                dayEl.classList.add('fc-day-bank-holiday');
                dayEl.setAttribute('title', holiday.title);
            }
        });
    }

    [Rest of Calendar Manager code remains the same]
}

// Setup Wizard Class
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

    setupEventListeners(modal) {
        const closeBtn = document.getElementById('closeSetup');
        const nextBtn = document.getElementById('nextStep');
        const prevBtn = document.getElementById('prevStep');
        const selectAllBtn = document.getElementById('selectAllHolidays');
        const clearAllBtn = document.getElementById('clearHolidays');

        if (closeBtn) closeBtn.addEventListener('click', () => this.handleModalClose());
        if (nextBtn) nextBtn.addEventListener('click', () => this.handleNextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.handlePrevStep());
        if (selectAllBtn) selectAllBtn.addEventListener('click', () => this.selectAllHolidays());
        if (clearAllBtn) clearAllBtn.addEventListener('click', () => this.clearAllHolidays());

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'flex') {
                this.handleModalClose();
            }
        });
    }

    showStep(step) {
        const steps = document.querySelectorAll('.wizard-step');
        steps.forEach(s => s.style.display = 'none');

        const currentStepEl = document.querySelector(`.wizard-step[data-step="${step}"]`);
        if (currentStepEl) {
            currentStepEl.style.display = 'block';
        }

        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');

        if (prevBtn) prevBtn.style.display = step === 1 ? 'none' : 'block';
        if (nextBtn) nextBtn.textContent = step === this.totalSteps ? 'Finish' : 'Next';
    }

    handleNextStep() {
        if (this.currentStep === 1 && !this.validateStep1()) {
            return;
        }

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
        } else {
            this.saveWizardData();
        }
    }

    handlePrevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    validateStep1() {
        const totalPTOInput = document.getElementById('totalPTOInput');
        const plannedPTOInput = document.getElementById('plannedPTOInput');
        
        if (!totalPTOInput || !plannedPTOInput) {
            this.ptoManager.uiManager.showError('Required input fields not found');
            return false;
        }

        const totalPTO = parseInt(totalPTOInput.value);
        const plannedPTO = parseInt(plannedPTOInput.value);
        
        if (!totalPTO || totalPTO <= 0 || totalPTO > CONFIG.MAX_PTO) {
            this.ptoManager.uiManager.showError('Please enter a valid number of PTO days (1-50)');
            return false;
        }
        
        if (plannedPTO < 0 || plannedPTO > totalPTO) {
            this.ptoManager.uiManager.showError('Planned PTO cannot exceed total PTO days');
            return false;
        }
        
        return true;
    }

   // In SetupWizard class
populateBankHolidays() {
    const container = document.querySelector('.bank-holiday-list');
    if (!container) return;

    // Group holidays by quarter
    const currentYearHolidays = BANK_HOLIDAYS[currentYear];
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
    
    // Add click handlers for selections
    this.setupHolidayListeners();
}

setupHolidayListeners() {
    const holidayCheckboxes = document.querySelectorAll('.holiday-item input[type="checkbox"]');
    holidayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const select = e.target.closest('.holiday-item').querySelector('.extension-type');
            select.disabled = !e.target.checked;
        });
    });
}

    populateMonthSelector() {
        const container = document.querySelector('.month-selector');
        if (!container) return;

        const months = [
            ['January', 'February', 'March', 'April'],
            ['May', 'June', 'July', 'August'],
            ['September', 'October', 'November', 'December']
        ];

        const monthsHtml = months.map(row => `
            <div class="month-row">
                ${row.map(month => `
                    <label class="month-item">
                        <input type="checkbox" name="preferredMonth" value="${month}">
                        <span>${month}</span>
                    </label>
                `).join('')}
            </div>
        `).join('');

        container.innerHTML = monthsHtml;
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
                
                const setupModal = document.getElementById('setupModal');
                if (setupModal) setupModal.style.display = 'none';
                
                if (!this.ptoManager.calendarManager.calendar) {
                    this.ptoManager.initialize();
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

// Main PTO Manager Class
class PTOManager {
    constructor() {
        this.state = {
            calendar: null,
            currentYear: CONFIG.INITIAL_YEAR,
            userData: {
                totalPTO: CONFIG.DEFAULT_PTO,
                plannedPTO: 0,
                selectedDates: {},
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
        } catch (error) {
            console.error('Initialization error:', error);
            this.uiManager.showError('Failed to initialize application');
        } finally {
            this.uiManager.hideLoading();
        }
    }

    setupEventListeners() {
        const getStartedBtn = document.getElementById('getStartedBtn');
        const setupPTOBtn = document.getElementById('setupPTOBtn');
        const yearSelect = document.getElementById('yearSelect');

        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => this.handleGetStarted());
        }

        if (setupPTOBtn) {
            setupPTOBtn.addEventListener('click', () => this.setupWizard.initialize());
        }

        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => this.handleYearChange(e));
        }
    }

    handleGetStarted() {
        debugLog('Get Started button clicked');
        try {
            const welcomeScreen = document.getElementById('welcomeScreen');
            const appContainer = document.getElementById('appContainer');
            
            if (welcomeScreen && appContainer) {
                welcomeScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                
                // Initialize calendar after showing app container
                this.calendarManager.initialize().then(() => {
                    this.setupWizard.initialize();
                }).catch(error => {
                    console.error('Calendar initialization error:', error);
                    this.uiManager.showError('Failed to initialize calendar');
                });
            }
        } catch (error) {
            console.error('Error in Get Started handler:', error);
            this.uiManager.showError('Failed to start application setup');
        }
    }

    async loadSavedData() {
        const savedData = await this.storageManager.load();
        if (savedData) {
            this.state.userData = savedData;
        }
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
            link.setAttribute("download", `pto_calendar_${this.state.currentYear}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.uiManager.showSuccess('Calendar exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            this.uiManager.showError('Failed to export calendar');
        }
    }

    async loadSavedData() {
        const savedData = await this.storageManager.load();
        if (savedData) {
            this.state.userData = savedData;
        }
    }

    createDebugUtilities() {
        return {
            getCurrentState: () => ({
                userData: this.state.userData,
                currentYear: this.state.currentYear,
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
