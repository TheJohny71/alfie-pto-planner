// Debug flag
const DEBUG = true;
function log(...args) {
    if (DEBUG) console.log(...args);
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
    DEFAULT_PTO: 0
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


// State Management
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
    
    while (current < end) {
        if (!isWeekend(current) && !isBankHoliday(current)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    return count;
}


// UI Helper Functions
function showLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.classList.remove('hidden');
}


function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.classList.add('hidden');
}


function showError(message) {
    console.error(message);
    Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        confirmButtonColor: CONFIG.COLORS.PTO
    });
}


function showSuccess(message) {
    Swal.fire({
        title: 'Success',
        text: message,
        icon: 'success',
        timer: 1500,
        confirmButtonColor: CONFIG.COLORS.PTO
    });
}


// Data Management Functions
function saveUserData() {
    localStorage.setItem('ptoData', JSON.stringify(userData));
}


function loadUserData() {
    const saved = localStorage.getItem('ptoData');
    return saved ? JSON.parse(saved) : null;
}


function updateSummary() {
    const elements = {
        totalPTO: document.getElementById('totalPTO'),
        plannedPTO: document.getElementById('plannedPTO'),
        remainingPTO: document.getElementById('remainingPTO'),
        bankHolidays: document.getElementById('bankHolidays')
    };

    if (elements.totalPTO) elements.totalPTO.textContent = userData.totalPTO;
    if (elements.plannedPTO) elements.plannedPTO.textContent = userData.plannedPTO;
    if (elements.remainingPTO) elements.remainingPTO.textContent = userData.totalPTO - userData.plannedPTO;
    if (elements.bankHolidays && BANK_HOLIDAYS[currentYear]) {
        elements.bankHolidays.textContent = BANK_HOLIDAYS[currentYear].length;
    }
}

// Validation Functions
function validateStep1() {
    const totalPTOInput = document.getElementById('totalPTOInput');
    const plannedPTOInput = document.getElementById('plannedPTOInput');
    
    if (!totalPTOInput || !plannedPTOInput) {
        showError('Required input fields not found');
        return false;
    }

    const totalPTO = parseInt(totalPTOInput.value);
    const plannedPTO = parseInt(plannedPTOInput.value);
    
    if (!totalPTO || totalPTO <= 0 || totalPTO > CONFIG.MAX_PTO) {
        showError('Please enter a valid number of PTO days (1-50)');
        return false;
    }
    
    if (!plannedPTO || plannedPTO < 0 || plannedPTO > totalPTO) {
        showError('Planned PTO cannot exceed total PTO days');
        return false;
    }
    
    return true;
}


// Setup Wizard Functions
function handleNextStep() {
    log('Next step clicked, current step:', currentStep);
    if (currentStep === 1 && !validateStep1()) {
        return;
    }

    if (currentStep < totalSteps) {
        currentStep++;
        showWizardStep(currentStep);
    } else {
        saveWizardData();
    }
}


function handlePrevStep() {
    if (currentStep > 1) {
        currentStep--;
        showWizardStep(currentStep);
    }
}


function showWizardStep(step) {
    log('Showing wizard step:', step);
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
        nextBtn.textContent = step === totalSteps ? 'Finish' : 'Next';
    }
}


