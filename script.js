// Configuration & Constants
const CONFIG = {
    COLORS: {
        PTO: '#059669',
        BANK_HOLIDAY: '#f59e0b',
        WEEKEND: '#e5e7eb'
    },
    INITIAL_YEAR: 2024,
    MAX_PTO: 50
};

// Bank Holidays Data (Multi-Year)
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
        // Add 2026 bank holidays
    ],
    2027: [
        // Add 2027 bank holidays
    ]
};

// State Management
let calendar;
let currentYear = CONFIG.INITIAL_YEAR;
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
    // Check if first visit
    if (!localStorage.getItem('ptoData')) {
        showWelcomeScreen();
    } else {
        loadUserData();
        initializeApp();
    }
});

// Welcome & Setup Functions
function showWelcomeScreen() {
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('getStartedBtn').addEventListener('click', () => {
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        showSetupWizard();
    });
}

function showSetupWizard() {
    showLoading();
    const setupModal = document.getElementById('setupModal');
    setupModal.style.display = 'flex';
    initializeSetupWizard();
    hideLoading();
}

// Calendar Initialization
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        firstDay: 1, // Monday start
        selectable: true,
        select: handleDateSelection,
        eventDidMount: handleEventMount,
        events: generateEvents(),
        eventClick: handleEventClick,
        daysOfWeek: true,
        weekNumbers: true,
        businessHours: {
            dow: [1, 2, 3, 4, 5] // Monday - Friday
        }
    });

    calendar.render();
}

// Event Handlers
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
        text: `Add PTO from ${formatDate(startDate)} to ${formatDate(endDate)}?`,
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

function handleEventMount(info) {
    if (info.event.extendedProps.type === 'bankHoliday') {
        info.el.style.backgroundColor = CONFIG.COLORS.BANK_HOLIDAY;
        info.el.style.borderColor = CONFIG.COLORS.BANK_HOLIDAY;
    } else if (info.event.extendedProps.type === 'pto') {
        info.el.style.backgroundColor = CONFIG.COLORS.PTO;
        info.el.style.borderColor = CONFIG.COLORS.PTO;
    }
}

// PTO Management
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
                type: 'pto',
                backgroundColor: CONFIG.COLORS.PTO
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    userData.plannedPTO += workingDays;
    updateSummary();
    saveUserData();
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

// UI Updates
function updateSummary() {
    document.getElementById('totalPTO').textContent = userData.totalPTO;
    document.getElementById('plannedPTO').textContent = userData.plannedPTO;
    document.getElementById('remainingPTO').textContent = 
        userData.totalPTO - userData.plannedPTO;
    document.getElementById('bankHolidays').textContent = 
        BANK_HOLIDAYS[currentYear].length;
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

// Notifications
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

// Loading State
function showLoading() {
    document.getElementById('loadingIndicator').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingIndicator').classList.add('hidden');
}

// Export Functionality
function exportCalendar() {
    const events = calendar.getEvents()
        .filter(event => event.extendedProps.type === 'pto')
        .map(event => ({
            date: formatDate(event.start),
            type: 'PTO Day'
        }));

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

// Initialize everything
function initializeApp() {
    showLoading();
    initializeCalendar();
    setupEventListeners();
    updateSummary();
    hideLoading();
}

// Event Listeners Setup
function setupEventListeners() {
    document.getElementById('setupPTOBtn').addEventListener('click', showSetupWizard);
    document.getElementById('exportBtn').addEventListener('click', exportCalendar);
    document.getElementById('yearSelect').addEventListener('change', handleYearChange);
    
    // Settings Modal
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettings = document.getElementById('closeSettings');
    
    settingsBtn.addEventListener('click', () => {
        document.getElementById('setupModal').style.display = 'flex';
    });
    
    closeSettings.addEventListener('click', () => {
        document.getElementById('setupModal').style.display = 'none';
    });
}
