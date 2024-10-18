// JavaScript for Alfie PTO Planner

let calendar;

document.addEventListener("DOMContentLoaded", function() {
  const startPlanningBtn = document.getElementById("startPlanningBtn");
  const submitFormBtn = document.getElementById("submitFormBtn");
  const ptoForm = document.getElementById("ptoForm");
  const calendarContainer = document.getElementById("calendarContainer");
  const loadingIcon = document.querySelector(".loading-icon");

  startPlanningBtn.addEventListener("click", () => {
    ptoForm.style.display = "block";
    startPlanningBtn.style.display = "none";
  });

  submitFormBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loadingIcon.style.display = "block";

    setTimeout(() => {
      loadingIcon.style.display = "none";
      calendarContainer.style.display = "block";
      initializeCalendar();
      displayPtoSummary();
    }, 1000);
  });

  function initializeCalendar() {
    const calendarEl = document.getElementById("calendar");
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth'
      },
      events: getPtoEvents()
    });
    calendar.render();
  }

  function getPtoEvents() {
    const year = parseInt(document.getElementById("yearSelect").value);
    const totalPtoDays = parseInt(document.getElementById("totalPTO").value);
    const ptoDaysRequested = parseInt(document.getElementById("ptoThisYear").value);
    const preferredMonths = document.getElementById("preferredMonths").value.split(",").map(month => month.trim().toLowerCase());

    const bankHolidays = getBankHolidays(year);
    const weekends = getWeekends(year);

    const ptoEvents = [];

    // Adding bank holidays
    bankHolidays.forEach(holiday => {
      ptoEvents.push({
        title: holiday.name,
        start: holiday.date,
        color: 'red'
      });
    });

    // Adding weekends
    weekends.forEach(weekend => {
      ptoEvents.push({
        title: 'Weekend',
        start: weekend,
        color: 'lightgrey'
      });
    });

    // Adding PTO days
    let addedPtoDays = 0;
    let currentDate = new Date(year, 0, 1);
    while (addedPtoDays < ptoDaysRequested) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !isBankHoliday(currentDate, bankHolidays)) {
        const monthName = currentDate.toLocaleString('default', { month: 'long' }).toLowerCase();
        if (preferredMonths.includes(monthName) || preferredMonths.length === 0) {
          ptoEvents.push({
            title: 'PTO Day',
            start: currentDate.toISOString().split('T')[0],
            color: 'blue'
          });
          addedPtoDays++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return ptoEvents;
  }

  function getBankHolidays(year) {
    return [
      { name: "New Year's Day", date: `${year}-01-01` },
      { name: "Good Friday", date: `${year}-04-18` },
      { name: "Easter Monday", date: `${year}-04-21` },
      { name: "Early May Bank Holiday", date: `${year}-05-05` },
      { name: "Spring Bank Holiday", date: `${year}-05-26` },
      { name: "Summer Bank Holiday", date: `${year}-08-25` },
      { name: "Christmas Day", date: `${year}-12-25` },
      { name: "Boxing Day", date: `${year}-12-26` }
    ];
  }

  function getWeekends(year) {
    const weekends = [];
    let currentDate = new Date(year, 0, 1);
    while (currentDate.getFullYear() === year) {
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        weekends.push(currentDate.toISOString().split('T')[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return weekends;
  }

  function isBankHoliday(date, bankHolidays) {
    return bankHolidays.some(holiday => new Date(holiday.date).toDateString() === date.toDateString());
  }

  function displayPtoSummary() {
    const totalPtoDays = parseInt(document.getElementById("totalPTO").value);
    const ptoDaysRequested = parseInt(document.getElementById("ptoThisYear").value);
    const ptoDaysScheduled = Math.min(totalPtoDays, ptoDaysRequested);
    const remainingPtoDays = totalPtoDays - ptoDaysScheduled;

    const summaryHtml = `
      <div class="pto-summary">
        <h3>PTO Summary</h3>
        <p>Total PTO Days Available: ${totalPtoDays}</p>
        <p>PTO Days Requested: ${ptoDaysRequested}</p>
        <p>PTO Days Scheduled: ${ptoDaysScheduled}</p>
        <p>Remaining PTO Days: ${remainingPtoDays}</p>
      </div>
    `;
    calendarContainer.insertAdjacentHTML("afterend", summaryHtml);
  }
});
