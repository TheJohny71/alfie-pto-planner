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
        const calendarEl = document.getElementById('calendar');
        const year = parseInt(yearSelect.value);
        const totalPTO = parseInt(totalPTOInput.value);
        const ptoThisYear = parseInt(ptoThisYearInput.value);
        const preferredMonths = preferredMonthsInput.value.split(',').map(month => month.trim());

        const weekends = [];
        const holidays = [
            { date: `${year}-01-01`, title: "New Year's Day" },
            { date: `${year}-04-18`, title: "Good Friday" },
            { date: `${year}-04-21`, title: "Easter Monday" },
            { date: `${year}-05-05`, title: "Early May Bank Holiday" },
            { date: `${year}-05-26`, title: "Spring Bank Holiday" },
            { date: `${year}-08-25`, title: "Summer Bank Holiday" },
            { date: `${year}-12-25`, title: "Christmas Day" },
            { date: `${year}-12-26`, title: "Boxing Day" },
        ];

        const events = holidays.map(holiday => ({
            title: holiday.title,
            start: holiday.date,
            className: 'highlight-holiday'
        }));

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            initialDate: `${year}-06-01`,
            events: events,
            dateClick: function (info) {
                console.log('Clicked on: ' + info.dateStr);
            }
        });

        calendar.render();
    }

    function displaySummary() {
        const totalPTO = parseInt(totalPTOInput.value);
        const ptoThisYear = parseInt(ptoThisYearInput.value);
        const summaryDiv = document.getElementById('summary');

        summaryDiv.innerHTML = `
            <h3>PTO Summary</h3>
            <p>Total PTO Days Available: ${totalPTO}</p>
            <p>PTO Days Requested: ${ptoThisYear}</p>
            <p>PTO Days Scheduled: ${Math.min(totalPTO, ptoThisYear)}</p>
            <p>Remaining PTO Days: ${Math.max(0, totalPTO - ptoThisYear)}</p>
        `;
    }
});
