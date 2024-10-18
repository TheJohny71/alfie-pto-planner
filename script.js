document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('ptoForm');
    form.addEventListener('submit', handleFormSubmission);

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

function handleFormSubmission(e) {
    e.preventDefault();
    const totalPTO = parseInt(document.getElementById('totalPTO').value);
    const ptoThisYear = parseInt(document.getElementById('ptoThisYear').value);
    const preferredMonths = document.getElementById('preferredMonths').value.split(',').map(m => m.trim());
    const customHolidays = document.getElementById('customHolidays').value.split(',').map(d => d.trim());

    if (isNaN(totalPTO) || isNaN(ptoThisYear) || totalPTO < 0 || ptoThisYear < 0) {
        alert('Please enter valid numbers for leave days.');
        return;
    }

    if (ptoThisYear > totalPTO) {
        alert('Leave days to take this year cannot exceed total available leave days.');
        return;
    }

    const ptoData = calculatePTO(totalPTO, ptoThisYear, preferredMonths, customHolidays);
    updatePTOSummary(ptoData);
    updateCalendar(ptoData.suggestedPTODates, ptoData.holidays);
    createYearAtGlanceView(ptoData);
}

function calculatePTO(totalPTO, ptoThisYear, preferredMonths, customHolidays) {
    const year = document.getElementById('yearSelect').value;
    const holidays = getHolidays(year, customHolidays);
    const weekends = getWeekends(year);
    const preferredMonthIndices = preferredMonths.map(month => new Date(Date.parse(month + " 1, " + year)).getMonth());

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
        remainingPTO: totalPTO - suggestedPTODates.length,
        holidays: holidays
    };
}

function getHolidays(year, customHolidays) {
    const defaultHolidays = [
        { date: `${year}-01-01`, name: "New Year's Day" },
        { date: `${year}-12-25`, name: "Christmas Day" },
        { date: `${year}-12-26`, name: "Boxing Day" },
        { date: `${year}-04-15`, name: "Good Friday" },
        { date: `${year}-04-18`, name: "Easter Monday" },
        { date: `${year}-05-02`, name: "Early May Bank Holiday" },
        { date: `${year}-06-02`, name: "Spring Bank Holiday" },
        { date: `${year}-08-29`, name: "Summer Bank Holiday" }
    ];
    const customHolidayObjects = customHolidays.map(date => ({ date, name: "Custom Holiday" }));
    return [...defaultHolidays, ...customHolidayObjects];
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
    return holidays.some(holiday => holiday.date === formatDate(date));
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function updatePTOSummary(ptoData) {
    const summaryEl = document.getElementById('ptoSummaryContent');
    summaryEl.innerHTML = `
        <p>Total Leave Days Available: ${ptoData.totalPTO}</p>
        <p>Leave Days Requested: ${ptoData.ptoThisYear}</p>
        <p>Leave Days Scheduled: ${ptoData.suggestedPTODates.length}</p>
        <p>Remaining Leave Days: ${ptoData.remainingPTO}</p>
    `;
}

function updateCalendar(ptoDates, holidays) {
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        initialDate: ptoDates[0],
        events: [
            ...ptoDates.map(date => ({
                title: 'Leave Day',
                start: date,
                allDay: true,
                color: '#90EE90'
            })),
            ...holidays.map(holiday => ({
                title: holiday.name,
                start: holiday.date,
                allDay: true,
                color: '#ffcccb'
            }))
        ],
        dayCellClassNames: function(arg) {
            const date = formatDate(arg.date);
            if (getWeekends(arg.date.getFullYear()).includes(date)) {
                return 'weekend';
            }
            return '';
        }
    });
    calendar.render();
}

function createYearAtGlanceView(ptoData) {
    const yearAtGlanceEl = document.getElementById('yearAtGlance');
    const year = document.getElementById('yearSelect').value;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    let yearAtGlanceHTML = '<div class="year-at-glance">';
    months.forEach((month, index) => {
        yearAtGlanceHTML += `
            <div class="month">
                <div class="month-title">${month}</div>
                ${createMonthGrid(year, index, ptoData.suggestedPTODates, ptoData.holidays)}
            </div>
        `;
    });
    yearAtGlanceHTML += '</div>';

    yearAtGlanceEl.innerHTML = yearAtGlanceHTML;
}

function createMonthGrid(year, month, ptoDates, holidays) {
    const date = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let gridHTML = '';

    for (let i = 0; i < date.getDay(); i++) {
        gridHTML += '<span class="day"></span>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateString = formatDate(currentDate);
        let classes = 'day';
        
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) classes += ' weekend';
        if (holidays.some(holiday => holiday.date === dateString)) classes += ' holiday';
        if (ptoDates.includes(dateString)) classes += ' pto';
        
        gridHTML += `<span class="${classes}">${day}</span>`;
    }

    return gridHTML;
}

function downloadSummaryAsPDF() {
    const element = document.getElementById('ptoSummary');
    html2pdf().from(element).save('Leave_Summary.pdf');
}

function downloadSummaryAsExcel() {
    const summaryContent = document.getElementById('ptoSummaryContent').innerText;
    const blob = new Blob([summaryContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Leave_Summary.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
