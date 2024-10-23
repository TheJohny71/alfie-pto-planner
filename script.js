// Global Constants
const CONFIG = {
    LEAVE_TYPES: {
        ANNUAL: { color: '#10b981', title: 'Annual Leave' },
        BANK_HOLIDAY: { color: '#f59e0b', title: 'Bank Holiday' },
        WEEKEND: { color: '#e5e7eb', title: 'Weekend' }
    },
    DEFAULT_ANNUAL_LEAVE: 25
};

// Bank Holidays 2024
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

// State Management
let calendar;
let selectedDates = [];
let isLoading = false;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    showLoading();
    initializeApp();
});

async function initializeApp() {
    try {
        selectedDates = loadSelectedDates();
        await initializeCalendar();
        setupEventListeners();
        loadSettings();
        updateSummary();
        updateQuickStats();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize the application');
    } finally {
        hideLoading();
    }
}

// Loading State Management
function showLoading() {
    isLoading = true;
    document.getElementById('loadingIndicator').style.display = 'block';
}

function hideLoading() {
    isLoading = false;
    document.getElementById('loadingIndicator').style.display = 'none';
}

// Calendar Initialization
async function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        firstDay: 1,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        selectable: true,
        selectMirror: true,
        select: handleDateSelection,
        eventClick: handleEventClick,
        events: getBankHolidayEvents(),
        eventDidMount: handleEventMount,
        height: 'auto',
        buttonText: {
            today: 'Today',
            month: 'Month',
            week: 'Week'
        },
        // Enhanced calendar options
        weekNumbers: true,
        weekNumberFormat: { week: 'numeric' },
        dayMaxEvents: true,
        eventTimeFormat: {
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
        }
    });

    await calendar.render();
    
    // Add saved leave days
    if (selectedDates.length > 0) {
        selectedDates.forEach(date => {
            calendar.addEvent({
                title: 'Annual Leave',
                start: date,
                backgroundColor: CONFIG.LEAVE_TYPES.ANNUAL.color,
                borderColor: CONFIG.LEAVE_TYPES.ANNUAL.color
            });
        });
    }
}

// Event Listeners
function setupEventListeners() {
    // Settings Modal
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const cancelSettings = document.getElementById('cancelSettings');
    const settingsForm = document.getElementById('settingsForm');

    settingsBtn.addEventListener('click', () => toggleModal('settingsModal', true));
    closeSettings.addEventListener('click', () => toggleModal('settingsModal', false));
    cancelSettings.addEventListener('click', () => toggleModal('settingsModal', false));
    settingsForm.addEventListener('submit', handleSettingsSubmit);

    // Reports Modal
    const reportBtn = document.getElementById('reportBtn');
    const reportsModal = document.getElementById('reportsModal');
    const closeReports = document.getElementById('closeReports');

    reportBtn.addEventListener('click', () => toggleModal('reportsModal', true));
    closeReports.addEventListener('click', () => toggleModal('reportsModal', false));

    // Export Button
    document.getElementById('exportBtn').addEventListener('click', exportCalendar);

    // Report Options
    document.querySelectorAll('.report-options button').forEach(button => {
        button.addEventListener('click', () => generateReport(button.dataset.report));
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            toggleModal(e.target.id, false);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'flex') {
                    toggleModal(modal.id, false);
                }
            });
        }
    });
}

// Modal Management
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
    }
}

// Date Selection Handler
async function handleDateSelection(selectInfo) {
    try {
        showLoading();

        if (isInvalidSelection(selectInfo.start, selectInfo.end)) {
            showError('Invalid Selection', 'Weekends and bank holidays cannot be selected.');
            return;
        }

        const workingDays = calculateWorkingDays(selectInfo.start, selectInfo.end);
        
        if (!hasEnoughLeaveDays(workingDays)) {
            showWarning('Insufficient Leave', 
                `You only have ${CONFIG.DEFAULT_ANNUAL_LEAVE - selectedDates.length} days remaining.`);
            return;
        }

        await addLeaveDays(selectInfo.start, selectInfo.end);
        updateSummary();
        updateQuickStats();
        
    } catch (error) {
        console.error('Date selection error:', error);
        showError('Failed to add leave days');
    } finally {
        hideLoading();
    }
}

// Event Click Handler
async function handleEventClick(info) {
    if (info.event.title === 'Annual Leave') {
        const result = await Swal.fire({
            title: 'Remove Leave Day?',
            text: 'Do you want to remove this leave day?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, remove it'
        });

        if (result.isConfirmed) {
            await removeLeaveDayEvent(info.event);
            updateSummary();
            updateQuickStats();
        }
    }
}

