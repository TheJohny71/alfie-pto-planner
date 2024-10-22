document.addEventListener('DOMContentLoaded', function() {
    var startPlanningBtn = document.getElementById('startPlanningBtn');
    var ptoForm = document.getElementById('ptoForm');
    var submitFormBtn = document.getElementById('submitFormBtn');
    var calendarContainer = document.getElementById('calendarContainer');
    var calendarEl = document.getElementById('calendar');
    var leaveSummary = document.getElementById('leaveSummary');
    var leaveSummaryContent = document.getElementById('leaveSummaryContent');
    var downloadPDFBtn = document.getElementById('downloadPDFBtn');
    var downloadExcelBtn = document.getElementById('downloadExcelBtn');

    submitFormBtn.addEventListener('click', function() {
        var totalLeave = parseInt(document.getElementById('totalLeave').value) || 0;
        var leaveThisYear = parseInt(document.getElementById('leaveThisYear').value) || 0;
        var remainingLeave = totalLeave - leaveThisYear;

        leaveSummary.style.display = 'block';
        leaveSummaryContent.innerHTML = `
            <p>Total Leave Days Available: ${totalLeave}</p>
            <p>Leave Days Requested: ${leaveThisYear}</p>
            <p>Leave Days Scheduled: ${leaveThisYear}</p>
            <p>Remaining Leave Days: ${remainingLeave}</p>
        `;

        initializeCalendar();
    });

    function initializeCalendar() {
        if (typeof FullCalendar !== 'undefined') {
            calendarContainer.style.display = 'block';

            var calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                events: generateLeaveEvents(),
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek'
                },
                dayCellDidMount: function(info) {
                    var day = info.date.getDay();
                    if (day === 0 || day === 6) {
                        info.el.style.backgroundColor = '#f8d7da'; // Light red for weekends
                    }
                }
            });
            calendar.render();
        } else {
            console.error('FullCalendar is not defined. Please ensure the FullCalendar script is loaded correctly.');
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

            preferredMonths.forEach(function(month) {
                var monthIndex = new Date(`${month} 1, ${currentYear}`).getMonth();
                for (var i = 1; i <= daysPerMonth; i++) {
                    leaveEvents.push({
                        title: 'PTO Day',
                        start: new Date(currentYear, monthIndex, i),
                        backgroundColor: '#28a745', // Green for PTO days
                        borderColor: '#28a745'
                    });
                }
            });
        }

        // Add custom holidays to events
        customHolidays.forEach(function(holiday) {
            if (holiday) {
                leaveEvents.push({
                    title: 'Bank Holiday',
                    start: holiday,
                    backgroundColor: '#ffc107', // Yellow for bank holidays
                    borderColor: '#ffc107'
                });
            }
        });

        return leaveEvents;
    }

    downloadPDFBtn.addEventListener('click', function() {
        var element = document.getElementById('leaveSummaryContent');
        html2pdf().from(element).save('leave_summary.pdf');
    });

    downloadExcelBtn.addEventListener('click', function() {
        var summaryData = [
            ['Total Leave Days Available', document.getElementById('totalLeave').value],
            ['Leave Days Requested', document.getElementById('leaveThisYear').value],
            ['Leave Days Scheduled', document.getElementById('leaveThisYear').value],
            ['Remaining Leave Days', parseInt(document.getElementById('totalLeave').value) - parseInt(document.getElementById('leaveThisYear').value)]
        ];

        var csvContent = "data:text/csv;charset=utf-8,";
        summaryData.forEach(function(rowArray) {
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
});
