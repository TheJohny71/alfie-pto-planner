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

    // Global calendar reference
    let calendar = null;

    // Initialize calendar on page load
    initializeCalendar();

    // Calendar initialization function
    function initializeCalendar() {
        if (!calendarEl) {
            showError('Calendar element not found. Please check the page structure.');
            return;
        }

        try {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
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
                selectConstraint: {
                    start: '00:00',
                    end: '24:00'
                },
                dateClick: handleDateClick,
                select: handleDateSelection,
                eventClick: handleEventClick,
                dayCellDidMount: function(info) {
                    // Mark weekends
                    const day = info.date.getDay();
                    if (day === 0 || day === 6) {
                        info.el.style.backgroundColor = '#f8d7da';
                    }
                }
            });

            calendar.render();
            console.log('Calendar initialized successfully');
        } catch (error) {
            console.error('Error initializing calendar:', error);
            showError('Failed to initialize calendar. Please refresh the page.');
        }
    }

    // Handle single date clicks
    function handleDateClick(info) {
        const isWeekend = isWeekendDay(info.date);
        if (isWeekend) {
            showError('Cannot select weekend days for PTO');
            return;
        }
        promptForEventType(info.date);
    }

    // Handle date range selection
    function handleDateSelection(info) {
        const startDate = info.start;
        const endDate = info.end;
        
        // Prevent selecting weekends
        if (containsWeekend(startDate, endDate)) {
            showError('Please avoid selecting weekend days');
            calendar.unselect();
            return;
        }

        promptForEventType(startDate, endDate);
    }

    // Handle event clicks (for deletion)
    function handleEventClick(info) {
        if (confirm(`Do you want to delete "${info.event.title}"?`)) {
            info.event.remove();
            updateLeaveSummary();
        }
    }

    // Prompt user for event type
    function promptForEventType(start, end = null) {
        const eventType = prompt('Enter event type (1 for PTO Day, 2 for Bank Holiday):');
        if (!eventType) return;

        let eventConfig;
        switch (eventType.trim()) {
            case '1':
                eventConfig = {
                    title: 'PTO Day',
                    backgroundColor: '#28a745',
                    borderColor: '#28a745'
                };
                break;
            case '2':
                eventConfig = {
                    title: 'Bank Holiday',
                    backgroundColor: '#ffc107',
                    borderColor: '#ffc107'
                };
                break;
            default:
                showError('Invalid event type selected');
                return;
        }

        addCalendarEvent(start, end, eventConfig);
        updateLeaveSummary();
    }

    // Add event to calendar
    function addCalendarEvent(start, end, config) {
        calendar.addEvent({
            title: config.title,
            start: start,
            end: end,
            allDay: true,
            backgroundColor: config.backgroundColor,
            borderColor: config.borderColor
        });
    }

    // Form submission handler
    if (submitFormBtn) {
        submitFormBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showLoading();

            try {
                processFormSubmission();
            } catch (error) {
                console.error('Error processing form:', error);
                showError('Failed to process form. Please check your inputs.');
            } finally {
                hideLoading();
            }
        });
    }

    // Process form submission
    function processFormSubmission() {
        // Get and validate form inputs
        const totalLeave = parseInt(document.getElementById('totalLeave').value);
        const leaveThisYear = parseInt(document.getElementById('leaveThisYear').value);
        const preferredMonths = document.getElementById('preferredMonths').value;
        const customHolidays = document.getElementById('customHolidays').value;

        // Validate inputs
        if (!validateFormInputs(totalLeave, leaveThisYear, preferredMonths)) {
            return;
        }

        // Calculate remaining leave
        const remainingLeave = totalLeave - leaveThisYear;

        // Update UI
        updateLeaveSummary(totalLeave, leaveThisYear, remainingLeave);
        updateCalendarEvents(preferredMonths, customHolidays, leaveThisYear);
    }

    // Validate form inputs
    function validateFormInputs(totalLeave, leaveThisYear, preferredMonths) {
        if (!totalLeave || isNaN(totalLeave)) {
            showError('Please enter a valid number for total leave days');
            return false;
        }

        if (!leaveThisYear || isNaN(leaveThisYear)) {
            showError('Please enter a valid number for leave days this year');
            return false;
        }

        if (leaveThisYear > totalLeave) {
            showError('Requested leave days cannot exceed total available days');
            return false;
        }

        if (!preferredMonths.trim()) {
            showError('Please enter preferred months for your leave');
            return false;
        }

        return true;
    }

    // Update calendar events
    function updateCalendarEvents(preferredMonths, customHolidays, leaveThisYear) {
        calendar.removeAllEvents();

        const currentYear = document.getElementById('selectYear').value;
        const months = preferredMonths.split(',').map(m => m.trim()).filter(m => m);
        const holidays = customHolidays.split(',').map(h => h.trim()).filter(h => h);

        // Distribute PTO days across preferred months
        if (months.length && leaveThisYear > 0) {
            const daysPerMonth = Math.ceil(leaveThisYear / months.length);
            
            months.forEach(month => {
                try {
                    const monthIndex = new Date(`${month} 1, ${currentYear}`).getMonth();
                    let daysAdded = 0;
                    let dayOfMonth = 1;

                    while (daysAdded < daysPerMonth && dayOfMonth <= 31) {
                        const date = new Date(currentYear, monthIndex, dayOfMonth);
                        
                        // Skip if invalid date or weekend
                        if (date.getMonth() !== monthIndex || isWeekendDay(date)) {
                            dayOfMonth++;
                            continue;
                        }

                        calendar.addEvent({
                            title: 'PTO Day',
                            start: date,
                            allDay: true,
                            backgroundColor: '#28a745',
                            borderColor: '#28a745'
                        });

                        daysAdded++;
                        dayOfMonth++;
                    }
                } catch (e) {
                    console.error(`Error processing month: ${month}`, e);
                    showError(`Failed to process month: ${month}`);
                }
            });
        }

        // Add custom holidays
        holidays.forEach(holiday => {
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
                showError(`Failed to process holiday date: ${holiday}`);
            }
        });

        calendar.render();
    }

    // Update leave summary
    function updateLeaveSummary(totalLeave, leaveThisYear, remainingLeave) {
        if (!leaveSummary || !leaveSummaryContent) return;

        const ptoEvents = calendar.getEvents().filter(event => 
            event.title.toLowerCase().includes('pto')).length;

        leaveSummary.style.display = 'block';
        leaveSummaryContent.innerHTML = `
            <p>Total Leave Days Available: ${totalLeave}</p>
            <p>Leave Days Requested: ${leaveThisYear}</p>
            <p>Leave Days Scheduled: ${ptoEvents}</p>
            <p>Remaining Leave Days: ${remainingLeave}</p>
        `;
    }

    // Utility functions
    function isWeekendDay(date) {
        return date.getDay() === 0 || date.getDay() === 6;
    }

    function isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    function containsWeekend(start, end) {
        for (let date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
            if (isWeekendDay(date)) return true;
        }
        return false;
    }

    // Download handlers
    downloadPDFBtn.addEventListener('click', function() {
        showLoading();
        const element = document.getElementById('leaveSummaryContent');
        const opt = {
            margin: 1,
            filename: 'leave_summary.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save()
            .then(() => hideLoading())
            .catch(error => {
                console.error('PDF generation error:', error);
                showError('Failed to generate PDF');
                hideLoading();
            });
    });

    downloadExcelBtn.addEventListener('click', function() {
        try {
            const events = calendar.getEvents();
            const ptoCount = events.filter(event => 
                event.title.toLowerCase().includes('pto')).length;
            
            const summaryData = [
                ['Leave Summary Report'],
                ['Generated on:', new Date().toLocaleDateString()],
                [''],
                ['Total Leave Days Available', document.getElementById('totalLeave').value],
                ['Leave Days Requested', document.getElementById('leaveThisYear').value],
                ['Leave Days Scheduled', ptoCount],
                ['Remaining Leave Days', 
                    parseInt(document.getElementById('totalLeave').value) - ptoCount],
                [''],
                ['Scheduled Events'],
                ['Date', 'Event Type']
            ];

            // Add all events to the CSV
            events.sort((a, b) => a.start - b.start).forEach(event => {
                summaryData.push([
                    event.start.toISOString().split('T')[0],
                    event.title
                ]);
            });

            downloadCSV(summaryData, 'leave_summary.csv');
        } catch (error) {
            console.error('Excel generation error:', error);
            showError('Failed to generate Excel file');
        }
    });

    function downloadCSV(data, filename) {
        const csvContent = "data:text/csv;charset=utf-8," + 
            data.map(row => row.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
