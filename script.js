document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('startPlanningBtn').addEventListener('click', function() {
    document.getElementById('ptoForm').style.display = 'block';
  });

  document.getElementById('submitFormBtn').addEventListener('click', function() {
    const year = document.getElementById('yearSelect').value;
    const totalPTO = parseInt(document.getElementById('totalPTO').value);
    const ptoThisYear = parseInt(document.getElementById('ptoThisYear').value);
    const preferredMonths = document.getElementById('preferredMonths').value.split(',').map(m => m.trim());

    document.getElementById('ptoForm').style.display = 'none';
    document.getElementById('calendarContainer').style.display = 'block';
    document.getElementById('ptoSummary').style.display = 'block';

    initializeCalendar(year, preferredMonths);

    document.getElementById('totalPTOAvailable').textContent = totalPTO;
    document.getElementById('ptoRequested').textContent = ptoThisYear;
    document.getElementById('ptoScheduled').textContent = ptoThisYear;
    document.getElementById('remainingPTO').textContent = totalPTO - ptoThisYear;
  });

  function initializeCalendar(year, preferredMonths) {
    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      initialDate: year + '-01-01',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,dayGridWeek'
      },
      events: generatePTOEvents(year, preferredMonths),
      eventColor: '#378006'
    });
    calendar.render();
  }

  function generatePTOEvents(year, preferredMonths) {
    const events = [];

    // Example to populate bank holidays, weekends, and PTO days dynamically
    events.push({
      title: 'New Year's Day',
      start: `${year}-01-01`,
      backgroundColor: 'red',
      borderColor: 'red'
    });

    // Generate weekends and add as events
    const weekends = getWeekends(year);
    weekends.forEach(weekend => {
      events.push({
        title: 'Weekend',
        start: weekend,
        color: 'gray'
      });
    });

    // Add PTO days
    preferredMonths.forEach(month => {
      const monthIndex = new Date(`${month} 1, ${year}`).getMonth() + 1;
      events.push({
        title: 'PTO Day',
        start: `${year}-${String(monthIndex).padStart(2, '0')}-15`,
        backgroundColor: 'blue',
        borderColor: 'blue'
      });
    });

    return events;
  }

  function getWeekends(year) {
    const weekends = [];
    for (let month = 0; month < 12; month++) {
      for (let day = 1; day <= 31; day++) {
        const date = new Date(year, month, day);
        if (date.getFullYear() === parseInt(year) && (date.getDay() === 0 || date.getDay() === 6)) {
          weekends.push(date.toISOString().split('T')[0]);
        }
      }
    }
    return weekends;
  }

  // Download Summary as PDF
  document.getElementById('downloadPdfBtn').addEventListener('click', function() {
    const summary = document.getElementById('ptoSummary').innerText;
    const pdfWindow = window.open('', '_blank');
    pdfWindow.document.write('<pre>' + summary + '</pre>');
    pdfWindow.document.close();
    pdfWindow.print();
  });

  // Download Summary as Excel
  document.getElementById('downloadExcelBtn').addEventListener('click', function() {
    let table = '<table><tr><th>PTO Summary</th></tr>';
    table += '<tr><td>Total PTO Days Available</td><td>' + document.getElementById('totalPTOAvailable').textContent + '</td></tr>';
    table += '<tr><td>PTO Days Requested</td><td>' + document.getElementById('ptoRequested').textContent + '</td></tr>';
    table += '<tr><td>PTO Days Scheduled</td><td>' + document.getElementById('ptoScheduled').textContent + '</td></tr>';
    table += '<tr><td>Remaining PTO Days</td><td>' + document.getElementById('remainingPTO').textContent + '</td></tr>';
    table += '</table>';

    const data = 'data:application/vnd.ms-excel,' + encodeURIComponent(table);
    const link = document.createElement('a');
    link.href = data;
    link.download = 'PTO_Summary.xls';
    link.click();
  });
});
