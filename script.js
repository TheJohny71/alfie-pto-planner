document.addEventListener("DOMContentLoaded", function () {
    const startPlanningBtn = document.getElementById("startPlanningBtn");
    const nextStep1Btn = document.getElementById("nextStep1Btn");
    const nextStep2Btn = document.getElementById("nextStep2Btn");

    const stepContainer = document.getElementById("stepContainer");
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const calendarContainer = document.getElementById("calendarContainer");

    const yearSelect = document.getElementById("yearSelect");
    const totalPTOInput = document.getElementById("totalPTO");
    const ptoThisYearInput = document.getElementById("ptoThisYear");
    const preferredMonthsInput = document.getElementById("preferredMonths");

    startPlanningBtn.addEventListener("click", () => {
        stepContainer.style.display = "block";
        step1.style.display = "block";
        startPlanningBtn.style.display = "none";
    });

    nextStep1Btn.addEventListener("click", () => {
        step1.style.display = "none";
        step2.style.display = "block";
    });

    nextStep2Btn.addEventListener("click", () => {
        step2.style.display = "none";
        calendarContainer.style.display = "block";
        displayCalendar();
        displaySummary();
    });

    function displayCalendar() {
        const selectedYear = yearSelect.value;
        const totalPTO = parseInt(totalPTOInput.value);
        const preferredMonths = preferredMonthsInput.value.split(',').map(month => month.trim().toLowerCase());

        const calendarEl = document.getElementById("calendar");
        const events = [];

        // Add Bank Holidays
        const bankHolidays = [
            { title: "New Year's Day", date: `${selectedYear}-01-01` },
            { title: "Good Friday", date: `${selectedYear}-04-18` },
            { title: "Easter Monday", date: `${selectedYear}-04-21` },
            { title: "Early May Bank Holiday", date: `${selectedYear}-05-05` },
            { title: "Spring Bank Holiday", date: `${selectedYear}-05-26` },
            { title: "Summer Bank Holiday", date: `${selectedYear}-08-25` },
            { title: "Christmas Day", date: `${selectedYear}-12-25` },
            { title: "Boxing Day", date: `${selectedYear}-12-26` }
        ];
        bankHolidays.forEach(holiday => {
            events.push({
                title: holiday.title,
                start: holiday.date,
                color: '#ffcccb'
            });
        });

        // Highlight Weekends
        let startDate = new Date(`${selectedYear}-01-01`);
        let endDate = new Date(`${selectedYear}-12-31`);
        while (startDate <= endDate) {
            if (startDate.getDay() === 0 || startDate.getDay() === 6) { // Sunday or Saturday
                events.push({
                    title: 'Weekend',
                    start: startDate.toISOString().split('T')[0],
                    display: 'background',
                    color: '#f0f0f0'
                });
            }
            startDate.setDate(startDate.getDate() + 1);
        }

        // Add PTO Days with Better Distribution
        const preferredMonthsIndices = preferredMonths.map(month => new Date(Date.parse(month + " 1, 2022")).getMonth());
        let ptoDaysScheduled = 0;

        for (let monthIndex of preferredMonthsIndices) {
            if (ptoDaysScheduled >= totalPTO) break;
            for (let day = 5; day <= 25; day += 7) { // Spread PTO days across the month
                if (ptoDaysScheduled >= totalPTO) break;

                let date = new Date(selectedYear, monthIndex, day);
                if (date.getDay() !== 0 && date.getDay() !== 6) { // Skip weekends
                    events.push({
                        title: 'PTO Day',
                        start: date.toISOString().split('T')[0],
                        color: '#add8e6'
                    });
                    ptoDaysScheduled++;
                }
            }
        }

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            height: 'auto',
            contentHeight: 'auto',
            events: events,
            eventContent: function (info) {
                const customHtml = document.createElement("div");
                customHtml.innerHTML = `<div class="fc-event-title">${info.event.title}</div>`;
                return { domNodes: [customHtml] };
            }
        });

        calendar.render();
    }

    function displaySummary() {
        const totalPTO = parseInt(totalPTOInput.value);
        const ptoRequested = parseInt(ptoThisYearInput.value);
        const summaryEl = document.getElementById("summary");

        summaryEl.innerHTML = `
            <h3>PTO Summary</h3>
            <p>Total PTO Days Available: ${totalPTO}</p>
            <p>PTO Days Requested: ${ptoRequested}</p>
            <p>PTO Days Scheduled: ${ptoRequested}</p>
            <p>Remaining PTO Days: ${totalPTO - ptoRequested}</p>
        `;
    }
});
