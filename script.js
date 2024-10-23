document.addEventListener('DOMContentLoaded', function() {
    // Element references
    const ptoForm = document.getElementById('ptoForm');
    const submitFormBtn = document.getElementById('submitFormBtn');
    const calendarContainer = document.getElementById('calendarContainer');
    const calendarEl = document.getElementById('calendar');
    const leaveSummary = document.getElementById('leaveSummary');
    const leaveSummaryContent = document.getElementById('leaveSummaryContent');
    const downloadPDFBtn = document.getElementById('downloadPDFBtn');
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');

    let calendar = null; // Global calendar reference

    // Initialize calendar on page load
    initializeCalendar();

    // Form submission handler
    submitFormBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Validate form inputs
        const totalLeave = parseInt(document.getElementById('totalLeave').value);
        const leaveThisYear = parseInt(document.getElementById('leaveThisYear').value);
        
        if (!totalLeave || !leaveThisYear) {
            alert('Please enter valid numbers for leave days');
            return;
        }

        if (leaveThisYear > totalLeave) {
            alert('Requested leave days cannot exceed total available days');
            return;
        }

        const remainingLeave = totalLeave - leaveThisYear;

        // Update leave summary
        updateLeaveSummary(totalLeave, leaveThisYear, remainingLeave);
        
        // Update calendar events
        updateCalendarEvents();
    });

    function initializeCalendar() {
        if (!calendarEl) {
            console.error('Calendar element not found');
            return;
        }

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            plugins: ['dayGrid', 'interaction'],
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth'
            },
            selectable: true,
            selectMirror: true,
            weekends: true,
            height: 'auto',
            displayEventTime: false,
            dayCellDidMount: function(info) {
                // Mark weekends
                const day = info.date.getDay();
                if (day === 0 || day === 6) {
                    info.el.style.backgroundColor = '#f8d7da';
                }
            },
            select: function(info) {
                handleDateSelection(info);
            },
            eventClick: function(info) {
                handleEventClick(info);
            }
        });

        calendar.render();
    }

    function handleDateSelection(info) {
        const title = prompt('Enter event title (e.g., "PTO Day", "Bank Holiday"):');
        if (title) {
            calendar.addEvent({
                title: title,
                start: info.start,
                end: info.end,
                allDay: true,
                backgroundColor: title.toLowerCase().includes('pto') ? '#28a745' : '#ffc107',
                borderColor: title.toLowerCase().includes('pto') ? '#28a745' : '#ffc107'
            });
        }
        calendar.unselect();
    }

    function handleEventClick(info) {
        if (confirm(`Delete "${info.event.title}"?`)) {
            info.event.remove();
            updateLeaveSummary();
        }
    }

    function updateCalendarEvents() {
        // Clear existing events
        calendar.removeAllEvents();

        const currentYear = document.getElementById('selectYear').value;
        const leaveThisYear = parseInt(document.getElementById('leaveThisYear').value) || 0;
        const preferredMonths = document.getElementById('preferredMonths').value
            .split(',')
            .map(m => m.trim())
            .filter(m => m);

        const customHolidays = document.getElementById('customHolidays').value
            .split(',')
            .map(h => h.trim())
            .filter(h => h);

        // Add PTO days
        if (preferredMonths.length && leaveThisYear > 0) {
            const daysPerMonth = Math.ceil(leaveThisYear / preferredMonths.length);
            
            preferredMonths.forEach(month => {
                try {
                    const monthIndex = new Date(`${month} 1, ${currentYear}`).getMonth();
                    for (let i = 1; i <= daysPerMonth; i++) {
                        // Skip weekends
                        const date = new Date(currentYear, monthIndex, i);
                        if (date.getDay() !== 0 && date.getDay() !== 6) {
                            calendar.addEvent({
                                title: 'PTO Day',
                                start: date,
                                allDay: true,
                                backgroundColor: '#28a745',
                                borderColor: '#28a745'
                            });
                        }
                    }
                } catch (e) {
                    console.error(`Error processing month: ${month}`, e);
                }
            });
        }

        // Add custom holidays
        customHolidays.forEach(holiday => {
            try {
                if (isValidDate(holiday)) {
                    calendar.addEvent({
                        title: 'Bank Holiday',
                        start: holiday,
                        allDay: true,
                        backgroundColor: '#ffc107',
                        borderColor: '#ffc107'
                    });
                }
            } catch (e) {
                console.error(`Error processing holiday: ${holiday}`, e);
            }
        });

        calendar.render();
    }

    function updateLeaveSummary(totalLeave, leaveThisYear, remainingLeave) {
        const events = calendar.getEvents();
        const scheduledLeave = events.filter(event => 
            event.title.toLowerCase().includes('pto')).length;

        leaveSummary.style.display = 'block';
        leaveSummaryContent.innerHTML = `
            <p>Total Leave Days Available: ${totalLeave}</p>
            <p>Leave Days Requested: ${leaveThisYear}</p>
            <p>Leave Days Scheduled: ${scheduledLeave}</p>
            <p>Remaining Leave Days: ${remainingLeave}</p>
        `;
    }

    function isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // Download handlers
    downloadPDFBtn.addEventListener('click', function() {
        const element = document.getElementById('leaveSummaryContent');
        const opt = {
            margin: 1,
            filename: 'leave_summary.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });

    downloadExcelBtn.addEventListener('click', function() {
        const events = calendar.getEvents();
        const ptoCount = events.filter(event => 
            event.title.toLowerCase().includes('pto')).length;
        
        const summaryData = [
            ['Leave Summary'],
            ['Total Leave Days Available', document.getElementById('totalLeave').value],
            ['Leave Days Requested', document.getElementById('leaveThisYear').value],
            ['Leave Days Scheduled', ptoCount],
            ['Remaining Leave Days', parseInt(document.getElementById('totalLeave').value) - ptoCount],
            [],
            ['Scheduled Events'],
            ['Date', 'Event Type']
        ];

        // Add all events to the CSV
        events.forEach(event => {
            summaryData.push([
                event.start.toISOString().split('T')[0],
                event.title
            ]);
        });

        const csvContent = "data:text/csv;charset=utf-8," + 
            summaryData.map(row => row.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "leave_summary.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
