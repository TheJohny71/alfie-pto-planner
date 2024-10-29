// Part 1: Core Configuration and Debug Setup
// =========================================

// Global Constants
const CONFIG = {
    COLORS: {
        PTO: '#059669',
        BANK_HOLIDAY: '#f59e0b',
        WEEKEND: '#e5e7eb'
    },
    INITIAL_YEAR: 2024,
    MAX_PTO: 50,
    DEFAULT_PTO: 0,
    ANIMATION_DELAY: 100,
    DEBUG: true  // Moved debug flag into CONFIG
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
    ],
    2027: [
        { date: '2027-01-01', title: "New Year's Day" },
        { date: '2027-03-26', title: "Good Friday" },
        { date: '2027-03-29', title: "Easter Monday" },
        { date: '2027-05-03', title: "Early May Bank Holiday" },
        { date: '2027-05-31', title: "Spring Bank Holiday" },
        { date: '2027-08-30', title: "Summer Bank Holiday" },
        { date: '2027-12-27', title: "Christmas Day (Substitute Day)" },
        { date: '2027-12-28', title: "Boxing Day (Substitute Day)" }
    ],
    2028: [
        { date: '2028-01-03', title: "New Year's Day (Substitute Day)" },
        { date: '2028-04-14', title: "Good Friday" },
        { date: '2028-04-17', title: "Easter Monday" },
        { date: '2028-05-01', title: "Early May Bank Holiday" },
        { date: '2028-05-29', title: "Spring Bank Holiday" },
        { date: '2028-08-28', title: "Summer Bank Holiday" },
        { date: '2028-12-25', title: "Christmas Day" },
        { date: '2028-12-26', title: "Boxing Day" }
    ]
};

