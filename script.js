document.addEventListener('DOMContentLoaded', function() {
    // Element references remain the same as before...

    // UK Bank Holidays for multiple years
    const ukBankHolidays = {
        2024: [
            { date: '2024-01-01', title: "New Year's Day" },
            { date: '2024-03-29', title: "Good Friday" },
            { date: '2024-04-01', title: "Easter Monday" },
            { date: '2024-05-06', title: "Early May Bank Holiday" },
            { date: '2024-05-27', title: "Spring Bank Holiday" },
            { date: '2024-08-26', title: "Summer Bank Holiday" },
            { date: '2024-12-25', title: "Christmas Day" },
            { date: '2024-12-26', title: "Boxing Day" }
        ],
        2025: [
            { date: '2025-01-01', title: "New Year's Day" },
            { date: '2025-04-18', title: "Good Friday" },
            { date: '2025-04-21', title: "Easter Monday" },
            { date: '2025-05-05', title: "Early May Bank Holiday" },
            { date: '2025-05-26', title: "Spring Bank Holiday" },
            { date: '2025-08-25', title: "Summer Bank Holiday" },
            { date: '2025-12-25', title: "Christmas Day" },
            { date: '2025-12-26', title: "Boxing Day" }
        ],
        2026: [
            { date: '2026-01-01', title: "New Year's Day" },
            { date: '2026-04-03', title: "Good Friday" },
            { date: '2026-04-06', title: "Easter Monday" },
            { date: '2026-05-04', title: "Early May Bank Holiday" },
            { date: '2026-05-25', title: "Spring Bank Holiday" },
            { date: '2026-08-31', title: "Summer Bank Holiday" },
            { date: '2026-12-25', title: "Christmas Day" },
            { date: '2026-12-28', title: "Boxing Day (Substitute)" }
        ]
    };

    // UK-specific leave types
    const leaveTypes = {
        annual: { title: 'Annual Leave', color: '#28a745', textColor: '#ffffff' },
        bankHoliday: { title: 'Bank Holiday', color: '#ffc107', textColor: '#000000' },
        special: { title: 'Special Leave', color: '#17a2b8', textColor: '#ffffff' },
        sick: { title: 'Sick Leave', color: '#dc3545', textColor: '#ffffff' },
        training: { title: 'Training Day', color: '#6f42c1', textColor: '#ffffff' },
        wfh: { title: 'Work From Home', color: '#fd7e14', textColor: '#000000' }
    };

    // Calendar initialization with enhanced styling
    function initializeCalendar() {
        if (!calendarEl) {
            showError('Calendar element not found');
            return;
        }

        try {
            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,listMonth'
                },
                views: {
                    listMonth: {
                        buttonText: 'List View'
                    }
                },
                selectable: true,
                selectMirror: true,
                weekends: true,
                height: 'auto',
                displayEventTime: false,
                firstDay: 1, // Monday start (UK)
                businessHours: {
                    daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
                    startTime: '09:00',
                    endTime: '17:30',
                },
                slotMinTime: '09:00:00',
                slotMaxTime: '17:30:00',
                dayCellDidMount: function(info) {
                    styleDayCell(info);
                },
                eventDidMount: function(info) {
                    styleEvent(info);
                },
                select: handleDateSelection,
                eventClick: handleEventClick,
                datesSet: function(info) {
                    const selectedYear = document.getElementById('selectYear').value;
                    markBankHolidays(selectedYear);
                    updateWorkingDays();
                }
            });

            calendar.render();
            markBankHolidays(document.getElementById('selectYear').value);
            addCustomStyles();
        } catch (error) {
            console.error('Calendar initialization error:', error);
            showError('Failed to initialize calendar');
        }
    }

    // Add custom CSS styles
    function addCustomStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            .fc-day-today {
                background: #f8f9fa !important;
                border: 2px solid #4285f4 !important;
            }

            .fc-day-weekend {
                background: #f8d7da !important;
                color: #721c24 !important;
            }

            .bank-holiday {
                background: #fff3cd !important;
                border: none !important;
                border-radius: 4px !important;
                font-weight: bold !important;
            }

            .pto-day {
                background: #d4edda !important;
                border: none !important;
                border-radius: 4px !important;
            }

            .fc-event {
                cursor: pointer;
                transition: transform 0.1s ease;
            }

            .fc-event:hover {
                transform: scale(1.02);
            }

            .fc-day-past {
                opacity: 0.7;
            }

            .working-day {
                background: #ffffff !important;
            }

            .leave-type-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 5px;
            }

            .tooltip {
                position: absolute;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
            }
        `;
        document.head.appendChild(styleSheet);
    }

    // Style individual day cells
    function styleDayCell(info) {
        const date = info.date;
        const cell = info.el;

        // Weekend styling
        if (isWeekend(date)) {
            cell.classList.add('fc-day-weekend');
            cell.style.cursor = 'not-allowed';
        }

        // Past days styling
        if (date < new Date()) {
            cell.classList.add('fc-day-past');
            cell.style.cursor = 'not-allowed';
        }

        // Bank holiday styling
        if (isBankHoliday(date)) {
            cell.classList.add('bank-holiday');
            cell.style.cursor = 'not-allowed';
        }

        // Working day styling
        if (isWorkingDay(date)) {
            cell.classList.add('working-day');
        }

        // Add hover tooltip
        cell.addEventListener('mouseover', (e) => showDayTooltip(e, date));
        cell.addEventListener('mouseout', hideDayTooltip);
    }

    // Style events
    function styleEvent(info) {
        const event = info.event;
        const element = info.el;

        // Add leave type indicator
        const leaveType = leaveTypes[event.extendedProps.leaveType] || leaveTypes.annual;
        element.style.backgroundColor = leaveType.color;
        element.style.borderColor = leaveType.color;
        element.style.color = leaveType.textColor;

        // Add tooltip
        element.addEventListener('mouseover', (e) => showEventTooltip(e, event));
        element.addEventListener('mouseout', hideEventTooltip);
    }

    // Enhanced date selection handler
    function handleDateSelection(info) {
        const startDate = info.start;
        const endDate = info.end;

        if (isInvalidDateRange(startDate, endDate)) {
            calendar.unselect();
            return;
        }

        // Show leave type selection dialog
        showLeaveTypeDialog(startDate, endDate);
    }

    // Leave type selection dialog
    function showLeaveTypeDialog(startDate, endDate) {
        const dialog = document.createElement('div');
        dialog.className = 'leave-type-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Select Leave Type</h3>
                ${Object.entries(leaveTypes).map(([key, type]) => `
                    <div class="leave-type-option" data-type="${key}">
                        <span class="leave-type-indicator" style="background-color: ${type.color}"></span>
                        ${type.title}
                    </div>
                `).join('')}
                <button class="dialog-close">Cancel</button>
            </div>
        `;

        document.body.appendChild(dialog);

        // Handle leave type selection
        dialog.querySelectorAll('.leave-type-option').forEach(option => {
            option.addEventListener('click', () => {
                const leaveType = option.dataset.type;
                addLeaveEvent(startDate, endDate, leaveType);
                dialog.remove();
                updateLeaveSummary();
            });
        });

        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            dialog.remove();
            calendar.unselect();
        });
    }

    // Add leave event to calendar
    function addLeaveEvent(start, end, leaveType) {
        const typeConfig = leaveTypes[leaveType];
        calendar.addEvent({
            title: typeConfig.title,
            start: start,
            end: end,
            allDay: true,
            backgroundColor: typeConfig.color,
            borderColor: typeConfig.color,
            textColor: typeConfig.textColor,
            extendedProps: {
                leaveType: leaveType
            }
        });
    }

    // Update working days calculation
    function updateWorkingDays() {
        const year = document.getElementById('selectYear').value;
        const workingDays = calculateWorkingDays(year);
        
        // Update UI with working days info
        const workingDaysInfo = document.getElementById('workingDaysInfo');
        if (workingDaysInfo) {
            workingDaysInfo.textContent = `Working Days in ${year}: ${workingDays}`;
        }
    }

    // Calculate working days for a year
    function calculateWorkingDays(year) {
        let workingDays = 0;
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            if (isWorkingDay(d)) {
                workingDays++;
            }
        }

        return workingDays;
    }

    // Utility functions...
    // (Keep all your existing utility functions and add these new ones)

    function showDayTooltip(event, date) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = getDateInfo(date);
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY + 10 + 'px';
        document.body.appendChild(tooltip);
    }

    function getDateInfo(date) {
        if (isWeekend(date)) return 'Weekend';
        if (isBankHoliday(date)) return 'Bank Holiday';
        if (isWorkingDay(date)) return 'Working Day';
        return 'Non-working Day';
    }

    // Initialize calendar
    initializeCalendar();

    // ... (keep the rest of your existing code)
});
