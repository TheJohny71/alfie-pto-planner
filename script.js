// Configuration
const CONFIG = {
    ANNUAL_LEAVE: 25,
    COLORS: {
        LEAVE: '#4CAF50',
        BANK_HOLIDAY: '#FF9800',
        WEEKEND: '#E0E0E0'
    }
};

// Bank Holidays 2024
const BANK_HOLIDAYS = [
    '2024-01-01', // New Year's Day
    '2024-03-29', // Good Friday
    '2024-04-01', // Easter Monday
    '2024-05-06', // Early May Bank Holiday
    '2024-05-27', // Spring Bank Holiday
    '2024-08-26', // Summer Bank Holiday
    '2024-12-25', // Christmas Day
    '2024-12-26'  // Boxing Day
];

let calendar;
let selectedDates = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar();
    setupEventListeners();
});

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
        events: BANK_HOLIDAYS.map(date => ({
            start: date,
            display: 'background',
            backgroundColor: CONFIG.COLORS.BANK_HOLIDAY
        })),
        weekends: true
    });

    calendar.render();
    updateSummary();
}

function setupEventListeners() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');

    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
}

function handleDateSelection(info) {
    const startDate = info.start;
    const endDate = info.end;
    
    // Basic validation
    if (isWeekend(startDate) || isWeekend(endDate)) {
        Swal.fire('Invalid Selection', 'Weekends cannot be selected as leave days.', 'error');
        return;
    }

    addLeaveDays(startDate, endDate);
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function addLeaveDays(start, end) {
    let currentDate = new Date(start);
    
    while (currentDate < end) {
        if (!isWeekend(currentDate)) {
            const dateStr = currentDate.toISOString().split('T')[0];
            selectedDates.push(dateStr);
            
            calendar.addEvent({
                title: 'Leave Day',
                start: dateStr,
                backgroundColor: CONFIG.COLORS.LEAVE,
                borderColor: CONFIG.COLORS.LEAVE
            });
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    updateSummary();
}

function updateSummary() {
    document.getElementById('totalLeaveDays').textContent = CONFIG.ANNUAL_LEAVE;
    document.getElementById('usedDays').textContent = selectedDates.length;
    document.getElementById('remainingDays').textContent = CONFIG.ANNUAL_LEAVE - selectedDates.length;
    document.getElementById('bankHolidays').textContent = BANK_HOLIDAYS.length;
}