// Initial State Setup
let calendar = null;
let currentYear = CONFIG.INITIAL_YEAR;
let currentStep = 1;
const totalSteps = 3;
let userData = {
    totalPTO: CONFIG.DEFAULT_PTO,
    plannedPTO: 0,
    selectedDates: {},
    preferences: {
        extendBankHolidays: [],
        preferredMonths: [],
        schoolHolidays: []
    }
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
    return BANK_HOLIDAYS[currentYear]?.some(holiday => holiday.date === dateStr) || false;
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


// Part 2: Event Management and UI Classes
// =========================================

// Core Event Management
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

            .fc .fc-daygrid-day.fc-day-bank-holiday {
                background-color: rgba(245, 158, 11, 0.15) !important;
            }

            .bank-holiday-bg {
                opacity: 0.25;
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

// Modal Manager Class
class ModalManager {
    constructor(ptoManager) {
        this.ptoManager = ptoManager;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            debugLog('Modal shown:', modalId);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            debugLog('Modal hidden:', modalId);
        }
    }

    setupModalClose(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideModal(modalId));
            }
            
            // Close on escape key
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && modal.style.display === 'flex') {
                    this.hideModal(modalId);
                }
            });
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

        await this.setupCalendar();
        this.markBankHolidays();
    }

    async setupCalendar() {
        debugLog('Setting up calendar');
        
        try {
            if (typeof FullCalendar === 'undefined') {
                throw new Error('FullCalendar library not loaded');
            }

            this.calendar = new FullCalendar.Calendar(this.calendarEl, {
                initialView: 'dayGridMonth',
                firstDay: 1,
                initialDate: `${currentYear}-01-01`,
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth'
                },
                selectable: true,
                selectConstraint: {
                    start: `${currentYear}-01-01`,
                    end: `${currentYear}-12-31`
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
                selectOverlap: false,
                datesSet: (dateInfo) => this.handleDatesSet(dateInfo)
            });

            debugLog('Calendar configuration set');
            await this.calendar.render();
            debugLog('Calendar rendered');

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
        if (BANK_HOLIDAYS[currentYear]) {
            BANK_HOLIDAYS[currentYear].forEach(holiday => {
                const holidayDate = new Date(holiday.date);
                if (holidayDate > today) {  // Only add future holidays
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
        if (this.ptoManager.state.userData.selectedDates[currentYear]) {
            this.ptoManager.state.userData.selectedDates[currentYear].forEach(date => {
                const ptoDate = new Date(date);
                if (ptoDate >= today) {  // Only add future or today's PTO
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
                }
            });
        }

        debugLog('Generated events', events);
        return events;
    }

    handleDateSelection(selectInfo) {
        debugLog('Date selection started', selectInfo);
        const startDate = selectInfo.start;
        const endDate = selectInfo.end;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Validate dates are in the future
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

    validateDateSelection(start, end) {
        if (!validateDates(start, end)) {
            this.ptoManager.uiManager.showError('Invalid date selection');
            return false;
        }

        if (isWeekend(start) || isWeekend(end)) {
            this.ptoManager.uiManager.showError('Cannot select weekends');
            return false;
        }

        if (isBankHoliday(start) || isBankHoliday(end)) {
            this.ptoManager.uiManager.showError('Cannot select bank holidays');
            return false;
        }

        return true;
    }

    handleEventMount(info) {
        const eventEl = info.el;
        const event = info.event;

        try {
            if (event.classNames.includes('bank-holiday-bg')) {
                eventEl.style.backgroundColor = CONFIG.COLORS.BANK_HOLIDAY;
            } else if (event.classNames.includes('bank-holiday')) {
                eventEl.style.backgroundColor = 'transparent';
                eventEl.style.borderColor = 'transparent';
                eventEl.style.color = '#B45309';
                eventEl.style.fontWeight = '600';
                eventEl.style.textShadow = '0px 0px 1px rgba(255, 255, 255, 0.8)';
            } else if (event.classNames.includes('pto-day')) {
                eventEl.style.backgroundColor = CONFIG.COLORS.PTO;
                eventEl.style.borderColor = CONFIG.COLORS.PTO;
                eventEl.style.color = 'white';
            }
        } catch (error) {
            console.error('Error mounting event:', error);
        }
    }

    handleDayCellMount(arg) {
        try {
            if (isWeekend(arg.date)) {
                arg.el.style.backgroundColor = CONFIG.COLORS.WEEKEND;
            }
        } catch (error) {
            console.error('Error mounting day cell:', error);
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

    refreshCalendar() {
        debugLog('Refreshing calendar');
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

    markBankHolidays() {
        debugLog('Marking bank holidays for year', currentYear);
        if (!BANK_HOLIDAYS[currentYear]) {
            debugLog('No bank holidays found for year', currentYear);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        BANK_HOLIDAYS[currentYear].forEach(holiday => {
            const holidayDate = new Date(holiday.date);
            if (holidayDate > today) {  // Only mark future holidays
                const dateStr = holiday.date;
                const dayEl = document.querySelector(`td[data-date="${dateStr}"]`);
                if (dayEl) {
                    dayEl.classList.add('fc-day-bank-holiday');
                    dayEl.setAttribute('title', holiday.title);
                    debugLog('Marked holiday', dateStr);
                }
            }
        });
    }
}


// Part 4: Setup Wizard and Main PTO Manager
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
            console.error('Setup modal not found');
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

            debugLog('Setup wizard initialized successfully');
        } catch (error) {
            console.error('Setup wizard initialization error:', error);
            this.ptoManager.uiManager.showError('Failed to initialize setup wizard');
        }
    }

    populateBankHolidays() {
        debugLog('Populating bank holidays for year:', currentYear);
        const container = document.querySelector('.bank-holiday-list');
        if (!container) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!BANK_HOLIDAYS[currentYear]) {
            container.innerHTML = '<p>No bank holidays available for selected year.</p>';
            return;
        }

        const futureHolidays = BANK_HOLIDAYS[currentYear].filter(holiday => {
            const holidayDate = new Date(holiday.date);
            return holidayDate > today;
        });

        if (futureHolidays.length === 0) {
            container.innerHTML = '<p>No upcoming bank holidays for this year.</p>';
            return;
        }

        const holidaysList = futureHolidays.map(holiday => `
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

        container.innerHTML = holidaysList;
    }

    populateMonthSelector() {
        debugLog('Populating month selector');
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

    setupEventListeners(modal) {
        debugLog('Setting up wizard event listeners');
        const closeBtn = document.getElementById('closeSetup');
        const nextBtn = document.getElementById('nextStep');
        const prevBtn = document.getElementById('prevStep');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.handleModalClose());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handleNextStep());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.handlePrevStep());
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.style.display === 'flex') {
                this.handleModalClose();
            }
        });
    }

    showStep(step) {
        debugLog('Showing wizard step:', step);
        const steps = document.querySelectorAll('.wizard-step');
        steps.forEach(s => s.style.display = 'none');

        const currentStepEl = document.querySelector(`.wizard-step[data-step="${step}"]`);
        if (currentStepEl) {
            currentStepEl.style.display = 'block';
        }

        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');

        if (prevBtn) {
            prevBtn.style.display = step === 1 ? 'none' : 'block';
        }
        if (nextBtn) {
            nextBtn.textContent = step === this.totalSteps ? 'Finish' : 'Next';
        }
    }

    handleNextStep() {
        debugLog('Next step clicked, current step:', this.currentStep);
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

    handlePrevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    handleModalClose() {
        const setupModal = document.getElementById('setupModal');
        if (setupModal) {
            setupModal.style.display = 'none';
            if (!this.ptoManager.calendarManager.calendar) {
                const welcomeScreen = document.getElementById('welcomeScreen');
                const appContainer = document.getElementById('appContainer');
                
                if (welcomeScreen) welcomeScreen.classList.remove('hidden');
                if (appContainer) appContainer.classList.add('hidden');
            }
        }
    }

    saveWizardData() {
        debugLog('Saving wizard data');
        const totalPTOInput = document.getElementById('totalPTOInput');
        const plannedPTOInput = document.getElementById('plannedPTOInput');

        if (totalPTOInput && plannedPTOInput) {
            try {
                this.ptoManager.state.userData.totalPTO = parseInt(totalPTOInput.value);
                this.ptoManager.state.userData.plannedPTO = parseInt(plannedPTOInput.value);

                if (!this.ptoManager.state.userData.selectedDates[currentYear]) {
                    this.ptoManager.state.userData.selectedDates[currentYear] = [];
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
            userData: {
                totalPTO: CONFIG.DEFAULT_PTO,
                plannedPTO: 0,
                selectedDates: {},
                preferences: {
                    extendBankHolidays: [],
                    preferredMonths: [],
                    schoolHolidays: []
                }
            }
        };

        // Initialize managers
        this.eventEmitter = new EventEmitter();
        this.storageManager = new StorageManager();
        this.uiManager = new UIManager(this);
        this.calendarManager = new CalendarManager(this);
        this.setupWizard = new SetupWizard(this);
        this.modalManager = new ModalManager(this);
    }

    async initialize() {
        debugLog('Initializing PTO Manager');
        this.uiManager.showLoading();
        
        try {
            await this.loadSavedData();
            await this.calendarManager.initialize();
            this.setupEventListeners();
            this.uiManager.addCalendarStyles();
        } catch (error) {
            console.error('Initialization error:', error);
            this.uiManager.showError('Failed to initialize application');
        } finally {
            this.uiManager.hideLoading();
        }
    }

    async loadSavedData() {
        const savedData = await this.storageManager.load();
        if (savedData) {
            this.state.userData = savedData;
            debugLog('Loaded saved data', savedData);
        }
    }

    setupEventListeners() {
        // Main UI buttons
        const setupPTOBtn = document.getElementById('setupPTOBtn');
        const exportBtn = document.getElementById('exportBtn');
        const yearSelect = document.getElementById('yearSelect');
        const settingsBtn = document.getElementById('settingsBtn');

        if (setupPTOBtn) {
            setupPTOBtn.addEventListener('click', () => this.setupWizard.initialize());
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCalendar());
        }

        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => this.handleYearChange(e));
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.setupWizard.initialize());
        }
    }

    handleYearChange(e) {
        const newYear = parseInt(e.target.value);
        if (newYear !== currentYear) {
            currentYear = newYear;
            this.calendarManager.refreshCalendar();
        }
    }

    exportCalendar() {
        // Implementation will come in the next section
    }
}


// Part 5: Final Integration and Initialization
// =========================================

// Export Manager Class
class ExportManager {
    constructor(ptoManager) {
        this.ptoManager = ptoManager;
    }

    exportCalendar() {
        debugLog('Exporting calendar');
        const events = this.ptoManager.calendarManager.calendar.getEvents()
            .filter(event => event.classNames.includes('pto-day'))
            .map(event => ({
                date: formatDate(event.start),
                type: 'PTO Day'
            }));

        if (events.length === 0) {
            this.ptoManager.uiManager.showError('No PTO days to export');
            return;
        }

        try {
            const csvContent = "data:text/csv;charset=utf-8,"
                + "Date,Type\n"
                + events.map(e => `${e.date},${e.type}`).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `pto_calendar_${currentYear}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            debugLog('Calendar exported successfully');
            this.ptoManager.uiManager.showSuccess('Calendar exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            this.ptoManager.uiManager.showError('Failed to export calendar');
        }
    }
}

// Application Class
class App {
    constructor() {
        this.ptoManager = new PTOManager();
    }

    async initialize() {
        debugLog('Initializing application');
        
        try {
            // Set up welcome screen
            const welcomeScreen = document.getElementById('welcomeScreen');
            const appContainer = document.getElementById('appContainer');
            const getStartedBtn = document.getElementById('getStartedBtn');
            
            if (!welcomeScreen || !appContainer || !getStartedBtn) {
                throw new Error('Required UI elements not found');
            }

            // Setup initial state
            welcomeScreen.classList.remove('hidden');
            appContainer.classList.add('hidden');
            
            // Set up get started button
            getStartedBtn.addEventListener('click', () => this.handleGetStarted());

            if (CONFIG.DEBUG) {
                this.setupDebugUtilities();
            }

            // Initialize error handling
            this.setupErrorHandling();

        } catch (error) {
            console.error('Critical initialization error:', error);
            if (this.ptoManager.uiManager) {
                this.ptoManager.uiManager.showError('Failed to initialize application. Please refresh the page.');
            }
        }
    }

    handleGetStarted() {
        debugLog('Get Started button clicked');
        try {
            const welcomeScreen = document.getElementById('welcomeScreen');
            const appContainer = document.getElementById('appContainer');
            
            welcomeScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            
            setTimeout(() => {
                this.ptoManager.setupWizard.initialize();
            }, CONFIG.ANIMATION_DELAY);
        } catch (error) {
            console.error('Error in Get Started handler:', error);
            this.ptoManager.uiManager.showError('Failed to start application setup');
        }
    }

    setupDebugUtilities() {
        window.debugApp = {
            getCurrentState: () => ({
                userData: this.ptoManager.state.userData,
                currentYear,
                currentStep: this.ptoManager.setupWizard.currentStep,
                hasSetup: this.ptoManager.setupWizard.hasSetup,
                calendarInitialized: !!this.ptoManager.calendarManager.calendar
            }),
            clearData: () => {
                localStorage.clear();
                location.reload();
            },
            reloadCalendar: () => {
                if (this.ptoManager.calendarManager.calendar) {
                    this.ptoManager.calendarManager.refreshCalendar();
                    return 'Calendar refreshed';
                }
                return 'Calendar not initialized';
            }
        };

        console.log('Debug utilities available. Use window.debugApp to access debug functions.');
    }

    setupErrorHandling() {
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            console.error('Global error:', { msg, url, lineNo, columnNo, error });
            debugLog('Global error caught', msg);
            return false;
        };

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            debugLog('Unhandled promise rejection', event.reason);
        });
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM Content Loaded - Starting initialization');
    
    try {
        // Create and initialize the application
        const app = new App();
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

// Utility function to validate dates
function validateDates(start, end) {
    if (!start || !end) {
        return false;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
    }

    if (startDate > endDate) {
        return false;
    }

    return true;
}