function populateBankHolidays() {
    const container = document.querySelector('.bank-holiday-list');
    if (!container) return;

    const holidaysList = BANK_HOLIDAYS[currentYear].map(holiday => `
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


function populateMonthSelector() {
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


function saveWizardData() {
    log('Saving wizard data');
    const totalPTOInput = document.getElementById('totalPTOInput');
    const plannedPTOInput = document.getElementById('plannedPTOInput');

    if (totalPTOInput && plannedPTOInput) {
        userData.totalPTO = parseInt(totalPTOInput.value);
        userData.plannedPTO = parseInt(plannedPTOInput.value);

        userData.preferences.schoolHolidays = Array.from(
            document.querySelectorAll('input[name="schoolHolidays"]:checked')
        ).map(input => input.value);

        userData.preferences.preferredMonths = Array.from(
            document.querySelectorAll('input[name="preferredMonth"]:checked')
        ).map(input => parseInt(input.value));

        userData.preferences.extendBankHolidays = Array.from(
            document.querySelectorAll('.holiday-item input[type="checkbox"]:checked')
        ).map(input => ({
            date: input.dataset.date,
            extensionType: input.closest('.holiday-item').querySelector('.extension-type').value
        }));

        saveUserData();
        
        const setupModal = document.getElementById('setupModal');
        if (setupModal) setupModal.style.display = 'none';
        
        if (!calendar) {
            initializeApp();
        } else {
            calendar.refetchEvents();
            updateSummary();
        }

        showSuccess('PTO setup completed successfully');
    }
}


function setupWizardEventListeners(modal) {
    const closeBtn = document.getElementById('closeSetup');
    const nextBtn = document.getElementById('nextStep');
    const prevBtn = document.getElementById('prevStep');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            log('Close button clicked');
            modal.style.display = 'none';
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', handleNextStep);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', handlePrevStep);
    }
}

// Calendar Functions
function initializeCalendar() {
    log('Initializing calendar');
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
        showError('Calendar element not found');
        return;
    }

    try {
        if (typeof FullCalendar === 'undefined') {
            throw new Error('FullCalendar library not loaded');
        }

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            firstDay: 1,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
            },
            selectable: true,
            select: handleDateSelection,
            eventDidMount: handleEventMount,
            events: generateEvents(),
            eventClick: handleEventClick,
            dayCellDidMount: handleDayCellMount,
            displayEventTime: false,
            eventDisplay: 'block',
            dayMaxEvents: true,
            weekends: true,
            slotEventOverlap: false
        });

        calendar.render();
    } catch (error) {
        console.error('Calendar initialization error:', error);
        showError('Failed to initialize calendar');
    }
}


function generateEvents() {
    let events = [];
    
    // Add bank holidays
    if (BANK_HOLIDAYS[currentYear]) {
        BANK_HOLIDAYS[currentYear].forEach(holiday => {
            // Background event for coloring
            events.push({
                title: holiday.title,
                start: holiday.date,
                backgroundColor: CONFIG.COLORS.BANK_HOLIDAY,
                borderColor: CONFIG.COLORS.BANK_HOLIDAY,
                classNames: ['bank-holiday'],
                display: 'background'
            });
            
            // Text event for the holiday name
            events.push({
                title: holiday.title,
                start: holiday.date,
                classNames: ['bank-holiday-label'],
                display: 'block',
                textColor: 'black'
            });
        });
    }

    // Add PTO days
    if (userData.selectedDates && userData.selectedDates[currentYear]) {
        userData.selectedDates[currentYear].forEach(date => {
            events.push({
                title: 'PTO Day',
                start: date,
                backgroundColor: CONFIG.COLORS.PTO,
                borderColor: CONFIG.COLORS.PTO,
                classNames: ['pto-day']
            });
        });
    }

    return events;
}


// Event Handlers
function handleDateSelection(selectInfo) {
    if (!userData.totalPTO) {
        showError('Please complete PTO setup first');
        return;
    }

    const startDate = selectInfo.start;
    const endDate = selectInfo.end;

    if (isWeekend(startDate) || isWeekend(endDate)) {
        showError('Cannot select weekends');
        return;
    }

    if (isBankHoliday(startDate) || isBankHoliday(endDate)) {
        showError('Cannot select bank holidays');
        return;
    }

    const workingDays = calculateWorkingDays(startDate, endDate);
    
    if (userData.plannedPTO + workingDays > userData.totalPTO) {
        showError(`Not enough PTO days remaining. You have ${userData.totalPTO - userData.plannedPTO} days left.`);
        return;
    }

    Swal.fire({
        title: 'Add PTO Days',
        text: `Add PTO from ${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: CONFIG.COLORS.PTO,
        confirmButtonText: 'Add PTO'
    }).then((result) => {
        if (result.isConfirmed) {
            addPTODays(startDate, endDate);
        }
    });
}


function handleEventClick(info) {
    if (info.event.classNames.includes('pto-day')) {
        Swal.fire({
            title: 'Remove PTO Day?',
            text: 'Do you want to remove this PTO day?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: CONFIG.COLORS.PTO
        }).then((result) => {
            if (result.isConfirmed) {
                removePTODay(info.event);
            }
        });
    }
}


function handleEventMount(info) {
    const eventEl = info.el;
    const event = info.event;

    if (event.classNames.includes('bank-holiday')) {
        eventEl.style.backgroundColor = CONFIG.COLORS.BANK_HOLIDAY;
        eventEl.style.color = 'black';
    } else if (event.classNames.includes('pto-day')) {
        eventEl.style.backgroundColor = CONFIG.COLORS.PTO;
        eventEl.style.color = 'white';
    }

    if (event.title) {
        eventEl.setAttribute('title', event.title);
    }
}


