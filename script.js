document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('ptoForm');
    const calendar = initializeCalendar();

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmission();
    });

    document.getElementById('downloadPDFBtn').addEventListener('click', downloadSummaryAsPDF);
    document.getElementById('downloadExcelBtn').addEventListener('click', downloadSummaryAsExcel);
});

function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    return new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: 'auto',
        events: []
    });
}

function handleFormSubmission() {
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

    const ptoData = calculatePTO(totalPTO, ptoThisYear, preferredMonths);
    updatePTOSummary(ptoData);
    updateCalendar(ptoData.suggestedPTODates);
}

function calculatePTO(totalPTO, ptoThisYear, preferredMonths) {
    // This is a placeholder for the PTO calculation logic
    // In a real application, this would be more complex and consider weekends, holidays, etc.
    const suggestedPTODates = generateRandomPTODates(ptoThisYear);
    return {
        totalPTO,
        ptoThisYear,
        suggestedPTODates,
        remainingPTO: totalPTO - ptoThisYear
    };
}

function generateRandomPTODates(count) {
    const dates = [];
    const year = document.getElementById('yearSelect').value;
    for (let i = 0; i < count; i++) {
        const month = Math.floor(Math.random() * 12);
        const day = Math.floor(Math.random() * 28) + 1;
        dates.push(`${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
    }
    return dates;
}

function updatePTOSummary(ptoData) {
    const summaryEl = document.getElementById('ptoSummaryContent');
    summaryEl.innerHTML = `
        <p>Total PTO Days Available: ${ptoData.totalPTO}</p>
        <p>PTO Days Requested: ${ptoData.ptoThisYear}</p>
        <p>PTO Days Scheduled: ${ptoData.suggestedPTODates.length}</p>
        <p>Remaining PTO Days: ${ptoData.remainingPTO}</p>
    `;
}

function updateCalendar(ptoDates) {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        initialDate: ptoDates[0],
        events: ptoDates.map(date => ({
            title: 'PTO Day',
            start: date,
            allDay: true,
            color: '#4caf50'
        }))
    });
    calendar.render();
}

function downloadSummaryAsPDF() {
    const element = document.getElementById('ptoSummary');
    html2pdf().from(element).save('PTO_Summary.pdf');
}

function downloadSummaryAsExcel() {
    const summaryContent = document.getElementById('ptoSummaryContent').innerText;
    const blob = new Blob([summaryContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "PTO_Summary.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
