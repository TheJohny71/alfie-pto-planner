document.addEventListener('DOMContentLoaded', function () {
  const startPlanningBtn = document.getElementById('startPlanningBtn');
  const submitFormBtn = document.getElementById('submitFormBtn');
  const ptoForm = document.getElementById('ptoForm');
  const calendarContainer = document.getElementById('calendarContainer');
  const ptoSummary = document.getElementById('ptoSummary');
  const totalPTOAvailable = document.getElementById('totalPTOAvailable');
  const ptoRequested = document.getElementById('ptoRequested');
  const ptoScheduled = document.getElementById('ptoScheduled');
  const remainingPTO = document.getElementById('remainingPTO');

  startPlanningBtn.addEventListener('click', function () {
    ptoForm.style.display = 'block';
  });

  submitFormBtn.addEventListener('click', function () {
    const year = document.getElementById('yearSelect').value;
    const totalPTO = parseInt(document.getElementById('totalPTO').value, 10);
    const ptoThisYear = parseInt(document.getElementById('ptoThisYear').value, 10);
    const preferredMonths = document.getElementById('preferredMonths').value;

    if (isNaN(totalPTO) || isNaN(ptoThisYear) || totalPTO < 0 || ptoThisYear < 0) {
      alert('Please enter valid PTO values.');
      return;
    }

    const remainingDays = totalPTO - ptoThisYear;

    totalPTOAvailable.textContent = totalPTO;
    ptoRequested.textContent = ptoThisYear;
    ptoScheduled.textContent = ptoThisYear;
    remainingPTO.textContent = remainingDays;

    calendarContainer.classList.add('visible');
    ptoSummary.classList.add('visible');

    initializeCalendar(year, preferredMonths.split(','));
  });

  function initializeCalendar(year, preferredMonths) {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      initialDate: `${year}-01-01`,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek'
      },
      events: generatePTOEvents(year, preferredMonths),
      eventColor: '#007bff',
      eventTextColor: '#ffffff'
    });
    calendar.render();
  }

  function generatePTOEvents(year, preferredMonths) {
    const events = [];
    const weekends = [0, 6];
    const ptoDays = parseInt(document.getElementById('ptoThisYear').value, 10);

    let scheduledPTO = 0;
    for (let month = 0; month < 12; month++) {
      if (scheduledPTO >= ptoDays) break;
      const date = new Date(year, month, 1);
      while (date.getMonth() === month && scheduledPTO < ptoDays) {
        if (!weekends.includes(date.getDay()) && preferredMonths.includes(date.toLocaleString('default', { month: 'long' }).toLowerCase())) {
          events.push({
            title: 'PTO Day',
            start: date.toISOString().split('T')[0],
            allDay: true
          });
          scheduledPTO++;
        }
        date.setDate(date.getDate() + 1);
      }
    }

    return events;
  }
});
