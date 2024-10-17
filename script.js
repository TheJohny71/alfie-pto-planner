// Updated script.js to highlight PTO, holidays, and weekends

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
  const summary = document.getElementById('summary');
  const calendarEl = document.getElementById('calendar');

  let selectedYear;
  let totalPTO;
  let ptoThisYear;
  let preferredMonths;

  // Event listener for start button
  startPlanningBtn.addEventListener('click', function() {
    step1.style.display = 'block';
  });

  // Event listener for next button on step 1
  nextStep1Btn.addEventListener('click', function() {
    selectedYear = yearSelect.value;
    step1.style.display = 'none';
    step2.style.display = 'block';
  });

  // Event listener for next button on step 2
  nextStep2Btn.addEventListener('click', function() {
    totalPTO = parseInt(totalPTOInput.value, 10);
    ptoThisYear = parseInt(ptoThisYearInput.value, 10);
    preferredMonths = preferredMonthsInput.value.split(',').map(month => month.trim());

    if (isNaN(totalPTO) || isNaN(ptoThisYear) || ptoThisYear > totalPTO) {
      alert('Please enter valid PTO details.');
      return;
    }

    step2.style.display = 'none';
    calendarContainer.style.display = 'block';

    // Initialize calendar with PTO, weekends, and holidays highlighted
    initializeCalendar();
  });

  // Function to initialize calendar
  function initializeCalendar() {
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      initialDate: `${selectedYear}-01-01`,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth'
      },
      events: getPTOEvents(),
      eventDidMount: function(info) {
        if (info.event.extendedProps.type === 'holiday') {
          info.el.classList.add('highlight-holiday');
        } else if (info.event.extendedProps.type === 'pto') {
          info.el.classList.add('highlight-pto');
        }
      },
      dayCellDidMount: function(info) {
        const date = new Date(info.date);
        if (date.getDay() === 0 || date.getDay() === 6) {
          info.el.classList.add('highlight-weekend');
        }
      }
    });
    calendar.render();

    // Display summary
    displaySummary();
  }

  // Function to get PTO events
  function getPTOEvents() {
    const events = [];

    // Add PTO days
    let ptoScheduled = 0;
    for (let i = 0; i < 12; i++) {
      if (ptoScheduled >= ptoThisYear) break;
      const month = preferredMonths[i % preferredMonths.length];
      const monthIndex = new Date(`${month} 1, ${selectedYear}`).getMonth();
      const eventDate = new Date(selectedYear, monthIndex, 15 + i);
      if (eventDate.getDay() !== 0 && eventDate.getDay() !== 6) {
        events.push({
          title: 'PTO Day',
          start: eventDate.toISOString().split('T')[0],
          type: 'pto'
        });
        ptoScheduled++;
      }
    }

    // Add UK bank holidays
    const holidays = [
      { title: "New Year's Day", date: `${selectedYear}-01-01` },
      { title: "Good Friday", date: `${selectedYear}-04-18` },
      { title: "Easter Monday", date: `${selectedYear}-04-21` },
      { title: "Early May Bank Holiday", date: `${selectedYear}-05-05` },
      { title: "Spring Bank Holiday", date: `${selectedYear}-05-26` },
      { title: "Summer Bank Holiday", date: `${selectedYear}-08-25` },
      { title: "Christmas Day", date: `${selectedYear}-12-25` },
      { title: "Boxing Day", date: `${selectedYear}-12-26` }
    ];

    holidays.forEach(holiday => {
      events.push({
        title: holiday.title,
        start: holiday.date,
        type: 'holiday'
      });
    });

    return events;
  }

  // Function to display summary
  function displaySummary() {
    summary.innerHTML = `
      <h3>PTO Summary</h3>
      <p>Total PTO Days Available: ${totalPTO}</p>
      <p>PTO Days Requested: ${ptoThisYear}</p>
      <p>PTO Days Scheduled: ${ptoThisYear}</p>
      <p>Remaining PTO Days: ${totalPTO - ptoThisYear}</p>
    `;
  }
});
