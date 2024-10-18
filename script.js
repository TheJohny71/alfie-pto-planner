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
    const year = document.getElementById('yearSelect').value;
    const holidays = getHolidays(year);
    const weekends = getWeekends(year);
    const preferredMonthIndices = preferredMonths.map(month => new Date(Date.parse(month + " 1, 2022")).getMonth());

    let suggestedPTODates = [];
    let currentDate = new Date(year, 0, 1);

    while (suggestedPTODates.length < ptoThisYear && currentDate.getFullYear() === parseInt(year)) {
        if (isPreferredMonth(currentDate, preferredMonthIndices) &&
            !isWeekend(currentDate, weekends) &&
            !isHoliday(currentDate, holidays)) {
            suggestedPTODates.push(formatDate(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        totalPTO,
        ptoThisYear,
        suggestedPTODates,
        remainingPTO: totalPTO - suggestedPTODates.length
    };
}

function getHolidays(year) {
    // Example holidays (replace with actual holidays)
    return [
        `${year}-01-01`, // New Year's Day
        `${year}-12-25`  // Christmas Day
    ];
}

function getWeekends(year) {
    const weekends = [];
    let date = new Date(year, 0, 1);
    while (date.getFullYear() === parseInt(year)) {
        if (date.getDay() === 0 || date.getDay() === 6) {
            weekends.push(formatDate(date));
        }
        date.setDate(date.getDate() + 1);
    }
    return weekends;
}

function isPreferredMonth(date, preferredMonthIndices) {
    return preferredMonthIndices.includes(date.getMonth());
}

function isWeekend(date, weekends) {
    return weekends.includes(formatDate(date));
}

function isHoliday(date, holidays) {
    return holidays.includes(formatDate(date));
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
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
