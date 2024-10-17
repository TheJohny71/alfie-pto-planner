document.addEventListener('DOMContentLoaded', function() {
  const startPlanningBtn = document.getElementById('startPlanningBtn');
  const nextStep1Btn = document.getElementById('nextStep1Btn');
  const nextStep2Btn = document.getElementById('nextStep2Btn');
  const yearSelect = document.getElementById('yearSelect');
  const totalPTOInput = document.getElementById('totalPTO');
  const ptoThisYearInput = document.getElementById('ptoThisYear');
  const preferredMonthsInput = document.getElementById('preferredMonths');
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const calendarContainer = document.getElementById('calendarContainer');
  const calendarEl = document.getElementById('calendar');

  startPlanningBtn.addEventListener('click', function() {
    startPlanningBtn.style.display = 'none';
    step1.style.display = 'block';
  });

  nextStep1Btn.addEventListener('click', function() {
    step1.style.display = 'none';
    step2.style.display = 'block';
  });

  nextStep2Btn.addEventListener('click', function() {
    const totalPTO = parseInt(totalPTOInput.value);
    const ptoThisYear = parseInt(ptoThisYearInput.value);
    const preferredMonths = preferredMonthsInput.value.split(',').map(month => month.trim());

    if (isNaN(totalPTO) || isNaN(ptoThisYear) || ptoThisYear > totalPTO) {
      alert('Please enter valid PTO details. PTO days to take should not exceed total PTO days available.');
      return;
    }

    step2.style.display = 'none';
    calendarContainer.style.display = 'block';
    initializeCalendar(yearSelect.value, totalPTO, ptoThisYear, preferredMonths);
  });

  function initializeCalendar(year, totalPTO, ptoThisYear, preferredMonths) {
    if (typeof FullCalendar === 'undefined') {
      console.error('FullCalendar library not loaded.');
      return;
    }
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      initialDate: `${year}-01-01`,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      },
      events: generateEvents(year, ptoThisYear, preferredMonths),
      eventDisplay: 'auto',
    });
    calendar.render();
  }

  function generateEvents(year, ptoThisYear, preferredMonths) {
    const events = [];

    // Add UK bank holidays
    const bankHolidays = [
      { date: `${year}-01-01`, title: "New Year's Day" },
      { date: `${year}-04-18`, title: "Good Friday" },
      { date: `${year}-04-21`, title: "Easter Monday" },
      { date: `${year}-05-05`, title: "Early May Bank Holiday" },
      { date: `${year}-05-26`, title: "Spring Bank Holiday" },
      { date: `${year}-08-25`, title: "Summer Bank Holiday" },
      { date: `${year}-12-25`, title: "Christmas Day" },
      { date: `${year}-12-26`, title: "Boxing Day" }
    ];

    bankHolidays.forEach(holiday => {
      events.push({
        title: holiday.title,
        start: holiday.date,
        classNames: ['highlight-holiday']
      });
    });

    // Add PTO days
    let ptoDaysScheduled = 0;
    for (let month = 0; month < 12 && ptoDaysScheduled < ptoThisYear; month++) {
      const date = new Date(year, month, 1);
      while (date.getMonth() === month && ptoDaysScheduled < ptoThisYear) {
        if (date.getDay() !== 0 && date.getDay() !== 6 && (preferredMonths.length === 0 || preferredMonths.includes(date.toLocaleString('default', { month: 'long' })))) {
          events.push({
            title: 'PTO Day',
            start: date.toISOString().split('T')[0],
            classNames: ['highlight-pto']
          });
          ptoDaysScheduled++;
        }
        date.setDate(date.getDate() + 1);
      }
    }

    // Highlight weekends
    const weekends = [];
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      while (date.getMonth() === month) {
        if (date.getDay() === 0 || date.getDay() === 6) {
          weekends.push({
            title: 'Weekend',
            start: date.toISOString().split('T')[0],
            display: 'background',
            classNames: ['highlight-weekend']
          });
        }
        date.setDate(date.getDate() + 1);
      }
    }

    return events.concat(weekends);
  }
});
