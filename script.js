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

// Data Management Functions
function saveUserData() {
    localStorage.setItem('ptoData', JSON.stringify(userData));
    console.log('User data saved:', userData);
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
        markBankHolidays();
    } catch (error) {
        console.error('Calendar initialization error:', error);
        showError('Failed to initialize calendar');
    }
}


function generateEvents() {
    let events = [];
    console.log('Generating events for year:', currentYear);
    
    // Add bank holidays with improved visibility
    if (BANK_HOLIDAYS[currentYear]) {
        BANK_HOLIDAYS[currentYear].forEach(holiday => {
            console.log('Adding holiday:', holiday);
            // Background event for coloring
            events.push({
                title: holiday.title,
                start: holiday.date,
                backgroundColor: CONFIG.COLORS.BANK_HOLIDAY,
                borderColor: CONFIG.COLORS.BANK_HOLIDAY,
                classNames: ['bank-holiday'],
                display: 'background',
                allDay: true
            });
            
            // Text event for the holiday name
            events.push({
                title: holiday.title,
                start: holiday.date,
                classNames: ['bank-holiday-label'],
                display: 'block',
                textColor: 'black',
                allDay: true
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


function markBankHolidays() {
    if (!BANK_HOLIDAYS[currentYear]) return;
    
    BANK_HOLIDAYS[currentYear].forEach(holiday => {
        const date = holiday.date;
        const el = calendar.el.querySelector(`[data-date="${date}"]`);
        if (el) {
            el.classList.add('fc-day-bank-holiday');
            el.setAttribute('title', holiday.title);
        }
    });
}


function handleEventMount(info) {
    const eventEl = info.el;
    const event = info.event;

    if (event.classNames.includes('bank-holiday')) {
        eventEl.style.backgroundColor = CONFIG.COLORS.BANK_HOLIDAY;
        eventEl.style.color = 'black';
        eventEl.style.fontWeight = '500';
        eventEl.setAttribute('title', event.title);
    } else if (event.classNames.includes('pto-day')) {
        eventEl.style.backgroundColor = CONFIG.COLORS.PTO;
        eventEl.style.color = 'white';
    }
}


function handleDayCellMount(arg) {
    if (isWeekend(arg.date)) {
        arg.el.style.backgroundColor = CONFIG.COLORS.WEEKEND;
    }
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


function handleYearChange(e) {
    currentYear = parseInt(e.target.value);
    console.log('Year changed to:', currentYear);
    if (calendar) {
        calendar.removeAllEvents();
        calendar.refetchEvents();
        updateSummary();
        setTimeout(() => {
            markBankHolidays();
        }, 100);
    }
}


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

// Application Logic
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


function setupEventListeners() {
    log('Setting up event listeners');
    const setupPTOBtn = document.getElementById('setupPTOBtn');
    const exportBtn = document.getElementById('exportBtn');
    const yearSelect = document.getElementById('yearSelect');

    if (setupPTOBtn) setupPTOBtn.addEventListener('click', initializeSetupWizard);
    if (exportBtn) exportBtn.addEventListener('click', exportCalendar);
    if (yearSelect) yearSelect.addEventListener('change', handleYearChange);
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

// Additional initialization function for when returning to app
function reinitializeApp() {
    const savedData = loadUserData();
    if (savedData) {
        userData = savedData;
        initializeApp();
    } else {
        welcomeScreen.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
}


// Function to ensure proper cleanup when closing modals
function cleanupModal() {
    currentStep = 1;
    showWizardStep(1);
    const setupModal = document.getElementById('setupModal');
    if (setupModal) {
        setupModal.style.display = 'none';
    }
}


// Additional event handlers for modal navigation
function handleModalClose() {
    const setupModal = document.getElementById('setupModal');
    if (setupModal) {
        setupModal.style.display = 'none';
        if (!calendar) {
            welcomeScreen.classList.remove('hidden');
            appContainer.classList.add('hidden');
        }
    }
}


// Enhanced validation for dates
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


// Improved event generation with error handling
function safeGenerateEvents() {
    try {
        return generateEvents();
    } catch (error) {
        console.error('Error generating events:', error);
        showError('Failed to generate calendar events');
        return [];
    }
}


// Update the setupEventListeners function to include these new handlers
function setupExtendedEventListeners() {
    const closeButtons = document.querySelectorAll('.close-button, .modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', handleModalClose);
    });

    // Add escape key handler for modals
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            handleModalClose();
        }
    });

    // Update summary when window regains focus
    window.addEventListener('focus', function() {
        if (calendar) {
            updateSummary();
        }
    });
}


// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting full initialization');
    
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

    // Set up initial state
    welcomeScreen.classList.remove('hidden');
    appContainer.classList.add('hidden');

    // Set up all event listeners
    setupExtendedEventListeners();

    // Add click handler for get started
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

    // Check for existing data
    const savedData = loadUserData();
    if (savedData) {
        console.log('Found existing user data, reinitializing app');
        userData = savedData;
        welcomeScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        initializeApp();
    }

    console.log('Initialization complete');
});


// Initialize on page load
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
