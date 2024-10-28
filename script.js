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
    ANIMATION_DELAY: 100
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
    if (loader) {
        loader.classList.remove('hidden');
        debugLog('Loading indicator shown');
    }
}


function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.classList.add('hidden');
        debugLog('Loading indicator hidden');
    }
}


function showError(message) {
    debugLog('Error:', message);
    console.error(message);
    Swal.fire({
        title: 'Error',
        text: message,
        icon: 'error',
        confirmButtonColor: CONFIG.COLORS.PTO
    });
}


function showSuccess(message) {
    debugLog('Success:', message);
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
    try {
        localStorage.setItem('ptoData', JSON.stringify(userData));
        debugLog('User data saved successfully', userData);
        return true;
    } catch (error) {
        console.error('Error saving user data:', error);
        return false;
    }
}


function loadUserData() {
    try {
        const saved = localStorage.getItem('ptoData');
        if (saved) {
            debugLog('User data loaded successfully');
            return JSON.parse(saved);
        }
        debugLog('No saved user data found');
        return null;
    } catch (error) {
        console.error('Error loading user data:', error);
        return null;
    }
}


function updateSummary() {
    debugLog('Updating summary');
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

    logState('Summary Updated', {
        total: userData.totalPTO,
        planned: userData.plannedPTO,
        remaining: userData.totalPTO - userData.plannedPTO,
        bankHolidays: BANK_HOLIDAYS[currentYear]?.length
    });
}


function addCalendarStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .fc-day-bank-holiday {
            background-color: rgba(245, 158, 11, 0.1) !important;
        }
        
        .bank-holiday {
            font-weight: 500 !important;
            font-size: 0.9em !important;
            margin: 1px 0 !important;
            padding: 2px !important;
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
            background-color: rgba(245, 158, 11, 0.1) !important;
        }

        .bank-holiday-bg {
            opacity: 0.3;
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


// Validation Functions
function validateDates(start, end) {
    if (!start || !end) {
        debugLog('Invalid dates - missing start or end');
        return false;
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        debugLog('Invalid dates - invalid date format');
        return false;
    }

    if (startDate > endDate) {
        debugLog('Invalid dates - start date after end date');
        return false;
    }

    return true;
}


// Calendar Functions
function initializeCalendar() {
    debugLog('Initializing calendar');
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
            select: function(selectInfo) {
                debugLog('Date selection:', selectInfo);
                handleDateSelection(selectInfo);
            },
            eventDidMount: handleEventMount,
            events: generateEvents,
            eventClick: handleEventClick,
            dayCellDidMount: handleDayCellMount,
            displayEventTime: false,
            eventDisplay: 'block',
            height: 'auto',
            dayMaxEvents: true,
            eventColor: CONFIG.COLORS.PTO,
            selectOverlap: false,
            datesSet: function(dateInfo) {
                const newYear = dateInfo.start.getFullYear();
                if (newYear !== currentYear) {
                    debugLog('Year changed in calendar view', { from: currentYear, to: newYear });
                    currentYear = newYear;
                    refreshCalendar();
                }
            }
        });

        debugLog('Calendar configuration set');
        calendar.render();
        debugLog('Calendar rendered');
        
        setTimeout(() => {
            markBankHolidays();
            debugLog('Bank holidays marked');
        }, CONFIG.ANIMATION_DELAY);

    } catch (error) {
        console.error('Calendar initialization error:', error);
        showError('Failed to initialize calendar');
    }
}


