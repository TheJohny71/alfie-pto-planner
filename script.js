```javascript
// Application Configuration
const CONFIG = {
    ANNUAL_LEAVE: 25,
    COLORS: {
        LEAVE: '#4CAF50',
        BANK_HOLIDAY: '#FF9800',
        WEEKEND: '#E0E0E0'
    },
    CALENDAR: {
        FIRST_DAY: 1, // Monday
        DEFAULT_VIEW: 'dayGridMonth'
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
let selectedLeaves = [];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    setupEventListeners();
    loadSavedData();
});

// Calendar Initialization
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: CONFIG.CALENDAR.DEFAULT_VIEW,
        firstDay: CONFIG.CALENDAR.FIRST_DAY,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        selectable: true,
        select: handleDateSelection,
        events: getBankHolidayEvents(),
        eventClick: handleEventClick,
        height: 'auto',
        weekends: true,
        selectConstraint: {
            start: '00:00',
            end: '24:00'
        }
    });

    calendar.render();
    updateSummaryDisplay();
}

// Event Listeners Setup
function setupEventListeners() {
    // Settings Modal
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const settingsForm = document.getElementById('settingsForm');

    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    settingsForm.addEventListener('submit', handleSettingsSubmit);

    // Export Button
    document.getElementById('exportBtn').addEventListener('click', exportCalendar);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
}

// Date Selection Handler
function handleDateSelection(info) {
    const startDate = info.start;
    const endDate = info.end;
    
    if (isWeekend(startDate) || isWeekend(endDate)) {
        showNotification('Invalid Selection', 'Weekends cannot be selected as leave days.', 'error');
        return;
    }

    if (isBankHoliday(startDate) || isBankHoliday(endDate)) {
        showNotification('Invalid Selection', 'Bank holidays cannot be selected as leave days.', 'error');
        return;
    }

    const workingDays = calculateWorkingDays(startDate, endDate);
    
    if (selectedLeaves.length + workingDays > CONFIG.ANNUAL_LEAVE) {
        showNotification('Insufficient Leave', 
            `You only have ${CONFIG.ANNUAL_LEAVE - selectedLeaves.length} days remaining.`, 
            'warning');
        return;
    }

    addLeaveDays(startDate, endDate);
}

// Leave Management Functions
function addLeaveDays(start, end) {
    let currentDate = new Date(start);
    const endDate = new Date(end);
    
    while (currentDate < endDate) {
        if (!isWeekend(currentDate) && !isBankHoliday(currentDate)) {
            const dateStr = formatDate(currentDate);
            selectedLeaves.push(dateStr);
            
            calendar.addEvent({
                title: 'Leave Day',
                start: dateStr,
                backgroundColor: CONFIG.COLORS.LEAVE,
                borderColor: CONFIG.COLORS.LEAVE
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    updateSummaryDisplay();
    saveData();
}

function handleEventClick(info) {
    if (info.event.title === 'Leave Day') {
        Swal.fire({
            title: 'Remove Leave Day?',
            text: 'Do you want to remove this leave day?',
            icon: 'question',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                removeLeaveDayEvent(info.event);
            }
        });
    }
}

function removeLeaveDayEvent(event) {
    const dateStr = formatDate(event.start);
    selectedLeaves = selectedLeaves.filter(date => date !== dateStr);
    event.remove();
    updateSummaryDisplay();
    saveData();
}

// Helper Functions
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function isBankHoliday(date) {
    const dateStr = formatDate(date);
    return BANK_HOLIDAYS.some(holiday => holiday.date === dateStr);
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

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function getBankHolidayEvents() {
    return BANK_HOLIDAYS.map(holiday => ({
        title: holiday.title,
        start: holiday.date,
        backgroundColor: CONFIG.COLORS.BANK_HOLIDAY,
        borderColor: CONFIG.COLORS.BANK_HOLIDAY,
        display: 'background'
    }));
}

// UI Updates
function updateSummaryDisplay() {
    document.getElementById('totalLeaveDays').textContent = CONFIG.ANNUAL_LEAVE;
    document.getElementById('usedDays').textContent = selectedLeaves.length;
    document.getElementById('remainingDays').textContent = CONFIG.ANNUAL_LEAVE - selectedLeaves.length;
    document.getElementById('bankHolidays').textContent = BANK_HOLIDAYS.length;
}

function showNotification(title, text, icon) {
    Swal.fire({
        title,
        text,
        icon,
        confirmButtonColor: CONFIG.COLORS.LEAVE
    });
}

// Data Persistence
function saveData() {
    localStorage.setItem('selectedLeaves', JSON.stringify(selectedLeaves));
}

function loadSavedData() {
    const savedLeaves = localStorage.getItem('selectedLeaves');
    if (savedLeaves) {
        selectedLeaves = JSON.parse(savedLeaves);
        selectedLeaves.forEach(dateStr => {
            calendar.addEvent({
                title: 'Leave Day',
                start: dateStr,
                backgroundColor: CONFIG.COLORS.LEAVE,
                borderColor: CONFIG.COLORS.LEAVE
            });
        });
        updateSummaryDisplay();
    }
}

// Settings Handler
function handleSettingsSubmit(e) {
    e.preventDefault();
    const annualLeave = parseInt(document.getElementById('annualLeave').value);
    const weekStart = parseInt(document.getElementById('weekStart').value);
    const defaultView = document.getElementById('defaultView').value;

    CONFIG.ANNUAL_LEAVE = annualLeave;
    CONFIG.CALENDAR.FIRST_DAY = weekStart;
    CONFIG.CALENDAR.DEFAULT_VIEW = defaultView;

    calendar.setOption('firstDay', weekStart);
    calendar.setOption('initialView', defaultView);

    updateSummaryDisplay();
    document.getElementById('settingsModal').style.display = 'none';
    showNotification('Settings Updated', 'Your preferences have been saved.', 'success');
}

// Export Function
function exportCalendar() {
    const events = calendar.getEvents()
        .filter(event => event.title === 'Leave Day')
        .map(event => ({
            date: formatDate(event.start),
            type: 'Annual Leave'
        }));

    const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Type\n"
        + events.map(e => `${e.date},${e.type}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leave_calendar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
```

This JavaScript code provides:

1. Calendar functionality with:
   - Leave day selection/removal
   - Bank holiday display
   - Weekend handling
   - Date validation

2. State management:
   - Tracks selected leave days
   - Maintains settings
   - Persists data in localStorage

3. User interface features:
   - Settings modal
   - Leave summary updates
   - Notifications
   - Calendar export

4. Helper functions for:
   - Date formatting
   - Working day calculations
   - Event handling

Would you like me to explain any specific part of the code or make any adjustments?
