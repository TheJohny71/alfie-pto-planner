document.addEventListener('DOMContentLoaded', function () {
    var submitFormBtn = document.getElementById('submitFormBtn');
    var calendarContainer = document.getElementById('calendarContainer');
    var calendarEl = document.getElementById('calendar');
    var leaveSummaryContent = document.getElementById('leaveSummaryContent');
    var downloadPDFBtn = document.getElementById('downloadPDFBtn');
    var downloadExcelBtn = document.getElementById('downloadExcelBtn');

    // Ensure the submit button is defined
    if (submitFormBtn) {
        submitFormBtn.addEventListener('click', function () {
            var totalLeave = parseInt(document.getElementById('totalLeave').value) || 0;
            var leaveThisYear = parseInt(document.getElementById('leaveThisYear').value) || 0;
            var remainingLeave = totalLeave - leaveThisYear;

            // Update the summary content
            leaveSummaryContent.innerHTML = `
                <p>Total Leave Days Available: ${totalLeave}</p>
                <p>Leave Days Requested: ${leaveThisYear}</p>
                <p>Leave Days Scheduled: ${leaveThisYear}</p>
                <p>Remaining Leave Days: ${remainingLeave}</p>
            `;
            leaveSummaryContent.parentElement.style.display = 'block';

            // Initialize the calendar after verifying FullCalendar is loaded
            if (typeof FullCalendar !== 'undefined') {
                initializeCalendar();
            } else {
                console.error("FullCalendar is not defined. Please ensure the FullCalendar script is loaded correctly.");
            }
        });
    }

    function initializeCalendar() {
        if (calendarEl) {
            // Clear any previously rendered calendar
            calendarEl.innerHTML = "";

            try {
                var calendar = new FullCalendar.Calendar(calendarEl, {
                    initialView: 'dayGridMonth',
                    events: generateLeaveEvents(),
                    headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek'
                    },
                    eventColor: '#28a745',
                    eventTextColor: '#ffffff',
                    dayMaxEvents: true,
                });
                calendar.render();
                calendarContainer.style.display = 'block';
            } catch (error) {
                console.error('Error initializing FullCalendar:', error);
            }
        } else {
            console.error('Calendar element is not found.');
        }
    }

    function generateLeaveEvents() {
        var leaveEvents = [];
        var leaveThisYear = parseInt(document.getElementById('leaveThisYear').value) || 0;
        var preferredMonths = document.getElementById('preferredMonths').value.split(',').map(m => m.trim());
        var customHolidays = document.getElementById('customHolidays').value.split(',').map(h => h.trim());

        if (preferredMonths.length && leaveThisYear > 0) {
            var currentYear = document.getElementById('selectYear').value;
            var daysPerMonth = Math.ceil(leaveThisYear / preferredMonths.length);

            preferredMonths.forEach(function (month) {
                var monthIndex = new Date(`${month} 1, ${currentYear}`).getMonth();
                for (var i = 1; i <= daysPerMonth; i++) {
                    leaveEvents.push({
                        title: 'Leave Day',
                        start: new Date(currentYear, monthIndex, i),
                        backgroundColor: '#28a745',
                        borderColor: '#28a745',
                        textColor: 'white'
                    });
                }
            });
        }

        customHolidays.forEach(function (holiday) {
            if (holiday) {
                leaveEvents.push({
                    title: 'Custom Holiday',
                    start: holiday,
                    backgroundColor: '#007bff',
                    borderColor: '#007bff',
                    textColor: 'white'
                });
            }
        });

        return leaveEvents;
    }

    // Download PDF functionality
    if (downloadPDFBtn) {
        downloadPDFBtn.addEventListener('click', function () {
            var element = document.getElementById('leaveSummary');
            html2pdf().from(element).save('leave_summary.pdf');
        });
    }

    // Download Excel functionality
    if (downloadExcelBtn) {
        downloadExcelBtn.addEventListener('click', function () {
            var summaryData = [
                ['Total Leave Days Available', document.getElementById('totalLeave').value],
                ['Leave Days Requested', document.getElementById('leaveThisYear').value],
                ['Leave Days Scheduled', document.getElementById('leaveThisYear').value],
                ['Remaining Leave Days', parseInt(document.getElementById('totalLeave').value) - parseInt(document.getElementById('leaveThisYear').value)]
            ];

            var csvContent = "data:text/csv;charset=utf-8,";
            summaryData.forEach(function (rowArray) {
                let row = rowArray.join(",");
                csvContent += row + "\r\n";
            });

            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "leave_summary.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});
