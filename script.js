document.addEventListener('DOMContentLoaded', function() {
    var startPlanningBtn = document.getElementById('startPlanningBtn');
    var ptoForm = document.getElementById('ptoForm');
    var submitFormBtn = document.getElementById('submitFormBtn');
    var calendarContainer = document.getElementById('calendarContainer');
    var calendarEl = document.getElementById('calendar');
    var leaveSummaryContent = document.getElementById('leaveSummaryContent');
    var downloadPDFBtn = document.getElementById('downloadPDFBtn');
    var downloadExcelBtn = document.getElementById('downloadExcelBtn');

    if (startPlanningBtn) {
        startPlanningBtn.addEventListener('click', function() {
            ptoForm.style.display = 'block';
            calendarContainer.style.display = 'block';
        });
    }

    if (submitFormBtn) {
        submitFormBtn.addEventListener('click', function() {
            var totalLeave = parseInt(document.getElementById('totalLeave').value) || 0;
            var leaveThisYear = parseInt(document.getElementById('leaveThisYear').value) || 0;
            var remainingLeave = totalLeave - leaveThisYear;

            leaveSummaryContent.innerHTML = `
                <p>Total Leave Days Available: ${totalLeave}</p>
                <p>Leave Days Requested: ${leaveThisYear}</p>
                <p>Leave Days Scheduled: ${leaveThisYear}</p>
                <p>Remaining Leave Days: ${remainingLeave}</p>
            `;

            initializeCalendar();
        });
    }

    function initializeCalendar() {
        if (typeof FullCalendar !== 'undefined' && calendarEl) {
            var calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                events: generateLeaveEvents(),
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek'
                },
                dayCellClassNames: function(arg) {
                    var date = new Date(arg.date);
                    if (date.getDay() === 0 || date.getDay() === 6) {
                        // Sunday or Saturday - mark as weekend
                        return ['weekend-day'];
                    }
                },
                eventContent: function(arg) {
                    if (arg.event.extendedProps.type === 'holiday') {
                        return { html: `<span class="holiday-event">${arg.event.title}</span>` };
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
        var currentYear = document.getElementById('selectYear').value;

        if (preferredMonths.length && leaveThisYear > 0) {
            var daysPerMonth = Math.ceil(leaveThisYear / preferredMonths.length);

            preferredMonths.forEach(function(month) {
                var monthIndex = new Date(`${month} 1, ${currentYear}`).getMonth();
                for (var i = 1; i <= daysPerMonth; i++) {
                    leaveEvents.push({
                        title: 'Leave Day',
                        start: new Date(currentYear, monthIndex, i),
                        backgroundColor: '#28a745',
                        borderColor: '#28a745',
                        textColor: 'white',
                        type: 'leave'
                    });
                }
            });
        }

        // Adding a bank holiday for demonstration purposes
        leaveEvents.push({
            title: 'Spring Bank Holiday',
            start: new Date(currentYear, 4, 27), // May 27th as an example
            backgroundColor: '#ff6347',
            borderColor: '#ff6347',
            textColor: 'white',
            type: 'holiday'
        });

        return leaveEvents;
    }

    if (downloadPDFBtn) {
        downloadPDFBtn.addEventListener('click', function() {
            var element = document.getElementById('leaveSummary');
            html2pdf().from(element).save('leave_summary.pdf');
        });
    }

    if (downloadExcelBtn) {
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
    }
});