function handleDayCellMount(arg) {
    if (isWeekend(arg.date)) {
        arg.el.style.backgroundColor = CONFIG.COLORS.WEEKEND;
    }
}


function handleYearChange(e) {
    currentYear = parseInt(e.target.value);
    calendar.refetchEvents();
    updateSummary();
}


// PTO Management Functions
function addPTODays(start, end) {
    let currentDate = new Date(start);
    const endDate = new Date(end);
    
    while (currentDate < endDate) {
        if (!isWeekend(currentDate) && !isBankHoliday(currentDate)) {
            const dateStr = formatDate(currentDate);
            if (!userData.selectedDates[currentYear]) {
                userData.selectedDates[currentYear] = [];
            }
            
            if (!userData.selectedDates[currentYear].includes(dateStr)) {
                userData.selectedDates[currentYear].push(dateStr);
                userData.plannedPTO++;
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    calendar.refetchEvents();
    updateSummary();
    saveUserData();
    showSuccess('PTO days added successfully');
}


function removePTODay(event) {
    const dateStr = formatDate(event.start);
    if (userData.selectedDates[currentYear]) {
        userData.selectedDates[currentYear] = userData.selectedDates[currentYear]
            .filter(date => date !== dateStr);
        userData.plannedPTO--;
    }
    
    event.remove();
    updateSummary();
    saveUserData();
    showSuccess('PTO day removed');
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Clear any old data
    localStorage.clear();
    
    // Get elements
    const welcomeScreen = document.getElementById('welcomeScreen');
    const appContainer = document.getElementById('appContainer');
    const getStartedBtn = document.getElementById('getStartedBtn');
    
    console.log('Elements found:', {
        welcomeScreen: !!welcomeScreen,
        appContainer: !!appContainer,
        getStartedBtn: !!getStartedBtn
    });

    if (!welcomeScreen || !appContainer || !getStartedBtn) {
        console.error('Required elements not found');
        return;
    }

    // Ensure welcome screen is visible and app container is hidden initially
    welcomeScreen.classList.remove('hidden');
    appContainer.classList.add('hidden');

    // Add click handler
    getStartedBtn.addEventListener('click', function() {
        console.log('Get Started button clicked');
        
        try {
            welcomeScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            setTimeout(() => {
                initializeSetupWizard();
            }, 100);
            console.log('Setup wizard initialized');
        } catch (error) {
            console.error('Error in Get Started click handler:', error);
            Swal.fire({
                title: 'Error',
                text: 'There was a problem starting the application. Please refresh the page and try again.',
                icon: 'error'
            });
        }
    });
});


function initializeApp() {
    log('Initializing app');
    showLoading();
    try {
        initializeCalendar();
        setupEventListeners();
        updateSummary();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    } finally {
        hideLoading();
    }
}


function initializeSetupWizard() {
    log('Initializing setup wizard');
    const setupModal = document.getElementById('setupModal');
    
    if (!setupModal) {
        console.error('Setup modal not found');
        Swal.fire({
            title: 'Error',
            text: 'Setup wizard could not be initialized',
            icon: 'error'
        });
        return;
    }

    currentStep = 1;
    setupModal.style.display = 'flex';
    
    showWizardStep(1);
    populateBankHolidays();
    populateMonthSelector();

    if (!hasSetup) {
        setupWizardEventListeners(setupModal);
        hasSetup = true;
    }

    log('Setup wizard initialized successfully');
}


// Setup Event Listeners
function setupEventListeners() {
    log('Setting up event listeners');
    const setupPTOBtn = document.getElementById('setupPTOBtn');
    const exportBtn = document.getElementById('exportBtn');
    const yearSelect = document.getElementById('yearSelect');

    if (setupPTOBtn) setupPTOBtn.addEventListener('click', initializeSetupWizard);
    if (exportBtn) exportBtn.addEventListener('click', exportCalendar);
    if (yearSelect) yearSelect.addEventListener('change', handleYearChange);
}


// Export Functionality
function exportCalendar() {
    const events = calendar.getEvents()
        .filter(event => event.classNames.includes('pto-day'))
        .map(event => ({
            date: formatDate(event.start),
            type: 'PTO Day'
        }));

    if (events.length === 0) {
        showError('No PTO days to export');
        return;
    }

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

    showSuccess('Calendar exported successfully');
}
