// Global Constants
const CONFIG = {
    COLORS: {
        ANNUAL_LEAVE: '#10b981',    // Green
        BANK_HOLIDAY: '#f59e0b',    // Orange
        WEEKEND: '#e5e7eb'          // Light Gray
    },
    DEFAULT_LEAVE: 25,
    CALENDAR_SETTINGS: {
        DEFAULT_VIEW: 'dayGridMonth',
        FIRST_DAY: 1 // Monday
    }
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

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Load saved dates first
    loadSavedDates();
    
    // Initialize calendar
    initializeCalendar();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update summary display
    updateSummary();
});

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: CONFIG.CALENDAR_SETTINGS.DEFAULT_VIEW,
        firstDay: CONFIG.CALENDAR_SETTINGS.FIRST_DAY,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        selectable: true,
        select: handleDateSelection,
        eventClick: handleEventClick,
        events: getBankHolidayEvents(),
        weekends: true,
        height: 'auto',
        eventDidMount: function(info) {
            // Add tooltips to events
            if (info.event.title) {
                info.el.setAttribute('title', info.event.title);
            }
        }
    });

    calendar.render();

    // Add any saved leave days
    selectedDates.forEach(date => {
        calendar.addEvent({
            title: 'Annual Leave',
            start: date,
            backgroundColor: CONFIG.COLORS.ANNUAL_LEAVE,
            borderColor: CONFIG.COLORS.ANNUAL_LEAVE
        });
    });
}

function setupEventListeners() {
    // Settings Modal
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const cancelSettings = document.getElementById('cancelSettings');
    
    settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
    closeSettings.addEventListener('click', () => settingsModal.style.display = 'none');
    cancelSettings.addEventListener('click', () => settingsModal.style.display = 'none');

    // Settings Form
    document.getElementById('settingsForm').addEventListener('submit', handleSettingsSubmit);

    // Export Button
    document.getElementById('exportBtn').addEventListener('click', exportCalendar);

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
}

function handleDateSelection(selectInfo) {
    const startDate = selectInfo.start;
    const endDate = selectInfo.end;

    // Check for weekends
    if (isWeekend(startDate) || isWeekend(endDate)) {
        Swal.fire({
            title: 'Invalid Selection',
            text: 'Weekends cannot be selected as leave days.',
            icon: 'error'
        });
        return;
    }

    // Check for bank holidays
    if (isBankHoliday(startDate) || isBankHoliday(endDate)) {
        Swal.fire({
            title: 'Invalid Selection',
            text: 'Bank holidays cannot be selected as leave days.',
            icon: 'error'
        });
        return;
    }

    // Calculate working days
    const workingDays = calculateWorkingDays(startDate, endDate);
    
    // Check remaining leave
    if (selectedDates.length + workingDays > CONFIG.DEFAULT_LEAVE) {
        Swal.fire({
            title: 'Insufficient Leave',
            text: `You only have ${CONFIG.DEFAULT_LEAVE - selectedDates.length} days remaining.`,
            icon: 'warning'
        });
        return;
    }

    // Add leave days
    let currentDate = new Date(startDate);
    while (currentDate < endDate) {
        if (!isWeekend(currentDate) && !isBankHoliday(currentDate)) {
            const dateStr = formatDate(currentDate);
            selectedDates.push(dateStr);
            
            calendar.addEvent({
                title: 'Annual Leave',
                start: dateStr,
                backgroundColor: CONFIG.COLORS.ANNUAL_LEAVE,
                borderColor: CONFIG.COLORS.ANNUAL_LEAVE
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    saveDates();
    updateSummary();
}

function handleEventClick(info) {
    if (info.event.title === 'Annual Leave') {
        Swal.fire({
            title: 'Remove Leave Day?',
            text: 'Do you want to remove this leave day?',
            icon: 'question',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                const dateStr = formatDate(info.event.start);
                selectedDates = selectedDates.filter(date => date !== dateStr);
                info.event.remove();
                saveDates();
                updateSummary();
            }
        });
    }
}

function handleSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    const newSettings = {
        annualLeave: parseInt(form.annualLeave.value),
        weekStart: parseInt(form.weekStart.value),
        defaultView: form.defaultView.value
    };

    // Update calendar settings
    calendar.setOption('firstDay', newSettings.weekStart);
    calendar.setOption('initialView', newSettings.defaultView);
    
    // Save settings
    localStorage.setItem('calendarSettings', JSON.stringify(newSettings));
    
    // Close modal and show confirmation
    document.getElementById('settingsModal').style.display = 'none';
    Swal.fire({
        title: 'Settings Saved',
        icon: 'success',
        timer: 1500
    });
}

// Helper Functions
function isWeekend(date) {
    const day = new Date(date).getDay();
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

function getBankHolidayEvents() {
    return BANK_HOLIDAYS.map(holiday => ({
        title: holiday.title,
        start: holiday.date,
        display: 'background',
        backgroundColor: CONFIG.COLORS.BANK_HOLIDAY
    }));
}

function updateSummary() {
    document.getElementById('totalLeaveDays').textContent = CONFIG.DEFAULT_LEAVE;
    document.getElementById('usedDays').textContent = selectedDates.length;
    document.getElementById('remainingDays').textContent = CONFIG.DEFAULT_LEAVE - selectedDates.length;
    document.getElementById('bankHolidays').textContent = BANK_HOLIDAYS.length;
}

// Data Persistence
function saveDates() {
    localStorage.setItem('selectedDates', JSON.stringify(selectedDates));
}

function loadSavedDates() {
    const saved = localStorage.getItem('selectedDates');
    selectedDates = saved ? JSON.parse(saved) : [];
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
        Swal.fire({
            title: 'No Data',
            text: 'There are no leave days to export.',
            icon: 'info'
        });
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

    Swal.fire({
        title: 'Export Complete',
        text: 'Your calendar has been exported successfully.',
        icon: 'success',
        timer: 1500
    });
}
