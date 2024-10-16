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
        const calendarEl = document.getElementById("calendar");
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            height: 'auto',
            events: [
                {
                    title: 'New Year\'s Day',
                    start: '2025-01-01',
                    color: '#ff5733'
                },
                {
                    title: 'Bank Holiday',
                    start: '2025-04-21',
                    color: '#ffcc00'
                }
            ]
        });
        calendar.render();
    }

    function displaySummary() {
        const totalPTO = totalPTOInput.value;
        const ptoRequested = ptoThisYearInput.value;
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
