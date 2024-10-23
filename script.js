// Global Constants
const CONFIG = {
    COLORS: {
        PTO: '#059669',
        BANK_HOLIDAY: '#f59e0b',
        WEEKEND: '#e5e7eb'
    },
    INITIAL_YEAR: 2024,
    MAX_PTO: 50
};

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
let calendar;
let currentYear = CONFIG.INITIAL_YEAR;
let currentStep = 1;
const totalSteps = 3;
let userData = {
    totalPTO: 0,
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
    if (!localStorage.getItem('ptoData')) {
        showWelcomeScreen();
    } else {
        loadUserData();
        initializeApp();
    }
});

function showWelcomeScreen() {
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('getStartedBtn').addEventListener('click', () => {
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        showSetupWizard();
    });
}

function initializeApp() {
    showLoading();
    initializeCalendar();
    setupEventListeners();
    updateSummary();
    hideLoading();
}

function initializeSetupWizard() {
    currentStep = 1;
    showWizardStep(currentStep);
    
    const wizard = document.getElementById('setupModal');
    wizard.style.display = 'flex';
    
    // Set up event listeners
    document.getElementById('nextStep').addEventListener('click', handleNextStep);
    document.getElementById('prevStep').addEventListener('click', handlePrevStep);
    document.getElementById('closeSetup').addEventListener('click', () => {
        wizard.style.display = 'none';
    });

    // Populate forms with existing data if any
    if (userData.totalPTO) {
        document.getElementById('totalPTOInput').value = userData.totalPTO;
        document.getElementById('plannedPTOInput').value = userData.plannedPTO;
    }

    populateBankHolidays();
    populateMonthSelector();
}

function showWizardStep(step) {
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.style.display = 'none';
    });
    
    document.querySelector(`.wizard-step[data-step="${step}"]`).style.display = 'block';
    
    const prevBtn = document.getElementById('prevStep');
    const nextBtn = document.getElementById('nextStep');
    
    prevBtn.style.display = step === 1 ? 'none' : 'block';
    nextBtn.textContent = step === totalSteps ? 'Finish' : 'Next';
}

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
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
        dayCellDidMount: handleDayCellMount
    });

    calendar.render();
}

function handleDateSelection(selectInfo) {
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

function generateEvents() {
    let events = [];
    
    // Add bank holidays
    BANK_HOLIDAYS[currentYear].forEach(holiday => {
        events.push({
            title: holiday.title,
            start: holiday.date,
            className: 'bank-holiday',
            display: 'background',
            backgroundColor: CONFIG.COLORS.BANK_HOLIDAY
        });
    });

    // Add PTO days
    if (userData.selectedDates[currentYear]) {
        userData.selectedDates[currentYear].forEach(date => {
            events.push({
                title: 'PTO Day',
                start: date,
                className: 'pto-day',
                backgroundColor: CONFIG.COLORS.PTO
            });
        });
    }

    return events;
}

function handleDayCellMount(arg) {
    if (isWeekend(arg.date)) {
        arg.el.style.backgroundColor = CONFIG.COLORS.WEEKEND;
    }
}

function addPTODays(start, end) {
    const workingDays = calculateWorkingDays(start, end);
    
    if (userData.plannedPTO + workingDays > userData.totalPTO) {
        showError(`Not enough PTO days remaining. You have ${userData.totalPTO - userData.plannedPTO} days left.`);
        return;
    }

    let currentDate = new Date(start);
    while (currentDate < end) {
        if (!isWeekend(currentDate) && !isBankHoliday(currentDate)) {
            const dateStr = formatDate(currentDate);
            if (!userData.selectedDates[currentYear]) {
                userData.selectedDates[currentYear] = [];
            }
            userData.selectedDates[currentYear].push(dateStr);
            
            calendar.addEvent({
                title: 'PTO Day',
                start: dateStr,
                className: 'pto-day',
                backgroundColor: CONFIG.COLORS.PTO
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    userData.plannedPTO += workingDays;
    updateSummary();
    saveUserData();
    showSuccess('PTO days added successfully');
}

// Helper Functions
function isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
}

function isBankHoliday(date) {
    const dateStr = formatDate(date);
    const year = new Date(date).getFullYear();
    return BANK_HOLIDAYS[year]?.some(holiday => holiday.date === dateStr) || false;
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
    document.getElementById('remainingPTO').textContent = 
        userData.totalPTO - userData.plannedPTO;
    document.getElementById('bankHolidays').textContent = 
        BANK_HOLIDAYS[currentYear].length;
}

// Event Handlers
function handleNextStep() {
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
    const totalPTO = parseInt(document.getElementById('totalPTOInput').value);
    const plannedPTO = parseInt(document.getElementById('plannedPTOInput').value);
    
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

function handleEventClick(info) {
    if (info.event.classNames.includes('pto-day')) {
        Swal.fire({
            title: 'Remove PTO Day?',
            text: 'Do you want to remove this PTO day?',
            icon: 'question',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                removePTODay(info.event);
            }
        });
    }
}

function removePTODay(event) {
    const dateStr = formatDate(event.start);
    userData.selectedDates[currentYear] = userData.selectedDates[currentYear].filter(date => date !== dateStr);
    userData.plannedPTO--;
    event.remove();
    updateSummary();
    saveUserData();
    showSuccess('PTO day removed');
}

// UI Functions
function showLoading() {
    document.getElementById('loadingIndicator').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingIndicator').classList.add('hidden');
}

function showError(message) {
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

// Data Management
function saveUserData() {
    localStorage.setItem('ptoData', JSON.stringify(userData));
}

function loadUserData() {
    const saved = localStorage.getItem('ptoData');
    if (saved) {
        userData = JSON.parse(saved);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('setupPTOBtn').addEventListener('click', showSetupWizard);
    document.getElementById('exportBtn').addEventListener('click', exportCalendar);
    document.getElementById('yearSelect').addEventListener('change', handleYearChange);
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

function showSetupWizard() {
    initializeSetupWizard();
}
