// Part 1: Core Setup & Configuration
// =========================================

// Debug Configuration
const DEBUG = true;

// Debug State Management
window.debugState = {
    lastAction: null,
    selectedDates: [],
    events: []
};

function debugLog(message, data) {
    if (DEBUG) {
        console.log(`DEBUG: ${message}`, data || '');
    }
}

function logState(action, data) {
    if (DEBUG) {
        window.debugState.lastAction = action;
        console.group(`PTO Action: ${action}`);
        console.log('Data:', data);
        console.log('Current userData:', JSON.parse(JSON.stringify(userData)));
        console.log('Calendar State:', calendar ? 'Initialized' : 'Not Initialized');
        console.groupEnd();
    }
}

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
    BUSINESS_HOURS: {
        start: '09:00',
        end: '17:00',
        daysOfWeek: [1, 2, 3, 4, 5]
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
    // ... (other years remain the same)
};

// Core Classes
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
            debugLog('Data loaded', data);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Load error:', error);
            return null;
        }
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

// Initial State Setup
let hasSetup = false;
let calendar;
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

// Add CSS Styles
const styles = `
    @keyframes addPTO {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
    }

    .event-tooltip {
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 1000;
    }

    .tooltip-content {
        font-size: 12px;
        line-height: 1.4;
    }

    .fc-day-bank-holiday {
        background-color: rgba(245, 158, 11, 0.15) !important;
    }

    .bank-holiday {
        font-weight: 600 !important;
        font-size: 0.95em !important;
        color: #B45309 !important;
        text-shadow: 0px 0px 1px rgba(255, 255, 255, 0.8);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Part 2: Main PTO Manager Class
// =========================================

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
                    preferredMonths: [],
                    schoolHolidays: []
                }
            },
            bankHolidays: new Map(),
            undoStack: [],
            redoStack: []
        };
        
        this.eventEmitter = new EventEmitter();
        this.storageManager = new StorageManager();
    }

    async init() {
        debugLog('Initializing PTO Manager');
        showLoading();
        
        try {
            await this.loadBankHolidays();
            await this.setupCalendar();
            await this.loadSavedData();
            this.setupEventListeners();
            this.refreshDisplay();
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to initialize application');
        } finally {
            hideLoading();
        }
    }

    async loadBankHolidays() {
        debugLog('Loading bank holidays for year:', currentYear);
        if (BANK_HOLIDAYS[currentYear]) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            BANK_HOLIDAYS[currentYear].forEach(holiday => {
                const holidayDate = new Date(holiday.date);
                if (holidayDate >= today) {
                    this.state.bankHolidays.set(holiday.date, holiday.title);
                }
            });
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
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'z':
                        this.undo();
                        break;
                    case 'y':
                        this.redo();
                        break;
                }
            }
        });

        // Calendar date change
        this.eventEmitter.on('dateChange', (date) => {
            const newYear = date.getFullYear();
            if (newYear !== this.state.currentYear) {
                this.handleYearChange(newYear);
            }
        });

        // PTO changes
        this.eventEmitter.on('ptoChange', () => {
            this.addToUndoStack();
            this.refreshDisplay();
            this.storageManager.save(this.state.userData);
        });
    }

    handleYearChange(newYear) {
        debugLog('Year change detected', { from: this.state.currentYear, to: newYear });
        this.state.currentYear = newYear;
        this.loadBankHolidays();
        this.refreshDisplay();
    }

    addToUndoStack() {
        const currentState = JSON.stringify(this.state.userData);
        this.state.undoStack.push(currentState);
        this.state.redoStack = []; // Clear redo stack on new action
    }

    undo() {
        if (this.state.undoStack.length > 0) {
            const currentState = JSON.stringify(this.state.userData);
            this.state.redoStack.push(currentState);
            
            const previousState = this.state.undoStack.pop();
            this.state.userData = JSON.parse(previousState);
            this.refreshDisplay();
            showSuccess('Undo successful');
        }
    }

    redo() {
        if (this.state.redoStack.length > 0) {
            const currentState = JSON.stringify(this.state.userData);
            this.state.undoStack.push(currentState);
            
            const nextState = this.state.redoStack.pop();
            this.state.userData = JSON.parse(nextState);
            this.refreshDisplay();
            showSuccess('Redo successful');
        }
    }

    refreshDisplay() {
        if (this.state.calendar) {
            this.state.calendar.removeAllEvents();
            const events = this.generateEvents();
            this.state.calendar.addEventSource(events);
            this.state.calendar.render();
            
            setTimeout(() => {
                this.markBankHolidays();
            }, CONFIG.ANIMATION_DELAY);
        }
        this.updateSummary();
    }

    updateSummary() {
        const elements = {
            totalPTO: document.getElementById('totalPTO'),
            plannedPTO: document.getElementById('plannedPTO'),
            remainingPTO: document.getElementById('remainingPTO'),
            bankHolidays: document.getElementById('bankHolidays')
        };

        if (elements.totalPTO) elements.totalPTO.textContent = this.state.userData.totalPTO;
        if (elements.plannedPTO) elements.plannedPTO.textContent = this.state.userData.plannedPTO;
        if (elements.remainingPTO) {
            elements.remainingPTO.textContent = 
                this.state.userData.totalPTO - this.state.userData.plannedPTO;
        }
        if (elements.bankHolidays && BANK_HOLIDAYS[this.state.currentYear]) {
            elements.bankHolidays.textContent = 
                Array.from(this.state.bankHolidays.keys()).length;
        }
    }

    generateEvents() {
        const events = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add bank holidays
        this.state.bankHolidays.forEach((title, date) => {
            events.push({
                title: title,
                start: date,
                allDay: true,
                className: 'bank-holiday-bg',
                display: 'background',
                backgroundColor: CONFIG.COLORS.BANK_HOLIDAY
            });

            events.push({
                title: title,
                start: date,
                allDay: true,
                className: 'bank-holiday',
                display: 'block'
            });
        });

        // Add PTO days
        if (this.state.userData.selectedDates[this.state.currentYear]) {
            this.state.userData.selectedDates[this.state.currentYear].forEach(date => {
                const eventDate = new Date(date);
                if (eventDate >= today) {
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

        return events;
    }

    markBankHolidays() {
        this.state.bankHolidays.forEach((title, date) => {
            const dayEl = document.querySelector(`td[data-date="${date}"]`);
            if (dayEl) {
                dayEl.classList.add('fc-day-bank-holiday');
                dayEl.setAttribute('title', title);
            }
        });
    }
}


// Part 3: UI & Wizard Management
// =========================================

class UIManager {
    constructor(ptoManager) {
        this.ptoManager = ptoManager;
        this.setupWizard = new SetupWizard(ptoManager);
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

            .bank-holiday-bg {
                opacity: 0.25;
            }

            .fc .fc-daygrid-day.fc-day-bank-holiday {
                background-color: rgba(245, 158, 11, 0.15) !important;
            }

            .pto-day {
                animation: addPTO 0.5s ease-in-out;
            }

            @keyframes addPTO {
                0% { transform: scale(0.8); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(styleSheet);
        debugLog('Calendar styles added');
    }
}

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

    setupEventListeners(modal) {
        debugLog('Setting up wizard event listeners');
        const closeBtn = document.getElementById('closeSetup');
        const nextBtn = document.getElementById('nextStep');
        const prevBtn = document.getElementById('prevStep');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                debugLog('Close button clicked');
                this.handleModalClose();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handleNextStep());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.handlePrevStep());
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
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
        
        if (!plannedPTO || plannedPTO < 0 || plannedPTO > totalPTO) {
            this.ptoManager.uiManager.showError('Planned PTO cannot exceed total PTO days');
            return false;
        }
        
        return true;
    }

    populateBankHolidays() {
        debugLog('Populating bank holidays');
        const container = document.querySelector('.bank-holiday-list');
        if (!container) {
            debugLog('Bank holiday container not found');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureHolidays = BANK_HOLIDAYS[currentYear]?.filter(holiday => {
            const holidayDate = new Date(holiday.date);
            return holidayDate >= today;
        });

        if (!futureHolidays || futureHolidays.length === 0) {
            container.innerHTML = '<p>No upcoming bank holidays available for selected year.</p>';
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
        if (!container) {
            debugLog('Month selector container not found');
            return;
        }

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
        debugLog('Saving wizard data');
        try {
            const totalPTOInput = document.getElementById('totalPTOInput');
            const plannedPTOInput = document.getElementById('plannedPTOInput');

            if (totalPTOInput && plannedPTOInput) {
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
                
                if (!this.ptoManager.state.calendar) {
                    this.ptoManager.init();
                } else {
                    this.ptoManager.refreshCalendar();
                }

                this.ptoManager.uiManager.showSuccess('PTO setup completed successfully');
                debugLog('Wizard data saved successfully', this.ptoManager.state.userData);
            }
        } catch (error) {
            console.error('Error saving wizard data:', error);
            this.ptoManager.uiManager.showError('Failed to save setup data');
        }
    }
}


// Part 4: Calendar Operations & Integration
// =========================================

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

class CalendarManager {
    constructor(ptoManager) {
        this.ptoManager = ptoManager;
        this.calendarEl = null;
        this.calendar = null;
        this.eventCache = new Map();
        this.lastRefresh = null;
        this.currentView = 'dayGridMonth';
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
                    end: `${currentYear}-12-31`,
                    startTime: '09:00',
                    endTime: '17:00'
                },
                businessHours: CONFIG.BUSINESS_HOURS,
                nowIndicator: true,
                scrollTime: '09:00:00',
                slotMinTime: '09:00:00',
                slotMaxTime: '17:00:00',
                select: (selectInfo) => this.handleDateSelection(selectInfo),
                eventDidMount: (info) => {
                    this.handleEventMount(info);
                    this.addEventHoverEffect(info);
                },
                events: (info) => this.generateEvents(info),
                eventClick: (info) => this.handleEventClick(info),
                dayCellDidMount: (arg) => this.handleDayCellMount(arg),
                displayEventTime: false,
                eventDisplay: 'block',
                height: 'auto',
                dayMaxEvents: true,
                eventColor: CONFIG.COLORS.PTO,
                selectOverlap: false,
                datesSet: (dateInfo) => {
                    const newYear = dateInfo.start.getFullYear();
                    if (newYear !== currentYear) {
                        debugLog('Year changed in calendar view', { from: currentYear, to: newYear });
                        currentYear = newYear;
                        this.refreshCalendar();
                    }
                }
            });

            debugLog('Calendar configuration set');
            this.calendar.render();
            debugLog('Calendar rendered');

        } catch (error) {
            console.error('Calendar initialization error:', error);
            throw error;
        }
    }

    handleDateSelection(selectInfo) {
        debugLog('Date selection started', selectInfo);
        if (!this.ptoManager.state.userData.totalPTO) {
            this.ptoManager.uiManager.showError('Please complete PTO setup first');
            return;
        }

        const startDate = selectInfo.start;
        const endDate = selectInfo.end;

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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            this.ptoManager.uiManager.showError('Cannot select past dates');
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

    handleEventClick(info) {
        debugLog('Event clicked', { title: info.event.title, date: info.event.start });
        if (info.event.classNames.includes('pto-day')) {
            this.confirmRemovePTODay(info.event);
        }
    }

    confirmPTOSelection(startDate, endDate) {
        Swal.fire({
            title: 'Add PTO Days',
            text: `Add PTO from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: CONFIG.COLORS.PTO,
            confirmButtonText: 'Add PTO'
        }).then((result) => {
            if (result.isConfirmed) {
                debugLog('User confirmed PTO addition');
                this.addPTODays(startDate, endDate);
            }
        });
    }

    addPTODays(startDate, endDate) {
        debugLog('Adding PTO days', { startDate, endDate });
        let currentDate = new Date(startDate);
        let addedDays = 0;

        while (currentDate < endDate) {
            if (!isWeekend(currentDate) && !isBankHoliday(currentDate)) {
                const dateStr = formatDate(currentDate);
                if (!this.ptoManager.state.userData.selectedDates[currentYear].includes(dateStr)) {
                    this.ptoManager.state.userData.selectedDates[currentYear].push(dateStr);
                    addedDays++;
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (addedDays > 0) {
            this.ptoManager.state.userData.plannedPTO += addedDays;
            this.refreshCalendar();
            this.ptoManager.updateSummary();
            this.ptoManager.storageManager.save(this.ptoManager.state.userData);
            this.ptoManager.uiManager.showSuccess(`Added ${addedDays} PTO day${addedDays > 1 ? 's' : ''}`);
        }
    }

    markBankHolidays() {
        if (BANK_HOLIDAYS[currentYear]) {
            BANK_HOLIDAYS[currentYear].forEach(holiday => {
                const dayEl = document.querySelector(`td[data-date="${holiday.date}"]`);
                if (dayEl) {
                    dayEl.classList.add('fc-day-bank-holiday');
                    dayEl.setAttribute('title', holiday.title);
                }
            });
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
        if (this.ptoManager.state.userData.selectedDates[this.ptoManager.state.currentYear]) {
            this.ptoManager.state.userData.selectedDates[this.ptoManager.state.currentYear].forEach(date => {
                const eventDate = new Date(date);
                if (eventDate >= today) {
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

        return events;
    }
}

// Application Integration
class App {
    constructor() {
        this.ptoManager = new PTOManager();
        this.setupWizard = new SetupWizard(this.ptoManager);
        this.exportManager = new ExportManager(this.ptoManager);
        this.calendarManager = new CalendarManager(this.ptoManager);
        
        this.ptoManager.setupWizard = this.setupWizard;
        this.ptoManager.exportManager = this.exportManager;
        this.ptoManager.calendarManager = this.calendarManager;
    }

    async initialize() {
        debugLog('Initializing application');
        showLoading();
        
        try {
            await this.setupMainEventListeners();
            this.ptoManager.uiManager.addCalendarStyles();
            
            const welcomeScreen = document.getElementById('welcomeScreen');
            const appContainer = document.getElementById('appContainer');
            const getStartedBtn = document.getElementById('getStartedBtn');
            
            if (!welcomeScreen || !appContainer || !getStartedBtn) {
                throw new Error('Required UI elements not found');
            }

            welcomeScreen.classList.remove('hidden');
            appContainer.classList.add('hidden');
            getStartedBtn.addEventListener('click', () => this.handleGetStarted());

            if (DEBUG) {
                this.setupDebugUtilities();
            }

        } catch (error) {
            console.error('Critical initialization error:', error);
            this.ptoManager.uiManager.showError('Failed to initialize application. Please refresh the page.');
        } finally {
            hideLoading();
        }
    }

    async setupMainEventListeners() {
        debugLog('Setting up main event listeners');
        try {
            const setupPTOBtn = document.getElementById('setupPTOBtn');
            const exportBtn = document.getElementById('exportBtn');
            const yearSelect = document.getElementById('yearSelect');
            const settingsBtn = document.getElementById('settingsBtn');

            if (setupPTOBtn) {
                setupPTOBtn.addEventListener('click', () => this.setupWizard.initialize());
            }

            if (exportBtn) {
                exportBtn.addEventListener('click', () => this.exportManager.exportCalendar());
            }

            if (yearSelect) {
                yearSelect.addEventListener('change', (e) => this.handleYearChange(e));
            }

            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    this.setupWizard.initialize();
                });
            }

            window.addEventListener('focus', () => {
                if (this.calendarManager.calendar) {
                    this.calendarManager.refreshCalendar();
                    debugLog('Calendar refreshed on window focus');
                }
            });

            debugLog('All main event listeners setup complete');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            throw new Error('Failed to setup application controls');
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
                this.setupWizard.initialize();
            }, CONFIG.ANIMATION_DELAY);
        } catch (error) {
            console.error('Error in Get Started handler:', error);
            this.ptoManager.uiManager.showError('Failed to start application setup');
        }
    }

    handleYearChange(e) {
        const newYear = parseInt(e.target.value);
        debugLog('Year change requested', { from: currentYear, to: newYear });
        
        if (newYear !== currentYear) {
            currentYear = newYear;
            if (this.calendarManager.calendar) {
                this.calendarManager.calendar.gotoDate(`${currentYear}-01-01`);
                this.calendarManager.refreshCalendar();
            }
        }
    }

    setupDebugUtilities() {
        window.debugApp = {
            getCurrentState: () => ({
                userData: this.ptoManager.state.userData,
                currentYear,
                currentStep: this.setupWizard.currentStep,
                hasSetup: this.setupWizard.hasSetup,
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

        console.log('Debug utilities available. Use window.debugApp to access debug functions.');
    }
}

// Error Handling
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global error:', { msg, url, lineNo, columnNo, error });
    debugLog('Global error caught', msg);
    return false;
};

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    debugLog('Unhandled promise rejection', event.reason);
});

// Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOM Content Loaded - Starting initialization');
    
    try {
        // Create and initialize the application
        const app = new App();
        app.initialize().catch(error => {
            console.error('Application initialization failed:', error);
        });
    } catch (error) {
        console.error('Critical initialization error:', error);
        if (DEBUG) {
            console.error('Detailed error:', error.stack);
        }
    }
});

// Export necessary classes if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        App,
        PTOManager,
        CalendarManager,
        UIManager,
        SetupWizard,
        ExportManager
    };
}