function generateEvents(fetchInfo, successCallback, failureCallback) {
    debugLog('Generating events for year:', currentYear);
    let events = [];

    try {
        // Add bank holidays
        if (BANK_HOLIDAYS[currentYear]) {
            debugLog('Adding bank holidays', BANK_HOLIDAYS[currentYear]);
            BANK_HOLIDAYS[currentYear].forEach(holiday => {
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
            });
        }

        // Add PTO days
        if (userData.selectedDates && userData.selectedDates[currentYear]) {
            debugLog('Adding PTO days:', userData.selectedDates[currentYear]);
            userData.selectedDates[currentYear].forEach(date => {
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

        debugLog('Total events generated:', events.length);
        
        if (successCallback) {
            successCallback(events);
        }
        return events;

    } catch (error) {
        console.error('Error generating events:', error);
        if (failureCallback) {
            failureCallback(error);
        }
        return [];
    }
}


function markBankHolidays() {
    debugLog('Marking bank holidays for year', currentYear);
    if (!BANK_HOLIDAYS[currentYear]) {
        debugLog('No bank holidays found for year', currentYear);
        return;
    }

    BANK_HOLIDAYS[currentYear].forEach(holiday => {
        const dateStr = holiday.date;
        debugLog('Processing holiday', dateStr);
        
        const dayEl = document.querySelector(`td[data-date="${dateStr}"]`);
        if (dayEl) {
            dayEl.classList.add('fc-day-bank-holiday');
            dayEl.setAttribute('title', holiday.title);
            debugLog('Marked holiday', dateStr);
        } else {
            debugLog('Day element not found for', dateStr);
        }
    });
}


function handleEventMount(info) {
    debugLog('Mounting event', info.event.title);
    const eventEl = info.el;
    const event = info.event;

    try {
        if (event.classNames.includes('bank-holiday-bg')) {
            eventEl.style.backgroundColor = CONFIG.COLORS.BANK_HOLIDAY;
        } else if (event.classNames.includes('bank-holiday')) {
            eventEl.style.backgroundColor = 'transparent';
            eventEl.style.borderColor = 'transparent';
            eventEl.style.color = 'black';
            eventEl.style.fontWeight = '500';
        } else if (event.classNames.includes('pto-day')) {
            eventEl.style.backgroundColor = CONFIG.COLORS.PTO;
            eventEl.style.borderColor = CONFIG.COLORS.PTO;
            eventEl.style.color = 'white';
        }
    } catch (error) {
        console.error('Error mounting event:', error);
    }
}


function handleDayCellMount(arg) {
    try {
        if (isWeekend(arg.date)) {
            arg.el.style.backgroundColor = CONFIG.COLORS.WEEKEND;
        }
    } catch (error) {
        console.error('Error mounting day cell:', error);
    }
}


function refreshCalendar() {
    debugLog('Refreshing calendar');
    if (calendar) {
        calendar.removeAllEvents();
        calendar.refetchEvents();
        setTimeout(() => {
            markBankHolidays();
        }, CONFIG.ANIMATION_DELAY);
        updateSummary();
    }
}

// Event Handlers
function handleDateSelection(selectInfo) {
    debugLog('Date selection started', selectInfo);
    if (!userData.totalPTO) {
        showError('Please complete PTO setup first');
        return;
    }

    const startDate = selectInfo.start;
    const endDate = selectInfo.end;

    debugLog('Selected date range:', { 
        start: formatDate(startDate), 
        end: formatDate(endDate),
        currentYear: currentYear 
    });

    if (!validateDates(startDate, endDate)) {
        showError('Invalid date selection');
        return;
    }

    if (isWeekend(startDate) || isWeekend(endDate)) {
        showError('Cannot select weekends');
        return;
    }

    if (isBankHoliday(startDate) || isBankHoliday(endDate)) {
        showError('Cannot select bank holidays');
        return;
    }

    const workingDays = calculateWorkingDays(startDate, endDate);
    debugLog('Working days calculated:', workingDays);
    
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
            debugLog('User confirmed PTO addition');
            addPTODays(startDate, endDate);
        }
    });
}


function handleEventClick(info) {
    debugLog('Event clicked', { title: info.event.title, date: info.event.start });
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
    const newYear = parseInt(e.target.value);
    debugLog('Year change requested', { from: currentYear, to: newYear });
    
    if (newYear !== currentYear) {
        currentYear = newYear;
        if (calendar) {
            calendar.g
            calendar.gotoDate(`${currentYear}-01-01`);
            refreshCalendar();
        }
    }
}


