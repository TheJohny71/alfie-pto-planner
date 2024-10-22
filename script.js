document.addEventListener('DOMContentLoaded', function () {
    var startPlanningBtn = document.getElementById('startPlanningBtn');
    var ptoForm = document.getElementById('ptoForm');
    var submitFormBtn = document.getElementById('submitFormBtn');
    var calendarContainer = document.getElementById('calendarContainer');
    var calendarEl = document.getElementById('calendar');
    var leaveSummary = document.getElementById('leaveSummary');
    var downloadPDFBtn = document.getElementById('downloadPDFBtn');
    var downloadExcelBtn = document.getElementById('downloadExcelBtn');

    startPlanningBtn.addEventListener('click', function () {
        ptoForm.style.display = 'block';
        calendarContainer.style.display = 'block';
    });

    submitFormBtn.addEventListener('click', function () {
        var totalLeave = parseInt(document.getElementById('totalLeave').value) || 0;
        var leaveThisYear = parseInt(document.getElementById('leaveThisYear').value) || 0;
        var remainingLeave = totalLeave - leaveThisYear;

        leaveSummary.innerHTML = `
            <p>Total Leave Days Available: ${totalLeave}</p>
            <p>Leave Days Requested: ${leaveThisYear}</p>
            <p>Leave Days Scheduled: ${leaveThisYear}</p>
            <p>Remaining Leave Days: ${remainingLeave}</p>
        `;

        initializeCalendar();
    });

    function initializeCalendar() {
        if (typeof FullCalendar !== 'undefined') {
            var calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                events: generateLeaveEvents(),
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek'
                },
                dayRender: function(info) {
                    var day = info.date.getDay();
                    if (day === 0 || day === 6) {
                        info.el.style.backgroundColor = '#f0f0f0';
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

        // Add Leave Days based on Preferred Months
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
                        borderColor: '#28a745'
                    });
                }
            });
        }

        // Add Custom Holidays
        customHolidays.forEach(function (holiday) {
            if (holiday) {
                leaveEvents.push({
                    title: 'Custom Holiday',
                    start: holiday,
                    backgroundColor: '#007bff',
                    borderColor: '#007bff'
                });
            }
        });

        // Add Bank Holidays for Current Year (Sample Data)
        var bankHolidays = [
            { title: 'New Year\'s Day', date: '2025-01-01' },
            { title: 'Spring Bank Holiday', date: '2025-05-26' },
            { title: 'Christmas Day', date: '2025-12-25' }
        ];

        bankHolidays.forEach(function (holiday) {
            leaveEvents.push({
                title: holiday.title,
                start: holiday.date,
                backgroundColor: '#ff5733',
                borderColor: '#ff5733'
            });
        });

        return leaveEvents;
    }

    downloadPDFBtn.addEventListener('click', function () {
        var element = document.getElementById('leaveSummary');
        html2pdf().from(element).save('leave_summary.pdf');
    });

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
});
