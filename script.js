// Function to initialize the calendar
function initializeCalendar() {
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    selectable: true,
    events: [], // Placeholder for events
  });
  calendar.render();
}

// Event listener for the Start Planning button
document.getElementById('startPlanningBtn').addEventListener('click', function() {
  document.getElementById('ptoForm').style.display = 'block';
});

// Event listener for the Submit button
document.getElementById('submitFormBtn').addEventListener('click', function() {
  const totalPTO = parseInt(document.getElementById('totalPTO').value);
  const ptoThisYear = parseInt(document.getElementById('ptoThisYear').value);
  const preferredMonths = document.getElementById('preferredMonths').value.split(',').map(m => m.trim());

  if (isNaN(totalPTO) || isNaN(ptoThisYear) || totalPTO < 0 || ptoThisYear < 0) {
    alert('Please enter valid numbers for PTO days.');
    return;
  }

  if (ptoThisYear > totalPTO) {
    alert('PTO days to take this year cannot exceed total available PTO days.');
    return;
  }

  // Placeholder logic for PTO scheduling (to be improved)
  console.log('Form submitted');
  console.log({ totalPTO, ptoThisYear, preferredMonths });

  // TODO: Implement PTO scheduling logic here

  // PTO Summary
  updatePTOSummary(totalPTO, ptoThisYear);
});

function updatePTOSummary(totalPTO, ptoThisYear) {
  const ptoSummaryEl = document.getElementById('ptoSuggestions');
  if (ptoSummaryEl) {
    ptoSummaryEl.innerHTML = `
      <h2>PTO Summary</h2>
      <p>Total PTO Days Available: ${totalPTO}</p>
      <p>PTO Days Requested: ${ptoThisYear}</p>
      <p>PTO Days Scheduled: ${ptoThisYear}</p>
      <p>Remaining PTO Days: ${totalPTO - ptoThisYear}</p>
    `;
  }
}

// Download summary as PDF
function downloadSummaryAsPDF() {
  const element = document.getElementById('ptoSuggestions');
  if (element) {
    const opt = {
      margin: 1,
      filename: 'PTO_Summary.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  }
}

// Download summary as Excel
function downloadSummaryAsExcel() {
  const totalPTO = document.getElementById('totalPTO').value;
  const ptoThisYear = document.getElementById('ptoThisYear').value;
  const data = [
    ['Total PTO Days Available', totalPTO],
    ['PTO Days Requested', ptoThisYear],
    ['PTO Days Scheduled', ptoThisYear],
    ['Remaining PTO Days', totalPTO - ptoThisYear]
  ];

  let csvContent = "data:text/csv;charset=utf-8,";
  data.forEach(function(rowArray) {
    let row = rowArray.join(",");
    csvContent += row + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "PTO_Summary.csv");
  document.body.appendChild(link);

  link.click();
}

// Event listeners for download buttons
document.getElementById('downloadPDFBtn')?.addEventListener('click', downloadSummaryAsPDF);
document.getElementById('downloadExcelBtn')?.addEventListener('click', downloadSummaryAsExcel);

// Initialize calendar when the page loads
initializeCalendar();
