document.addEventListener('DOMContentLoaded', function() {
    // First, get all necessary DOM elements
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('Calendar element not found. Check if the element with ID "calendar" exists.');
        return;
    }

    const ptoForm = document.getElementById('ptoForm');
    const submitFormBtn = document.getElementById('submitFormBtn');
    const calendarContainer = document.getElementById('calendarContainer');
    const leaveSummary = document.getElementById('leaveSummary');
    const leaveSummaryContent = document.getElementById('leaveSummaryContent');
    const downloadPDFBtn = document.getElementById('downloadPDFBtn');
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    const monthViewBtn = document.getElementById('monthViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const todayBtn = document.getElementById('todayBtn');

    // Global calendar reference
    let calendar = null;

    // UK Bank Holidays
    const ukBankHolidays = {
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

    // Initialize calendar
    function initializeCalendar() {
        try {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,listMonth'
                },
                views: {
                    listMonth: {
                        buttonText: 'List View'
                    }
                },
                selectable: true,
                selectMirror: true,
                weekends: true,
                height: 'auto',
                firstDay: 1, // Monday start (UK)
                displayEventTime: false,
                select: handleDateSelection,
                eventClick: handleEventClick,
                dayCellDidMount: function(info) {
                    styleDayCell(info);
                },
                datesSet: function(info) {
                    updateCalendarWithHolidays();
                }
            });

            calendar.render();
            console.log('Calendar initialized successfully');
            
            // Initialize calendar with current year's holidays
            updateCalendarWithHolidays();
        } catch (error) {
            console.error('Error initializing calendar:', error);
            showError('Failed to initialize calendar');
        }
    }

    // Style individual day cells
    function styleDayCell(info) {
        const date = info.date;
        const cell = info.el;

        // Mark weekends
        if (isWeekend(date)) {
            cell.style.backgroundColor = '#f8d7da';
            cell.style.cursor = 'not-allowed';
        }

        // Mark bank holidays
        if (isBankHoliday(date)) {
            cell.style.backgroundColor = '#fff3cd';
            cell.style.cursor = 'not-allowed';
        }
    }

    // Handle date selection
    function handleDateSelection(info) {
        if (isWeekend(info.start) || isBankHoliday(info.start)) {
            calendar.unselect();
            showError('Cannot select weekends or bank holidays');
            return;
        }

        const leaveType = prompt('Enter leave type (1: Annual Leave, 2: Special Leave, 3: Training)');
        if (!leaveType) {
            calendar.unselect();
            return;
        }

        addLeaveEvent(info.start, info.end, getLeaveTypeConfig(leaveType));
    }

    // Handle event click
    function handleEventClick(info) {
        if (info.event.title.includes('Bank Holiday')) {
            showError('Cannot modify bank holidays');
            return;
        }

        if (confirm(`Delete "${info.event.title}"?`)) {
            info.event.remove();
            updateLeaveSummary();
        }
    }

    // Update calendar with bank holidays
    function updateCalendarWithHolidays() {
        const year = document.getElementById('selectYear').value;
        const holidays = ukBankHolidays[year] || [];

        // Remove existing bank holidays
        calendar.getEvents().forEach(event => {
            if (event.title.includes('Bank Holiday')) {
                event.remove();
            }
        });

        // Add bank holidays
        holidays.forEach(holiday => {
            calendar.addEvent({
                title: holiday.title,
                start: holiday.date,
                allDay: true,
                backgroundColor: '#ffc107',
                borderColor: '#ffc107',
                classNames: ['bank-holiday'],
                editable: false
            });
        });
    }

    // Utility functions
    function isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    function isBankHoliday(date) {
        const dateString = date.toISOString().split('T')[0];
        const year = date.getFullYear().toString();
        const holidays = ukBankHolidays[year] || [];
        return holidays.some(holiday => holiday.date === dateString);
    }

    function getLeaveTypeConfig(type) {
        const types = {
            '1': { title: 'Annual Leave', color: '#28a745' },
            '2': { title: 'Special Leave', color: '#17a2b8' },
            '3': { title: 'Training', color: '#6f42c1' }
        };
        return types[type] || types['1'];
    }

    function addLeaveEvent(start, end, config) {
        calendar.addEvent({
            title: config.title,
            start: start,
            end: end,
            allDay: true,
            backgroundColor: config.color,
            borderColor: config.color
        });
        updateLeaveSummary();
    }

    function updateLeaveSummary() {
        const events = calendar.getEvents();
        const annualLeave = events.filter(e => e.title === 'Annual Leave').length;
        
        if (leaveSummary && leaveSummaryContent) {
            leaveSummary.style.display = 'block';
            leaveSummaryContent.innerHTML = `
                <p>Annual Leave Days Taken: ${annualLeave}</p>
                <p>Remaining Leave: ${document.getElementById('totalLeave').value - annualLeave}</p>
            `;
        }
    }

    function showError(message) {
        alert(message); // Simple error display, can be enhanced with toast notification
    }

    // Event Listeners
    if (submitFormBtn) {
        submitFormBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Process form submission
            const totalLeave = parseInt(document.getElementById('totalLeave').value);
            const leaveThisYear = parseInt(document.getElementById('leaveThisYear').value);
            
            if (!totalLeave || !leaveThisYear) {
                showError('Please enter valid numbers for leave days');
                return;
            }

            if (leaveThisYear > totalLeave) {
                showError('Requested leave days cannot exceed total available days');
                return;
            }

            updateLeaveSummary();
        });
    }

    // View toggle buttons
    if (monthViewBtn) {
        monthViewBtn.addEventListener('click', () => calendar.changeView('dayGridMonth'));
    }
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => calendar.changeView('listMonth'));
    }
    if (todayBtn) {
        todayBtn.addEventListener('click', () => calendar.today());
    }

    // Initialize the calendar
    initializeCalendar();
});