function addPTODays(start, end) {
    debugLog('Starting addPTODays', { start: formatDate(start), end: formatDate(end) });
    
    // Ensure both dates are Date objects
    let currentDate = new Date(start);
    const endDate = new Date(end);
    let addedDays = 0;
    
    // Initialize year's array if needed
    if (!userData.selectedDates[currentYear]) {
        userData.selectedDates[currentYear] = [];
        debugLog('Initialized selectedDates for year', currentYear);
    }
    
    // Add each eligible day
    while (currentDate < endDate) {
        const dateStr = formatDate(currentDate);
        debugLog('Processing date:', dateStr);
        
        if (!isWeekend(currentDate) && !isBankHoliday(currentDate)) {
            if (!userData.selectedDates[currentYear].includes(dateStr)) {
                userData.selectedDates[currentYear].push(dateStr);
                addedDays++;
                debugLog('Added PTO day:', dateStr);
            }
        } else {
            debugLog('Skipping date (weekend or holiday):', dateStr);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (addedDays > 0) {
        debugLog('Updating userData with new PTO days', {
            addedDays,
            newTotal: userData.plannedPTO + addedDays
        });
        
        userData.plannedPTO += addedDays;
        
        // Force calendar refresh
        debugLog('Refreshing calendar display');
        if (calendar) {
            calendar.removeAllEvents();
            calendar.refetchEvents();
        }
        
        // Update UI and save
        updateSummary();
        saveUserData();
        
        debugLog('PTO days successfully added', {
            totalAdded: addedDays,
            currentPTODays: userData.selectedDates[currentYear]
        });
        
        showSuccess(`Added ${addedDays} PTO day${addedDays > 1 ? 's' : ''}`);
    } else {
        debugLog('No PTO days were added');
    }
}


function removePTODay(event) {
    const dateStr = formatDate(event.start);
    debugLog('Removing PTO day', dateStr);

    if (userData.selectedDates[currentYear]) {
        userData.selectedDates[currentYear] = userData.selectedDates[currentYear]
            .filter(date => date !== dateStr);
        userData.plannedPTO--;
        debugLog('PTO day removed', {
            removedDate: dateStr,
            remainingDates: userData.selectedDates[currentYear],
            newPlannedPTO: userData.plannedPTO
        });
    }
    
    refreshCalendar();
    updateSummary();
    saveUserData();
    showSuccess('PTO day removed');
}


function handleModalClose() {
    debugLog('Closing modal');
    const setupModal = document.getElementById('setupModal');
    if (setupModal) {
        setupModal.style.display = 'none';
        if (!calendar) {
            const welcomeScreen = document.getElementById('welcomeScreen');
            if (welcomeScreen) {
                welcomeScreen.classList.remove('hidden');
            }
            const appContainer = document.getElementById('appContainer');
            if (appContainer) {
                appContainer.classList.add('hidden');
            }
        }
    }
}

// Setup Wizard Functions
function initializeSetupWizard() {
    debugLog('Initializing setup wizard');
    const setupModal = document.getElementById('setupModal');
    
    if (!setupModal) {
        console.error('Setup modal not found');
        showError('Setup wizard could not be initialized');
        return;
    }

    try {
        currentStep = 1;
        setupModal.style.display = 'flex';
        
        showWizardStep(1);
        populateBankHolidays();
        populateMonthSelector();

        if (!hasSetup) {
            setupWizardEventListeners(setupModal);
            hasSetup = true;
        }

        debugLog('Setup wizard initialized successfully');
    } catch (error) {
        console.error('Setup wizard initialization error:', error);
        showError('Failed to initialize setup wizard');
    }
}


function setupWizardEventListeners(modal) {
    debugLog('Setting up wizard event listeners');
    const closeBtn = document.getElementById('closeSetup');
    const nextBtn = document.getElementById('nextStep');
    const prevBtn = document.getElementById('prevStep');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            debugLog('Close button clicked');
            handleModalClose();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', handleNextStep);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', handlePrevStep);
    }

    // Add escape key handler
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            handleModalClose();
        }
    });
}


function handleNextStep() {
    debugLog('Next step clicked, current step:', currentStep);
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
    debugLog('Previous step clicked, current step:', currentStep);
    if (currentStep > 1) {
        currentStep--;
        showWizardStep(currentStep);
    }
}


function showWizardStep(step) {
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
        nextBtn.textContent = step === totalSteps ? 'Finish' : 'Next';
    }
}


function validateStep1() {
    debugLog('Validating step 1');
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
    debugLog('Populating bank holidays for year:', currentYear);
    const container = document.querySelector('.bank-holiday-list');
    if (!container) {
        debugLog('Bank holiday container not found');
        return;
    }

    if (!BANK_HOLIDAYS[currentYear]) {
        debugLog('No bank holidays found for year:', currentYear);
        container.innerHTML = '<p>No bank holidays available for selected year.</p>';
        return;
    }

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
    debugLog('Bank holidays populated');
}


function populateMonthSelector() {
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
    debugLog('Month selector populated');
}


