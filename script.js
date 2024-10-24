// Global Constants
const CONFIG = {
    COLORS: {
        PTO: '#059669',
        BANK_HOLIDAY: '#f59e0b',
        WEEKEND: '#e5e7eb'
    },
    INITIAL_YEAR: 2024,
    MAX_PTO: 50,
    DEFAULT_PTO: 25
};

// Bank Holidays Data
const BANK_HOLIDAYS = [
    { date: '2024-01-01', title: "New Year's Day" },
    { date: '2024-03-29', title: "Good Friday" },
    { date: '2024-04-01', title: "Easter Monday" },
    { date: '2024-05-06', title: "Early May Bank Holiday" },
    { date: '2024-05-27', title: "Spring Bank Holiday" },
    { date: '2024-08-26', title: "Summer Bank Holiday" },
    { date: '2024-12-25', title: "Christmas Day" },
    { date: '2024-12-26', title: "Boxing Day" }
];
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

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Clear localStorage for testing (remove this in production)
    localStorage.clear(); // Add this line temporarily for testing
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    const appContainer = document.getElementById('appContainer');
    const getStartedBtn = document.getElementById('getStartedBtn');

    if (welcomeScreen && appContainer) {
        welcomeScreen.classList.remove('hidden');
        appContainer.classList.add('hidden');

        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', function() {
                console.log('Get Started clicked');
                welcomeScreen.classList.add('hidden');
                appContainer.classList.remove('hidden');
                initializeSetupWizard(); // Always show setup wizard first
            });
        }
    }
});

function initializeApp() {
    console.log('Initializing app'); // Debug
    showLoading();
    initializeCalendar();
    setupEventListeners();
    updateSummary();
    hideLoading();
}

function initializeCalendar() {
    console.log('Initializing calendar'); // Debug
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
        console.error('Calendar element not found');
        return;
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1, // Monday start
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
}

function initializeSetupWizard() {
    console.log('Initializing setup wizard'); // Debug
    try {
        const setupModal = document.getElementById('setupModal');
        if (!setupModal) {
            console.error('Setup modal not found');
            return;
        }

        currentStep = 1;
        setupModal.style.display = 'flex';

        // Initialize form values
        const totalPTOInput = document.getElementById('totalPTOInput');
        const plannedPTOInput = document.getElementById('plannedPTOInput');
        
        if (totalPTOInput) totalPTOInput.value = userData.totalPTO || CONFIG.DEFAULT_PTO;
        if (plannedPTOInput) plannedPTOInput.value = userData.plannedPTO || 0;

        // Show first step
        showWizardStep(currentStep);
        
        // Initialize content
        populateBankHolidays();
        populateMonthSelector();

        // Setup event listeners
        setupWizardEventListeners(setupModal);

    } catch (error) {
        console.error('Error initializing setup wizard:', error);
        showError('Failed to initialize setup wizard. Please refresh the page.');
    }
}
function setupWizardEventListeners(modal) {
    const closeBtn = document.getElementById('closeSetup');
    const nextBtn = document.getElementById('nextStep');
    const prevBtn = document.getElementById('prevStep');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            console.log('Close button clicked'); // Debug
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

function showWizardStep(step) {
    console.log('Showing wizard step:', step); // Debug
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

    const holidaysList = BANK_HOLIDAYS.map(holiday => `
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

function populateMonthSelector() {
    const container = document.querySelector('.month-selector');
    if (!container) return;

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    container.innerHTML = months.map((month, index) => `
        <label class="month-item">
            <input type="checkbox" name="preferredMonth" value="${index + 1}">
            <span>${month}</span>
        </label>
    `).join('');
}

function setupEventListeners() {
    console.log('Setting up event listeners'); // Debug
    const setupPTOBtn = document.getElementById('setupPTOBtn');
    const exportBtn = document.getElementById('exportBtn');
    const yearSelect = document.getElementById('yearSelect');

    if (setupPTOBtn) setupPTOBtn.addEventListener('click', initializeSetupWizard);
    if (exportBtn) exportBtn.addEventListener('click', exportCalendar);
    if (yearSelect) yearSelect.addEventListener('change', handleYearChange);
}

function handleDateSelection(selectInfo) {
    console.log('Date selection:', selectInfo); // Debug
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

function handleNextStep() {
    console.log('Next step clicked, current step:', currentStep); // Debug
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

function validateStep1() {
    const totalPTOInput = document.getElementById('totalPTOInput');
    const plannedPTOInput = document.getElementById('plannedPTOInput');
    
    if (!totalPTOInput || !plannedPTOInput) {
        console.error('PTO input elements not found'); // Debug
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

function saveWizardData() {
    console.log('Saving wizard data'); // Debug
    const totalPTOInput = document.getElementById('totalPTOInput');
    const plannedPTOInput = document.getElementById('plannedPTOInput');

    if (totalPTOInput && plannedPTOInput) {
        userData.totalPTO = parseInt(totalPTOInput.value);
        userData.plannedPTO = parseInt(plannedPTOInput.value);

        // Save preferences
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

function generateEvents() {
    let events = [];
    
    // Add bank holidays
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

    // Add PTO days
    if (userData.selectedDates[currentYear]) {
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

// Helper Functions
function isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
}

function isBankHoliday(date) {
    const dateStr = formatDate(date);
    return BANK_HOLIDAYS[currentYear]?.some(holiday => holiday.date === dateStr);
}

function formatDate(date) {
    return new Date(date).toISOString().split('T')[0];
}

function formatDisplayDate(date) {
    return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
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

function updateSummary() {
    document.getElementById('totalPTO').textContent = userData.totalPTO;
    document.getElementById('plannedPTO').textContent = userData.plannedPTO;
    document.getElementById('remainingPTO').textContent = userData.totalPTO - userData.plannedPTO;
    document.getElementById('bankHolidays').textContent = BANK_HOLIDAYS[currentYear].length;
}

function showLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.classList.remove('hidden');
}

function hideLoading() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.classList.add('hidden');
}

function showError(message) {
    console.error(message); // Debug
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

function saveUserData() {
    localStorage.setItem('ptoData', JSON.stringify(userData));
}

function loadUserData() {
    const saved = localStorage.getItem('ptoData');
    return saved ? JSON.parse(saved) : null;
}

function handleYearChange(e) {
    currentYear = parseInt(e.target.value);
    calendar.refetchEvents();
    updateSummary();
}

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
