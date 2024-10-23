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
    loadUserData();
    if (!localStorage.getItem('ptoData')) {
        showWelcomeScreen();
    } else {
        initializeApp();
    }
});

// Welcome & Setup Functions
function showWelcomeScreen() {
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('getStartedBtn').addEventListener('click', () => {
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        showSetupWizard();
    });
}

function showSetupWizard() {
    initializeSetupWizard();
}

function initializeSetupWizard() {
    currentStep = 1;
    const setupModal = document.getElementById('setupModal');
    setupModal.style.display = 'flex';
    
    // Show first step
    showWizardStep(currentStep);
    
    // Setup form with existing data
    if (userData.totalPTO) {
        document.getElementById('totalPTOInput').value = userData.totalPTO;
        document.getElementById('plannedPTOInput').value = userData.plannedPTO;
    }

    populateBankHolidays();
    populateMonthSelector();

    // Event Listeners for wizard navigation
    document.getElementById('closeSetup').addEventListener('click', () => {
        setupModal.style.display = 'none';
    });
}

function showWizardStep(step) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show current step
    document.querySelector(`.wizard-step[data-step="${step}"]`).style.display = 'block';
    
    // Update buttons
    const prevBtn = document.getElementById('prevStep');
    const nextBtn = document.getElementById('nextStep');
    
    if (prevBtn && nextBtn) {
        prevBtn.style.display = step === 1 ? 'none' : 'block';
        nextBtn.textContent = step === totalSteps ? 'Finish' : 'Next';
    }
}

function populateBankHolidays() {
    const container = document.querySelector('.bank-holiday-list');
    if (!container) return;

    const holidaysList = BANK_HOLIDAYS[currentYear].map(holiday => `
        <div class="holiday-item">
            <div class="holiday-check">
                <input type="checkbox" id="holiday-${holiday.date}" data-date="${holiday.date}">
                <label for="holiday-${holiday.date}">${holiday.title} (${formatDisplayDate(holiday.date)})</label>
            </div>
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
// Calendar Functions
function initializeApp() {
    showLoading();
    initializeCalendar();
    setupEventListeners();
    updateSummary();
    hideLoading();
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
    const eventType = info.event.classNames[0];
    if (eventType === 'bank-holiday') {
        info.el.style.backgroundColor = CONFIG.COLORS.BANK_HOLIDAY;
    } else if (eventType === 'pto-day') {
        info.el.style.backgroundColor = CONFIG.COLORS.PTO;
    }
}

function handleDayCellMount(arg) {
    if (isWeekend(arg.date)) {
        arg.el.style.backgroundColor = CONFIG.COLORS.WEEKEND;
    }
}

function generateEvents() {
    let events = [];
    
    // Add bank holidays
    BANK_HOLIDAYS[currentYear].forEach(holiday => {
        events.push({
            title: holiday.title,
            start: holiday.date,
            classNames: ['bank-holiday'],
            display: 'background'
        });
    });

    // Add PTO days
    if (userData.selectedDates[currentYear]) {
        userData.selectedDates[currentYear].forEach(date => {
            events.push({
                title: 'PTO Day',
                start: date,
                classNames: ['pto-day']
            });
        });
    }

    return events;
}

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

function saveWizardData() {
    userData.totalPTO = parseInt(document.getElementById('totalPTOInput').value);
    userData.plannedPTO = parseInt(document.getElementById('plannedPTOInput').value);

    // Save school holidays preferences
    userData.preferences.schoolHolidays = Array.from(
        document.querySelectorAll('input[name="schoolHolidays"]:checked')
    ).map(input => input.value);

    // Save preferred months
    userData.preferences.preferredMonths = Array.from(
        document.querySelectorAll('input[name="preferredMonth"]:checked')
    ).map(input => parseInt(input.value));

    // Save bank holiday extensions
    userData.preferences.extendBankHolidays = Array.from(
        document.querySelectorAll('.holiday-item input[type="checkbox"]:checked')
    ).map(input => ({
        date: input.dataset.date,
        extensionType: input.closest('.holiday-item').querySelector('.extension-type').value
    }));

    // Save data and update UI
    saveUserData();
    document.getElementById('setupModal').style.display = 'none';
    
    if (!calendar) {
        initializeApp();
    } else {
        calendar.refetchEvents();
        updateSummary();
    }
    
    showSuccess('PTO setup completed successfully');
}

// Helper Functions
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
                
                calendar.addEvent({
                    title: 'PTO Day',
                    start: dateStr,
                    classNames: ['pto-day']
                });
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
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

// UI Updates
function updateSummary() {
    document.getElementById('totalPTO').textContent = userData.totalPTO;
    document.getElementById('plannedPTO').textContent = userData.plannedPTO;
    document.getElementById('remainingPTO').textContent = userData.totalPTO - userData.plannedPTO;
    document.getElementById('bankHolidays').textContent = BANK_HOLIDAYS[currentYear].length;
}

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

// Event Listeners
function setupEventListeners() {
    document.getElementById('setupPTOBtn').addEventListener('click', showSetupWizard);
    document.getElementById('exportBtn').addEventListener('click', exportCalendar);
    document.getElementById('yearSelect').addEventListener('change', handleYearChange);
    
    // Wizard navigation
    document.getElementById('nextStep').addEventListener('click', handleNextStep);
    document.getElementById('prevStep').addEventListener('click', handlePrevStep);
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