function saveWizardData() {
    debugLog('Saving wizard data');
    const totalPTOInput = document.getElementById('totalPTOInput');
    const plannedPTOInput = document.getElementById('plannedPTOInput');

    if (totalPTOInput && plannedPTOInput) {
        try {
            userData.totalPTO = parseInt(totalPTOInput.value);
            userData.plannedPTO = parseInt(plannedPTOInput.value);

            userData.preferences.schoolHolidays = Array.from(
                document.querySelectorAll('input[name="schoolHolidays"]:checked')
            ).map(input => input.value);

            userData.preferences.preferredMonths = Array.from(
                document.querySelectorAll('input[name="preferredMonth"]:checked')
            ).map(input => input.value);

            userData.preferences.extendBankHolidays = Array.from(
                document.querySelectorAll('.holiday-item input[type="checkbox"]:checked')
            ).map(input => ({
                date: input.dataset.date,
                extensionType: input.closest('.holiday-item').querySelector('.extension-type').value
            }));

            saveUserData();
            
            const setupModal = document.getElementById('setupModal');
            if (setupModal) {
                setupModal.style.display = 'none';
            }
            
            if (!calendar) {
                initializeApp();
            } else {
                refreshCalendar();
            }

            showSuccess('PTO setup completed successfully');
            debugLog('Wizard data saved successfully', userData);
        } catch (error) {
            console.error('Error saving wizard data:', error);
            showError('Failed to save setup data');
        }
    }
}

// Main Application Initialization
function initializeApp() {
    debugLog('Initializing main application');
    showLoading();
    
    try {
        initializeCalendar();
        setupMainEventListeners();
        updateSummary();
        debugLog('Main application initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    } finally {
        hideLoading();
    }
}


function setupMainEventListeners() {
    debugLog('Setting up main event listeners');
    try {
        // Main UI buttons
        const setupPTOBtn = document.getElementById('setupPTOBtn');
        const exportBtn = document.getElementById('exportBtn');
        const yearSelect = document.getElementById('yearSelect');
        const settingsBtn = document.getElementById('settingsBtn');

        if (setupPTOBtn) {
            setupPTOBtn.addEventListener('click', initializeSetupWizard);
            debugLog('Setup PTO button listener added');
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', exportCalendar);
            debugLog('Export button listener added');
        }

        if (yearSelect) {
            yearSelect.addEventListener('change', handleYearChange);
            debugLog('Year select listener added');
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                debugLog('Settings button clicked');
                initializeSetupWizard();
            });
        }

        // Window event listeners
        window.addEventListener('focus', () => {
            if (calendar) {
                refreshCalendar();
                debugLog('Calendar refreshed on window focus');
            }
        });

        debugLog('All main event listeners setup complete');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
        showError('Failed to setup application controls');
    }
}


// Document Ready Handler
document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOM Content Loaded - Starting initialization');
    
    try {
        // Clear any existing data
        localStorage.clear();
        
        // Add calendar styles first
        addCalendarStyles();
        
        // Get main UI elements
        const welcomeScreen = document.getElementById('welcomeScreen');
        const appContainer = document.getElementById('appContainer');
        const getStartedBtn = document.getElementById('getStartedBtn');
        
        debugLog('Main UI elements found:', {
            welcomeScreen: !!welcomeScreen,
            appContainer: !!appContainer,
            getStartedBtn: !!getStartedBtn
        });

        if (!welcomeScreen || !appContainer || !getStartedBtn) {
            throw new Error('Required UI elements not found');
        }

        // Setup initial state
        welcomeScreen.classList.remove('hidden');
        appContainer.classList.add('hidden');

        // Set up get started button
        getStartedBtn.addEventListener('click', function() {
            debugLog('Get Started button clicked');
            try {
                welcomeScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                setTimeout(() => {
                    initializeSetupWizard();
                }, CONFIG.ANIMATION_DELAY);
            } catch (error) {
                console.error('Error in Get Started handler:', error);
                showError('Failed to start application setup');
            }
        });

        // Set up year selector
        const yearSelect = document.getElementById('yearSelect');
        if (yearSelect) {
            const years = [2024, 2025, 2026, 2027, 2028];
            yearSelect.innerHTML = years.map(year => 
                `<option value="${year}">${year}</option>`
            ).join('');
        }

        debugLog('Initial application setup complete');
    } catch (error) {
        console.error('Critical initialization error:', error);
        showError('Failed to showError('Failed to initialize application. Please refresh the page.');
    }
});


// Export Functionality
function exportCalendar() {
    debugLog('Exporting calendar');
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
        showSuccess('Calendar exported successfully');
    } catch (error) {
        console.error('Export error:', error);
        showError('Failed to export calendar');
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


// Utility Functions for Development
if (DEBUG) {
    window.debugApp = {
        getCurrentState: function() {
            return {
                userData,
                currentYear,
                currentStep,
                hasSetup,
                calendarInitialized: !!calendar
            };
        },
        clearData: function() {
            localStorage.clear();
            location.reload();
        },
        reloadCalendar: function() {
            if (calendar) {
                refreshCalendar();
                return 'Calendar refreshed';
            }
            return 'Calendar not initialized';
        }
    };

    console.log('Debug utilities available. Use window.debugApp to access debug functions.');
}
