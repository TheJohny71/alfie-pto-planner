document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        firstDay: 1, // Monday start
        selectable: true,
        selectMirror: true,
        select: handleDateSelection,
        eventClick: handleEventClick,
        events: getBankHolidays(),
        height: 'auto'
    });

    calendar.render();
    updateSummary();

    // Set up event listeners
    setupEventListeners();

    // Global variables
    let selectedDates = loadSelectedDates();

    // Load saved dates
    if (selectedDates.length > 0) {
        selectedDates.forEach(date => {
            calendar.addEvent({
                title: 'Leave Day',
                start: date,
                backgroundColor: '#4CAF50',
                borderColor: '#4CAF50'
            });
        });
        updateSummary();
    }

    // Event Handlers
    function handleDateSelection(selectInfo) {
        if (isWeekend(selectInfo.start) || isWeekend(selectInfo.end)) {
            Swal.fire({
                title: 'Invalid Selection',
                text: 'Weekends cannot be selected as leave days.',
                icon: 'error'
            });
            return;
        }

        if (isBankHoliday(selectInfo.start) || isBankHoliday(selectInfo.end)) {
            Swal.fire({
                title: 'Invalid Selection',
                text: 'Bank holidays cannot be selected as leave days.',
                icon: 'error'
            });
            return;
        }

        const workingDays = calculateWorkingDays(selectInfo.start, selectInfo.end);
        if (selectedDates.length + workingDays > 25) {
            Swal.fire({
                title: 'Leave Limit Exceeded',
                text: `You only have ${25 - selectedDates.length} days remaining.`,
                icon: 'warning'
            });
            return;
        }

        let currentDate = new Date(selectInfo.start);
        while (currentDate < selectInfo.end) {
            if (!isWeekend(currentDate) && !isBankHoliday(currentDate)) {
                const dateStr = formatDate(currentDate);
                selectedDates.push(dateStr);
                calendar.addEvent({
                    title: 'Leave Day',
                    start: dateStr,
                    backgroundColor: '#4CAF50',
                    borderColor: '#4CAF50'
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        saveSelectedDates(selectedDates);
        updateSummary();
    }

    function handleEventClick(clickInfo) {
        if (clickInfo.event.title === 'Leave Day') {
            Swal.fire({
                title: 'Remove Leave Day?',
                text: 'Do you want to remove this leave day?',
                icon: 'question',
                showCancelButton: true
            }).then((result) => {
                if (result.isConfirmed) {
                    const dateStr = formatDate(clickInfo.event.start);
                    selectedDates = selectedDates.filter(date => date !== dateStr);
                    clickInfo.event.remove();
                    saveSelectedDates(selectedDates);
                    updateSummary();
                }
            });
        }
    }

    // Helper Functions
    function isWeekend(date) {
        const day = new Date(date).getDay();
        return day === 0 || day === 6;
    }

    function isBankHoliday(date) {
        const bankHolidays = getBankHolidays().map(event => event.start);
        return bankHolidays.includes(formatDate(date));
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

    function getBankHolidays() {
        return [
            { title: "New Year's Day", start: '2024-01-01', display: 'background', backgroundColor: '#FF9800' },
            { title: "Good Friday", start: '2024-03-29', display: 'background', backgroundColor: '#FF9800' },
            { title: "Easter Monday", start: '2024-04-01', display: 'background', backgroundColor: '#FF9800' },
            { title: "Early May Bank Holiday", start: '2024-05-06', display: 'background', backgroundColor: '#FF9800' },
            { title: "Spring Bank Holiday", start: '2024-05-27', display: 'background', backgroundColor: '#FF9800' },
            { title: "Summer Bank Holiday", start: '2024-08-26', display: 'background', backgroundColor: '#FF9800' },
            { title: "Christmas Day", start: '2024-12-25', display: 'background', backgroundColor: '#FF9800' },
            { title: "Boxing Day", start: '2024-12-26', display: 'background', backgroundColor: '#FF9800' }
        ];
    }

    function updateSummary() {
        document.getElementById('totalLeaveDays').textContent = '25';
        document.getElementById('usedDays').textContent = selectedDates.length;
        document.getElementById('remainingDays').textContent = 25 - selectedDates.length;
        document.getElementById('bankHolidays').textContent = getBankHolidays().length;
    }

    function setupEventListeners() {
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        const exportBtn = document.getElementById('exportBtn');

        settingsBtn.addEventListener('click', () => {
            settingsModal.style.display = 'flex';
        });

        closeSettings.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });

        exportBtn.addEventListener('click', exportCalendar);
    }

    function saveSelectedDates(dates) {
        localStorage.setItem('selectedDates', JSON.stringify(dates));
    }

    function loadSelectedDates() {
        const saved = localStorage.getItem('selectedDates');
        return saved ? JSON.parse(saved) : [];
    }

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
});
