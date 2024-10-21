// Alfie Script File

document.addEventListener("DOMContentLoaded", function () {
  // Function to initialize the calendar
  function initializeCalendar(events = []) {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
      const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        selectable: true,
        events: events,
        eventContent: function (arg) {
          let italicEl = document.createElement('span');
          italicEl.innerHTML = `<strong>${arg.event.title}</strong>`;
          let arrayOfDomNodes = [italicEl];
          return { domNodes: arrayOfDomNodes };
        }
      });
      calendar.render();
    }
  }

  // Event listener for the Start Planning button
  const startPlanningBtn = document.getElementById('startPlanningBtn');
  if (startPlanningBtn) {
    startPlanningBtn.addEventListener('click', function () {
      document.getElementById('ptoForm').style.display = 'block';
      initializeCalendar();
    });
  }

  // Event listener for the Submit button
  const submitFormBtn = document.getElementById('submitFormBtn');
  if (submitFormBtn) {
    submitFormBtn.addEventListener('click', function () {
      const totalPTO = parseInt(document.getElementById('totalPTO').value);
      const ptoThisYear = parseInt(document.getElementById('ptoThisYear').value);
      const preferredMonths = document.getElementById('preferredMonths').value.split(',').map(m => m.trim());
      const customHolidays = document.getElementById('customHolidays').value.split(',').map(d => d.trim());

      // Placeholder logic for PTO scheduling (to be improved)
      console.log('Form submitted');
      console.log({ totalPTO, ptoThisYear, preferredMonths, customHolidays });

      // PTO Summary
      const ptoSummaryEl = document.getElementById('ptoSummary');
      if (ptoSummaryEl) {
        ptoSummaryEl.innerHTML = `
          <p>Total Leave Days Available: ${totalPTO}</p>
          <p>Leave Days Requested: ${ptoThisYear}</p>
          <p>Leave Days Scheduled: ${ptoThisYear}</p>
          <p>Remaining Leave Days: ${totalPTO - ptoThisYear}</p>
          <button id="downloadPDFBtn" class="btn btn-secondary btn-export">Download PDF</button>
          <button id="downloadExcelBtn" class="btn btn-secondary btn-export">Download Excel</button>
        `;
      }

      // Placeholder for events in calendar (e.g., leave days)
      let events = customHolidays.map(holiday => ({
        title: "Custom Holiday",
        start: holiday,
        color: "#FF6F61"
      }));

      // Add leave days to the calendar
      let today = new Date();
      let year = today.getFullYear();
      for (let i = 0; i < ptoThisYear; i++) {
        let leaveDate = new Date(year, i % 12, 10 + i);  // Randomized for demo
        events.push({
          title: "Leave Day",
          start: leaveDate.toISOString().split('T')[0],
          color: "#90EE90"
        });
      }

      initializeCalendar(events);

      // Adding event listeners to download buttons after the DOM is updated
      document.getElementById('downloadPDFBtn')?.addEventListener('click', downloadSummaryAsPDF);
      document.getElementById('downloadExcelBtn')?.addEventListener('click', downloadSummaryAsExcel);
    });
  }

  // Download summary as PDF
  function downloadSummaryAsPDF() {
    const element = document.getElementById('ptoSummary');
    if (element) {
      const opt = {
        margin: 1,
        filename: 'Leave_Summary.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    }
  }

  // Download summary as Excel
  function downloadSummaryAsExcel() {
    const data = [
      ['Total Leave Days Available', document.getElementById('totalPTO').value],
      ['Leave Days Requested', document.getElementById('ptoThisYear').value],
      ['Leave Days Scheduled', document.getElementById('ptoThisYear').value],
      ['Remaining Leave Days', document.getElementById('totalPTO').value - document.getElementById('ptoThisYear').value]
    ];

    let csvContent = "data:text/csv;charset=utf-8,";
    data.forEach(function (rowArray) {
      let row = rowArray.join(",");
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Leave_Summary.csv");
    document.body.appendChild(link);

    link.click();
  }
});