// Helper Functions
function isInvalidSelection(start, end) {
    return isWeekend(start) || isWeekend(end) || 
           isBankHoliday(start) || isBankHoliday(end);
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function isBankHoliday(date) {
    const dateStr = formatDate(date);
    return BANK_HOLIDAYS.some(holiday => holiday.date === dateStr);
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

function hasEnoughLeaveDays(workingDays) {
    return selectedDates.length + workingDays <= CONFIG.DEFAULT_ANNUAL_LEAVE;
}

// Leave Management
async function addLeaveDays(start, end) {
    let current = new Date(start);
    
    while (current < end) {
        if (!isWeekend(current) && !isBankHoliday(current)) {
            const dateStr = formatDate(current);
            selectedDates.push(dateStr);
            
            calendar.addEvent({
                title: 'Annual Leave',
                start: dateStr,
                backgroundColor: CONFIG.LEAVE_TYPES.ANNUAL.color,
                borderColor: CONFIG.LEAVE_TYPES.ANNUAL.color
            });
        }
        current.setDate(current.getDate() + 1);
    }
    
    saveSelectedDates();
}

async function removeLeaveDayEvent(event) {
    const dateStr = formatDate(event.start);
    selectedDates = selectedDates.filter(date => date !== dateStr);
    event.remove();
    saveSelectedDates();
}

// State Management
function saveSelectedDates() {
    localStorage.setItem('selectedDates', JSON.stringify(selectedDates));
}

function loadSelectedDates() {
    const saved = localStorage.getItem('selectedDates');
    return saved ? JSON.parse(saved) : [];
}

// UI Updates
function updateSummary() {
    document.getElementById('totalLeaveDays').textContent = CONFIG.DEFAULT_ANNUAL_LEAVE;
    document.getElementById('usedDays').textContent = selectedDates.length;
    document.getElementById('remainingDays').textContent = CONFIG.DEFAULT_ANNUAL_LEAVE - selectedDates.length;
    document.getElementById('bankHolidays').textContent = BANK_HOLIDAYS.length;
}

function updateQuickStats() {
    // Calculate longest leave period
    let longestStreak = calculateLongestStreak();
    document.getElementById('longestLeave').textContent = `${longestStreak} days`;

    // Calculate average leave length
    let averageLength = selectedDates.length > 0 ? 
        (selectedDates.length / findLeavePeriods().length).toFixed(1) : 0;
    document.getElementById('averageLeave').textContent = `${averageLength} days`;
}

// Notifications
function showError(title, text = '') {
    Swal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: '#ef4444'
    });
}

function showWarning(title, text = '') {
    Swal.fire({
        title,
        text,
        icon: 'warning',
        confirmButtonColor: '#f59e0b'
    });
}

function showSuccess(title, text = '') {
    Swal.fire({
        title,
        text,
        icon: 'success',
        confirmButtonColor: '#10b981'
    });
}

// Export Functionality
function exportCalendar() {
    const events = calendar.getEvents()
        .filter(event => event.title === 'Annual Leave')
        .map(event => ({
            date: formatDate(event.start),
            type: 'Annual Leave'
        }));

    if (events.length === 0) {
        showWarning('No Data', 'There are no leave days to export.');
        return;
    }

    const csvContent = "data:text/csv;charset=utf-8,"
        + "Date,Type\n"
        + events.map(e => `${e.date},${e.type}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leave_calendar_${formatDate(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess('Export Complete', 'Your calendar has been exported successfully.');
}

// Report Generation
function generateReport(type) {
    switch (type) {
        case 'summary':
            generateSummaryReport();
            break;
        case 'calendar':
            generateCalendarReport();
            break;
        case 'detailed':
            generateDetailedReport();
            break;
    }
    toggleModal('reportsModal', false);
}

// Additional Helper Functions
function calculateLongestStreak() {
    if (selectedDates.length === 0) return 0;
    
    const sortedDates = [...selectedDates].sort();
    let currentStreak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i-1]);
        const currDate = new Date(sortedDates[i]);
        
        if ((currDate - prevDate) / (1000 * 60 * 60 * 24) === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }
    
    return maxStreak;
}

function findLeavePeriods() {
    if (selectedDates.length === 0) return [];
    
    const sortedDates = [...selectedDates].sort();
    const periods = [];
    let currentPeriod = [sortedDates[0]];
    
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i-1]);
        const currDate = new Date(sortedDates[i]);
        
        if ((currDate - prevDate) / (1000 * 60 * 60 * 24) === 1) {
            currentPeriod.push(sortedDates[i]);
        } else {
            periods.push([...currentPeriod]);
            currentPeriod = [sortedDates[i]];
        }
    }
    
    periods.push(currentPeriod);
    return periods;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeApp);
