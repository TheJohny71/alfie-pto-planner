// Part 1 - Core Initialization and Setup
document.addEventListener('DOMContentLoaded', function() {
    // Global Variables and State Management
    let calendar;
    let currentStep = 1;
    const totalSteps = 3;
    let selectedHolidays = new Set();
    let holidayExtensions = new Map();
    let ptoEvents = new Map();
    let preferences = {
        preferredMonths: new Set(),
        notifications: true,
        autoSync: true,
        theme: 'dark'
    };
    
    // DOM Elements
    const welcomeScreen = document.getElementById('welcomeScreen');
    const appContainer = document.getElementById('appContainer');
    const setupModal = document.getElementById('setupModal');
    const prevStepBtn = document.getElementById('prevStep');
    const nextStepBtn = document.getElementById('nextStep');
    const closeSetupBtn = document.getElementById('closeSetup');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const setupPTOBtn = document.getElementById('setupPTOBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    // Configuration Constants
    const CONFIG = {
        MAX_PTO_DAYS: 50,
        MIN_NOTICE_DAYS: 14,
        MAX_CONSECUTIVE_DAYS: 15,
        WEEKEND_DAYS: [0, 6], // Sunday, Saturday
        YEARS_RANGE: {
            start: 2024,
            end: 2028
        }
    };

    // Bank Holidays Data Structure
    const bankHolidays = {
        2024: [
            { date: '2024-01-01', name: "New Year's Day" },
            { date: '2024-03-29', name: "Good Friday" },
            { date: '2024-04-01', name: "Easter Monday" },
            { date: '2024-05-06', name: "Early May Bank Holiday" },
            { date: '2024-05-27', name: "Spring Bank Holiday" },
            { date: '2024-08-26', name: "Summer Bank Holiday" },
            { date: '2024-12-25', name: "Christmas Day" },
            { date: '2024-12-26', name: "Boxing Day" }
        ],
        2025: [
            { date: '2025-01-01', name: "New Year's Day" },
            { date: '2025-04-18', name: "Good Friday" },
            { date: '2025-04-21', name: "Easter Monday" },
            { date: '2025-05-05', name: "Early May Bank Holiday" },
            { date: '2025-05-26', name: "Spring Bank Holiday" },
            { date: '2025-08-25', name: "Summer Bank Holiday" },
            { date: '2025-12-25', name: "Christmas Day" },
            { date: '2025-12-26', name: "Boxing Day" }
        ]
    };

    // Load Events Function (defined before calendar initialization)
    function loadEvents(fetchInfo, successCallback, failureCallback) {
        try {
            const events = [];
            const year = new Date(fetchInfo.start).getFullYear();
            
            // Add bank holidays
            if (bankHolidays[year]) {
                bankHolidays[year].forEach(holiday => {
                    if (selectedHolidays.has(holiday.date)) {
                        events.push({
                            title: holiday.name,
                            start: holiday.date,
                            allDay: true,
                            backgroundColor: 'var(--holiday-color)',
                            borderColor: 'var(--holiday-color)',
                            editable: false
                        });

                        // Add holiday extensions
                        const extension = holidayExtensions.get(holiday.date);
                        if (extension) {
                            const holidayDate = new Date(holiday.date);
                            let extensionDate;
                            
                            if (extension === 'before') {
                                extensionDate = new Date(holidayDate);
                                extensionDate.setDate(holidayDate.getDate() - 1);
                            } else if (extension === 'after') {
                                extensionDate = new Date(holidayDate);
                                extensionDate.setDate(holidayDate.getDate() + 1);
                            }

                            if (extensionDate) {
                                events.push({
                                    title: 'Holiday Extension',
                                    start: extensionDate.toISOString().split('T')[0],
                                    allDay: true,
                                    backgroundColor: 'var(--extension-color)',
                                    borderColor: 'var(--extension-color)',
                                    editable: false
                                });
                            }
                        }
                    }
                });
            }

            // Add PTO events
            ptoEvents.forEach(event => {
                events.push(event);
            });

            successCallback(events);
        } catch (error) {
            console.error('Error loading events:', error);
            if (failureCallback) failureCallback(error);
        }
    }

    // Initialize Calendar with Extended Configuration
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,multiMonthYear'
            },
            views: {
                multiMonthYear: {
                    type: 'multiMonth',
                    duration: { months: 12 }
                }
            },
            selectable: true,
            selectMirror: true,
            select: handleDateSelect,
            eventClick: handleEventClick,
            eventDidMount: handleEventMount,
            events: loadEvents,
            weekends: true,
            height: 'auto',
            validRange: {
                start: `${CONFIG.YEARS_RANGE.start}-01-01`,
                end: `${CONFIG.YEARS_RANGE.end}-12-31`
            },
            businessHours: {
                dows: [1, 2, 3, 4, 5]
            },
            dateClick: handleDateClick,
            datesSet: handleDatesSet,
            eventDrop: handleEventDrop,
            eventResize: handleEventResize,
            loading: handleLoading
        });
        
        calendar.render();
        initializeEventListeners();
        loadUserPreferences();
    }

    // Initialize Event Listeners
    function initializeEventListeners() {
        document.addEventListener('keydown', handleKeyboardShortcuts);
        window.addEventListener('resize', handleWindowResize);
        window.addEventListener('beforeunload', handleBeforeUnload);
    }
});
            // Part 2 - Event Handling and PTO Management
    function handleDateSelect(selectInfo) {
        const startDate = new Date(selectInfo.start);
        const endDate = new Date(selectInfo.end);
        
        // Validation checks
        if (!isValidDateSelection(startDate, endDate)) {
            calendar.unselect();
            return;
        }

        Swal.fire({
            title: 'Request PTO',
            html: `
                <div class="pto-request-form">
                    <div class="form-group">
                        <label>Start Date: ${formatDate(startDate)}</label>
                    </div>
                    <div class="form-group">
                        <label>End Date: ${formatDate(endDate)}</label>
                    </div>
                    <div class="form-group">
                        <label for="ptoNotes">Notes (optional):</label>
                        <textarea id="ptoNotes" class="swal2-textarea"></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Request PTO',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return {
                    notes: document.getElementById('ptoNotes').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                addPTOEvent(startDate, endDate, result.value.notes);
            }
        });

        calendar.unselect();
    }

    function isValidDateSelection(startDate, endDate) {
        // Check for weekends
        if (CONFIG.WEEKEND_DAYS.includes(startDate.getDay()) || 
            CONFIG.WEEKEND_DAYS.includes(endDate.getDay())) {
            showError('Cannot select weekends for PTO');
            return false;
        }

        // Check for bank holidays
        const selectedDateStr = startDate.toISOString().split('T')[0];
        const currentYear = startDate.getFullYear();
        const isHoliday = bankHolidays[currentYear]?.some(holiday => 
            holiday.date === selectedDateStr && selectedHolidays.has(holiday.date)
        );
        
        if (isHoliday) {
            showError('Cannot select bank holidays for PTO');
            return false;
        }

        // Check notice period
        const today = new Date();
        const noticePeriod = new Date(today.setDate(today.getDate() + CONFIG.MIN_NOTICE_DAYS));
        if (startDate < noticePeriod) {
            showError(`PTO must be requested at least ${CONFIG.MIN_NOTICE_DAYS} days in advance`);
            return false;
        }

        // Check consecutive days
        const daysDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (daysDifference > CONFIG.MAX_CONSECUTIVE_DAYS) {
            showError(`Cannot request more than ${CONFIG.MAX_CONSECUTIVE_DAYS} consecutive days`);
            return false;
        }

        // Check remaining PTO days
        const remainingDays = calculateRemainingPTODays();
        if (daysDifference > remainingDays) {
            showError(`Insufficient PTO days remaining. You have ${remainingDays} days available`);
            return false;
        }

        return true;
    }

    function addPTOEvent(startDate, endDate, notes = '') {
        const event = {
            title: 'PTO Day',
            start: startDate,
            end: endDate,
            allDay: true,
            backgroundColor: 'var(--pto-color)',
            borderColor: 'var(--pto-color)',
            extendedProps: {
                type: 'pto',
                notes: notes,
                requestDate: new Date().toISOString()
            }
        };

        calendar.addEvent(event);
        ptoEvents.set(startDate.toISOString().split('T')[0], event);
        updatePTOCount();
        saveToLocalStorage();
        
        if (preferences.notifications) {
            notifyPTOConfirmation(startDate, endDate);
        }
    }

    function handleEventClick(clickInfo) {
        const event = clickInfo.event;
        
        if (event.extendedProps.type === 'pto') {
            Swal.fire({
                title: 'PTO Details',
                html: `
                    <div class="event-details">
                        <p><strong>Date:</strong> ${formatDate(event.start)}</p>
                        <p><strong>Notes:</strong> ${event.extendedProps.notes || 'None'}</p>
                        <p><strong>Requested:</strong> ${formatDate(new Date(event.extendedProps.requestDate))}</p>
                    </div>
                `,
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: 'Edit',
                denyButtonText: 'Delete',
                cancelButtonText: 'Close'
            }).then((result) => {
                if (result.isDenied) {
                    deletePTOEvent(event);
                } else if (result.isConfirmed) {
                    editPTOEvent(event);
                }
            });
        }
    }

    function deletePTOEvent(event) {
        Swal.fire({
            title: 'Delete PTO',
            text: 'Are you sure you want to delete this PTO request?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                const dateStr = event.start.toISOString().split('T')[0];
                ptoEvents.delete(dateStr);
                event.remove();
                updatePTOCount();
                saveToLocalStorage();
                showSuccess('PTO request deleted successfully');
            }
        });
    }

    function editPTOEvent(event) {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        Swal.fire({
            title: 'Edit PTO',
            html: `
                <div class="pto-edit-form">
                    <div class="form-group">
                        <label>Start Date: ${formatDate(startDate)}</label>
                    </div>
                    <div class="form-group">
                        <label>End Date: ${formatDate(endDate)}</label>
                    </div>
                    <div class="form-group">
                        <label for="editPtoNotes">Notes:</label>
                        <textarea id="editPtoNotes" class="swal2-textarea">${event.extendedProps.notes || ''}</textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save Changes',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                return {
                    notes: document.getElementById('editPtoNotes').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                event.setExtendedProp('notes', result.value.notes);
                saveToLocalStorage();
                showSuccess('PTO request updated successfully');
            }
        });
    }
        // Part 3 - Wizard and Setup Management
    function updateWizardStep(direction) {
        const currentStepEl = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
        let newStep = currentStep + direction;
        
        if (newStep < 1 || newStep > totalSteps) return;
        
        // Validate current step before proceeding
        if (direction > 0 && !validateStep(currentStep)) {
            return;
        }
        
        // Save data from current step
        saveStepData(currentStep);
        
        // Load data for new step
        loadStepData(newStep);
        
        const newStepEl = document.querySelector(`.wizard-step[data-step="${newStep}"]`);
        
        // Animate step transition
        currentStepEl.dataset.state = 'hidden';
        newStepEl.dataset.state = 'visible';
        
        // Update progress indicator
        updateProgressIndicator(newStep);
        
        currentStep = newStep;
        
        // Update button states
        prevStepBtn.disabled = currentStep === 1;
        nextStepBtn.textContent = currentStep === totalSteps ? 'Finish' : 'Next';
    }

    function validateStep(step) {
        switch(step) {
            case 1:
                return validatePTOAllocation();
            case 2:
                return validateBankHolidays();
            case 3:
                return validatePreferences();
            default:
                return true;
        }
    }

    function validatePTOAllocation() {
        const totalPTO = parseInt(document.getElementById('totalPTOInput').value);
        const plannedPTO = parseInt(document.getElementById('plannedPTOInput').value);
        
        if (isNaN(totalPTO) || totalPTO < 0 || totalPTO > CONFIG.MAX_PTO_DAYS) {
            showError(`Please enter a valid number of PTO days (0-${CONFIG.MAX_PTO_DAYS})`);
            return false;
        }
        
        if (isNaN(plannedPTO) || plannedPTO < 0 || plannedPTO > totalPTO) {
            showError('Planned PTO cannot exceed total PTO');
            return false;
        }

        return true;
    }

    function validateBankHolidays() {
        // Ensure at least one bank holiday is selected if extensions are used
        if (holidayExtensions.size > 0 && selectedHolidays.size === 0) {
            showError('Please select at least one bank holiday when using extensions');
            return false;
        }

        // Validate extension conflicts
        for (const [holidayDate, extension] of holidayExtensions) {
            if (!validateHolidayExtension(holidayDate, extension)) {
                return false;
            }
        }

        return true;
    }

    function validatePreferences() {
        const selectedMonths = document.querySelectorAll('.month-selector input:checked');
        
        // Optional: Ensure at least one preferred month is selected
        if (selectedMonths.length === 0) {
            showWarning('Consider selecting at least one preferred month for better planning');
        }

        return true;
    }

    function saveStepData(step) {
        switch(step) {
            case 1:
                savePTOAllocation();
                break;
            case 2:
                saveBankHolidayPreferences();
                break;
            case 3:
                saveMonthPreferences();
                break;
        }
    }

    function loadStepData(step) {
        switch(step) {
            case 1:
                loadPTOAllocation();
                break;
            case 2:
                loadBankHolidayPreferences();
                break;
            case 3:
                loadMonthPreferences();
                break;
        }
    }

    function updateProgressIndicator(step) {
        const progressBar = document.querySelector('.setup-progress');
        if (progressBar) {
            const progress = ((step - 1) / (totalSteps - 1)) * 100;
            progressBar.style.width = `${progress}%`;
        }

        // Update step titles
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            indicator.classList.toggle('active', index + 1 === step);
            indicator.classList.toggle('completed', index + 1 < step);
        });
    }
        // Part 4 - Bank Holiday and UI Management
    function setupBankHolidays() {
        const container = document.querySelector('.bank-holidays-container');
        const template = document.querySelector('.bank-holiday-item[data-template]');
        container.innerHTML = ''; // Clear existing items
        
        const currentYear = parseInt(document.getElementById('yearSelect').value) || new Date().getFullYear();
        
        if (!bankHolidays[currentYear]) {
            container.innerHTML = '<p class="no-holidays">No bank holidays available for selected year</p>';
            return;
        }

        bankHolidays[currentYear].forEach(holiday => {
            const item = createBankHolidayItem(holiday, template);
            container.appendChild(item);
        });

        updateHolidayCount();
    }

    function createBankHolidayItem(holiday, template) {
        const item = template.cloneNode(true);
        item.removeAttribute('data-template');
        
        const checkbox = item.querySelector('.holiday-checkbox');
        const dateSpan = item.querySelector('.holiday-date');
        const nameSpan = item.querySelector('.holiday-name');
        const extension = item.querySelector('.holiday-extension');
        
        // Setup basic holiday information
        dateSpan.textContent = formatDate(holiday.date);
        nameSpan.textContent = holiday.name;
        
        // Set initial states
        checkbox.checked = selectedHolidays.has(holiday.date);
        extension.value = holidayExtensions.get(holiday.date) || 'none';
        extension.disabled = !checkbox.checked;

        // Add custom tooltip
        item.setAttribute('data-tooltip', `Click to manage ${holiday.name} preferences`);
        
        // Setup event listeners
        setupHolidayItemListeners(holiday, checkbox, extension);
        
        return item;
    }

    function setupHolidayItemListeners(holiday, checkbox, extension) {
        checkbox.addEventListener('change', () => {
            handleHolidayCheckboxChange(holiday, checkbox, extension);
        });
        
        extension.addEventListener('change', () => {
            handleHolidayExtensionChange(holiday, extension);
        });
    }

    function handleHolidayCheckboxChange(holiday, checkbox, extension) {
        if (checkbox.checked) {
            selectedHolidays.add(holiday.date);
            extension.disabled = false;
        } else {
            selectedHolidays.delete(holiday.date);
            holidayExtensions.delete(holiday.date);
            extension.value = 'none';
            extension.disabled = true;
        }
        
        updateHolidayCount();
        updateCalendarView();
        saveHolidayPreferences();
    }

    function handleHolidayExtensionChange(holiday, extension) {
        if (extension.value !== 'none') {
            holidayExtensions.set(holiday.date, extension.value);
        } else {
            holidayExtensions.delete(holiday.date);
        }
        
        validateHolidayExtension(holiday.date, extension.value);
        updateCalendarView();
        saveHolidayPreferences();
    }

    function validateHolidayExtension(holidayDate, extensionType) {
        const date = new Date(holidayDate);
        const extensionDate = new Date(date);
        
        if (extensionType === 'before') {
            extensionDate.setDate(date.getDate() - 1);
        } else if (extensionType === 'after') {
            extensionDate.setDate(date.getDate() + 1);
        }

        // Check for conflicts with existing PTO
        const extensionDateStr = extensionDate.toISOString().split('T')[0];
        if (ptoEvents.has(extensionDateStr)) {
            showError('Extension conflicts with existing PTO day');
            return false;
        }

        // Check for conflicts with other holiday extensions
        for (const [otherHoliday, otherExtension] of holidayExtensions) {
            if (otherHoliday !== holidayDate) {
                const otherDate = new Date(otherHoliday);
                const otherExtensionDate = new Date(otherDate);
                
                if (otherExtension === 'before') {
                    otherExtensionDate.setDate(otherDate.getDate() - 1);
                } else if (otherExtension === 'after') {
                    otherExtensionDate.setDate(otherDate.getDate() + 1);
                }

                if (extensionDate.getTime() === otherExtensionDate.getTime()) {
                    showError('Extension conflicts with another holiday extension');
                    return false;
                }
            }
        }

        return true;
    }

    function updateCalendarView() {
        if (calendar) {
            calendar.refetchEvents();
        }
    }
        // Part 5 - Utility Functions and Event Listeners
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function updatePTOCount() {
        const totalPTO = parseInt(document.getElementById('totalPTOInput').value) || 0;
        const usedPTO = calculateUsedPTODays();
        const remainingPTO = totalPTO - usedPTO;
        
        // Update summary card
        document.getElementById('totalPTO').textContent = totalPTO;
        document.getElementById('plannedPTO').textContent = usedPTO;
        document.getElementById('remainingPTO').textContent = remainingPTO;
        
        // Update progress bar if it exists
        const progressBar = document.querySelector('.pto-progress-bar');
        if (progressBar) {
            const progressPercentage = (usedPTO / totalPTO) * 100;
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.style.backgroundColor = getProgressColor(progressPercentage);
        }
    }

    function calculateUsedPTODays() {
        let totalDays = 0;
        ptoEvents.forEach(event => {
            const start = new Date(event.start);
            const end = new Date(event.end);
            const days = calculateBusinessDays(start, end);
            totalDays += days;
        });
        return totalDays;
    }

    function calculateBusinessDays(start, end) {
        let count = 0;
        const curDate = new Date(start);
        const endDate = new Date(end);
        
        while (curDate <= endDate) {
            const dayOfWeek = curDate.getDay();
            if (!CONFIG.WEEKEND_DAYS.includes(dayOfWeek)) {
                // Check if it's not a bank holiday
                const dateStr = curDate.toISOString().split('T')[0];
                const year = curDate.getFullYear();
                const isHoliday = bankHolidays[year]?.some(holiday => 
                    holiday.date === dateStr && selectedHolidays.has(holiday.date)
                );
                
                if (!isHoliday) {
                    count++;
                }
            }
            curDate.setDate(curDate.getDate() + 1);
        }
        return count;
    }

    function getProgressColor(percentage) {
        if (percentage < 50) return 'var(--pto-color)';
        if (percentage < 75) return 'var(--warning-color)';
        return 'var(--danger-color)';
    }

    function updateHolidayCount() {
        const bankHolidaysCount = document.getElementById('bankHolidays');
        if (bankHolidaysCount) {
            const count = selectedHolidays.size;
            bankHolidaysCount.textContent = count;
            
            // Update holiday allowance tooltip
            const tooltip = document.querySelector('.holiday-allowance-tooltip');
            if (tooltip) {
                tooltip.setAttribute('data-tooltip', 
                    `${count} bank holiday${count !== 1 ? 's' : ''} selected`
                );
            }
        }
    }

    function updateUpcomingHolidays() {
        const upcomingList = document.getElementById('upcomingHolidaysList');
        if (!upcomingList) return;

        const today = new Date();
        const currentYear = today.getFullYear();
        
        // Get all upcoming holidays from current and next year
        const upcomingHolidays = [...(bankHolidays[currentYear] || []), ...(bankHolidays[currentYear + 1] || [])]
            .filter(holiday => {
                const holidayDate = new Date(holiday.date);
                return holidayDate >= today && selectedHolidays.has(holiday.date);
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);
            
        if (upcomingHolidays.length === 0) {
            upcomingList.innerHTML = '<p class="no-holidays">No upcoming holidays selected</p>';
            return;
        }

        upcomingList.innerHTML = upcomingHolidays.map(holiday => `
            <div class="holiday-item">
                <div class="holiday-item-date">
                    <span class="holiday-date">${formatDate(holiday.date)}</span>
                    ${holidayExtensions.has(holiday.date) ? 
                        `<span class="holiday-extension-badge" data-extension="${holidayExtensions.get(holiday.date)}">
                            ${holidayExtensions.get(holiday.date) === 'before' ? '←' : '→'}
                        </span>` : ''
                    }
                </div>
                <span class="holiday-name">${holiday.name}</span>
            </div>
        `).join('');
    }
        // Part 6 - Month Selector and Preferences
    function setupMonthSelector() {
        const monthSelector = document.querySelector('.month-selector');
        if (!monthSelector) return;

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        
        // Create month selection grid
        monthSelector.innerHTML = `
            <div class="month-grid">
                ${months.map((month, index) => `
                    <div class="month-item ${preferences.preferredMonths.has(index) ? 'selected' : ''}">
                        <input type="checkbox" 
                            id="month-${month.toLowerCase()}" 
                            name="preferred-months" 
                            value="${index}"
                            ${preferences.preferredMonths.has(index) ? 'checked' : ''}>
                        <label for="month-${month.toLowerCase()}">
                            <span class="month-name">${month}</span>
                            <span class="month-stats" data-month="${index}">
                                <!-- Stats will be populated dynamically -->
                            </span>
                        </label>
                    </div>
                `).join('')}
            </div>
            <div class="month-preferences-footer">
                <button id="clearMonths" class="secondary-button">Clear All</button>
                <button id="defaultMonths" class="secondary-button">Reset to Default</button>
            </div>
        `;

        // Add event listeners
        setupMonthSelectorListeners();
        updateMonthStatistics();
    }

    function setupMonthSelectorListeners() {
        const monthSelector = document.querySelector('.month-selector');
        if (!monthSelector) return;

        // Individual month selection
        monthSelector.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const monthIndex = parseInt(e.target.value);
                if (e.target.checked) {
                    preferences.preferredMonths.add(monthIndex);
                } else {
                    preferences.preferredMonths.delete(monthIndex);
                }
                updateMonthStatistics();
                savePreferences();
            });
        });

        // Clear all months
        document.getElementById('clearMonths')?.addEventListener('click', () => {
            preferences.preferredMonths.clear();
            monthSelector.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            updateMonthStatistics();
            savePreferences();
        });

        // Reset to default months
        document.getElementById('defaultMonths')?.addEventListener('click', () => {
            const defaultMonths = new Set([6, 7, 8]); // July, August, September
            preferences.preferredMonths = new Set(defaultMonths);
            monthSelector.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = defaultMonths.has(parseInt(cb.value));
            });
            updateMonthStatistics();
            savePreferences();
        });
    }

    function updateMonthStatistics() {
        const currentYear = new Date().getFullYear();
        const monthStats = calculateMonthlyStats(currentYear);

        document.querySelectorAll('.month-stats').forEach(statElement => {
            const monthIndex = parseInt(statElement.dataset.month);
            const stats = monthStats[monthIndex];
            
            statElement.innerHTML = `
                <div class="month-stat-item" title="PTO Days">
                    <i class="fas fa-calendar-check"></i> ${stats.ptoDays}
                </div>
                <div class="month-stat-item" title="Bank Holidays">
                    <i class="fas fa-star"></i> ${stats.bankHolidays}
                </div>
            `;
        });
    }

    function calculateMonthlyStats(year) {
        const stats = Array(12).fill().map(() => ({
            ptoDays: 0,
            bankHolidays: 0
        }));

        // Calculate PTO days per month
        ptoEvents.forEach(event => {
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);
            if (startDate.getFullYear() === year) {
                const month = startDate.getMonth();
                stats[month].ptoDays += calculateBusinessDays(startDate, endDate);
            }
        });

        // Calculate bank holidays per month
        bankHolidays[year]?.forEach(holiday => {
            if (selectedHolidays.has(holiday.date)) {
                const month = new Date(holiday.date).getMonth();
                stats[month].bankHolidays++;
            }
        });

        return stats;
    }

    function savePreferences() {
        const preferencesData = {
            preferredMonths: Array.from(preferences.preferredMonths),
            notifications: preferences.notifications,
            autoSync: preferences.autoSync,
            theme: preferences.theme
        };
        
        localStorage.setItem('userPreferences', JSON.stringify(preferencesData));
    }

    function loadPreferences() {
        try {
            const savedPreferences = localStorage.getItem('userPreferences');
            if (savedPreferences) {
                const parsed = JSON.parse(savedPreferences);
                preferences.preferredMonths = new Set(parsed.preferredMonths);
                preferences.notifications = parsed.notifications ?? true;
                preferences.autoSync = parsed.autoSync ?? true;
                preferences.theme = parsed.theme ?? 'dark';
                
                applyPreferences();
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            showError('Failed to load preferences');
        }
    }

    function applyPreferences() {
        // Apply theme
        document.documentElement.setAttribute('data-theme', preferences.theme);
        
        // Update notification settings
        const notificationToggle = document.getElementById('notificationToggle');
        if (notificationToggle) {
            notificationToggle.checked = preferences.notifications;
        }
        
        // Update auto-sync settings
        const autoSyncToggle = document.getElementById('autoSyncToggle');
        if (autoSyncToggle) {
            autoSyncToggle.checked = preferences.autoSync;
        }
    }
        // Part 7 - Data Persistence and Storage
    function saveToLocalStorage() {
        const dataToSave = {
            ptoEvents: Array.from(ptoEvents.entries()),
            selectedHolidays: Array.from(selectedHolidays),
            holidayExtensions: Array.from(holidayExtensions.entries()),
            preferences: {
                preferredMonths: Array.from(preferences.preferredMonths),
                notifications: preferences.notifications,
                autoSync: preferences.autoSync,
                theme: preferences.theme
            },
            lastUpdated: new Date().toISOString()
        };

        try {
            localStorage.setItem('ptoPlanner', JSON.stringify(dataToSave));
            if (preferences.autoSync) {
                syncWithServer(dataToSave);
            }
        } catch (error) {
            console.error('Error saving data:', error);
            showError('Failed to save changes locally');
        }
    }

    function loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('ptoPlanner');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                
                // Restore PTO events
                ptoEvents = new Map(parsed.ptoEvents);
                
                // Restore holiday selections
                selectedHolidays = new Set(parsed.selectedHolidays);
                holidayExtensions = new Map(parsed.holidayExtensions);
                
                // Restore preferences
                if (parsed.preferences) {
                    preferences.preferredMonths = new Set(parsed.preferences.preferredMonths);
                    preferences.notifications = parsed.preferences.notifications;
                    preferences.autoSync = parsed.preferences.autoSync;
                    preferences.theme = parsed.preferences.theme;
                }

                // Update UI
                updatePTOCount();
                updateHolidayCount();
                updateUpcomingHolidays();
                applyPreferences();
                
                return true;
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
            showError('Failed to load saved data');
        }
        return false;
    }

    function syncWithServer(data) {
        // This is a placeholder for server synchronization
        // Implement your own server sync logic here
        console.log('Syncing with server:', data);
    }

    function exportData(format = 'json') {
        const dataToExport = {
            ptoEvents: Array.from(ptoEvents.entries()),
            selectedHolidays: Array.from(selectedHolidays),
            holidayExtensions: Array.from(holidayExtensions.entries()),
            preferences: {
                preferredMonths: Array.from(preferences.preferredMonths),
                notifications: preferences.notifications,
                autoSync: preferences.autoSync,
                theme: preferences.theme
            },
            exportDate: new Date().toISOString()
        };

        switch (format.toLowerCase()) {
            case 'json':
                return exportAsJSON(dataToExport);
            case 'csv':
                return exportAsCSV(dataToExport);
            case 'ical':
                return exportAsICal(dataToExport);
            default:
                throw new Error('Unsupported export format');
        }
    }

    function exportAsJSON(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, 'pto-planner-export.json');
    }

    function exportAsCSV(data) {
        let csv = 'Date,Type,Notes\n';
        
        // Add PTO events
        data.ptoEvents.forEach(([date, event]) => {
            csv += `${date},PTO,${event.extendedProps?.notes || ''}\n`;
        });
        
        // Add bank holidays
        data.selectedHolidays.forEach(date => {
            const holiday = findHolidayByDate(date);
            if (holiday) {
                csv += `${date},Bank Holiday,${holiday.name}\n`;
            }
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, 'pto-planner-export.csv');
    }

    function exportAsICal(data) {
        let ical = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Alfie PTO Planner//EN'
        ];

        // Add PTO events
        data.ptoEvents.forEach(([date, event]) => {
            ical.push('BEGIN:VEVENT');
            ical.push(`DTSTART:${formatDateForICal(event.start)}`);
            ical.push(`DTEND:${formatDateForICal(event.end)}`);
            ical.push('SUMMARY:PTO Day');
            if (event.extendedProps?.notes) {
                ical.push(`DESCRIPTION:${event.extendedProps.notes}`);
            }
            ical.push('END:VEVENT');
        });

        // Add bank holidays
        data.selectedHolidays.forEach(date => {
            const holiday = findHolidayByDate(date);
            if (holiday) {
                ical.push('BEGIN:VEVENT');
                ical.push(`DTSTART:${formatDateForICal(date)}`);
                ical.push(`DTEND:${formatDateForICal(date)}`);
                ical.push(`SUMMARY:${holiday.name}`);
                ical.push('END:VEVENT');
            }
        });

        ical.push('END:VCALENDAR');

        const blob = new Blob([ical.join('\r\n')], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, 'pto-planner-export.ics');
    }
        // Part 8 - Analytics and Reporting
    function generateAnalytics() {
        const analytics = {
            summary: calculatePTOSummary(),
            monthlyDistribution: calculateMonthlyDistribution(),
            patterns: analyzePTOPatterns(),
            recommendations: generateRecommendations()
        };

        updateAnalyticsDisplay(analytics);
        return analytics;
    }

    function calculatePTOSummary() {
        const currentYear = new Date().getFullYear();
        const totalPTO = parseInt(document.getElementById('totalPTOInput').value) || 0;
        const usedPTO = calculateUsedPTODays();
        const remainingPTO = totalPTO - usedPTO;
        const selectedBankHolidays = selectedHolidays.size;
        const holidayExtensionsCount = holidayExtensions.size;

        return {
            year: currentYear,
            totalPTO,
            usedPTO,
            remainingPTO,
            selectedBankHolidays,
            holidayExtensionsCount,
            utilizationRate: (usedPTO / totalPTO) * 100
        };
    }

    function calculateMonthlyDistribution() {
        const distribution = Array(12).fill(0);
        
        ptoEvents.forEach(event => {
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);
            const days = calculateBusinessDays(startDate, endDate);
            distribution[startDate.getMonth()] += days;
        });

        return distribution;
    }

    function analyzePTOPatterns() {
        const patterns = {
            preferredDays: analyzePreferredDays(),
            commonDurations: analyzeCommonDurations(),
            adjacentToWeekends: calculateWeekendAdjacency(),
            holidayExtensionPreferences: analyzeHolidayExtensions()
        };

        return patterns;
    }

    function analyzePreferredDays() {
        const dayPreferences = Array(5).fill(0); // Monday to Friday
        
        ptoEvents.forEach(event => {
            const startDate = new Date(event.start);
            const dayOfWeek = startDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
                dayPreferences[dayOfWeek - 1]++;
            }
        });

        return dayPreferences;
    }

    function analyzeCommonDurations() {
        const durations = new Map(); // duration -> count
        
        ptoEvents.forEach(event => {
            const days = calculateBusinessDays(new Date(event.start), new Date(event.end));
            durations.set(days, (durations.get(days) || 0) + 1);
        });

        return Array.from(durations.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3); // Top 3 most common durations
    }

    function calculateWeekendAdjacency() {
        let adjacentCount = 0;
        
        ptoEvents.forEach(event => {
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);
            
            // Check if PTO is adjacent to weekend
            if (startDate.getDay() === 1 || endDate.getDay() === 5) {
                adjacentCount++;
            }
        });

        return {
            count: adjacentCount,
            percentage: (adjacentCount / ptoEvents.size) * 100
        };
    }

    function analyzeHolidayExtensions() {
        const extensions = {
            before: 0,
            after: 0
        };

        holidayExtensions.forEach(type => {
            extensions[type]++;
        });

        return extensions;
    }

    function generateRecommendations() {
        const recommendations = [];
        const summary = calculatePTOSummary();
        const distribution = calculateMonthlyDistribution();
        
        // Check PTO utilization
        if (summary.utilizationRate < 50) {
            recommendations.push({
                type: 'warning',
                message: 'You have used less than 50% of your PTO. Consider planning some time off.',
                priority: 'high'
            });
        }

        // Check monthly distribution
        const maxMonthlyPTO = Math.max(...distribution);
        const monthIndex = distribution.indexOf(maxMonthlyPTO);
        if (maxMonthlyPTO > summary.totalPTO * 0.4) {
            recommendations.push({
                type: 'info',
                message: `You have allocated a large portion of PTO to ${getMonthName(monthIndex)}. Consider spreading your PTO throughout the year.`,
                priority: 'medium'
            });
        }

        // Check holiday extension opportunities
        if (selectedHolidays.size > holidayExtensions.size) {
            recommendations.push({
                type: 'suggestion',
                message: 'You have bank holidays without extensions. Consider extending them to maximize your time off.',
                priority: 'low'
            });
        }

        return recommendations;
    }

    function updateAnalyticsDisplay(analytics) {
        const analyticsContainer = document.querySelector('.analytics-container');
        if (!analyticsContainer) return;

        analyticsContainer.innerHTML = `
            <div class="analytics-summary">
                <h3>PTO Summary</h3>
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-label">Utilization Rate</span>
                        <span class="stat-value">${analytics.summary.utilizationRate.toFixed(1)}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Bank Holidays</span>
                        <span class="stat-value">${analytics.summary.selectedBankHolidays}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Extensions</span>
                        <span class="stat-value">${analytics.summary.holidayExtensionsCount}</span>
                    </div>
                </div>
            </div>
            ${generateMonthlyChart(analytics.monthlyDistribution)}
            ${generateRecommendationsHTML(analytics.recommendations)}
        `;

        // Initialize charts if using a charting library
        initializeCharts(analytics);
    }
        // Part 9 - Error Handling and Notifications
    function showError(message, title = 'Error') {
        Swal.fire({
            title: title,
            text: message,
            icon: 'error',
            confirmButtonText: 'OK',
            customClass: {
                container: 'error-alert'
            }
        });
    }

    function showWarning(message, title = 'Warning') {
        Swal.fire({
            title: title,
            text: message,
            icon: 'warning',
            confirmButtonText: 'OK',
            customClass: {
                container: 'warning-alert'
            }
        });
    }

    function showSuccess(message, title = 'Success') {
        Swal.fire({
            title: title,
            text: message,
            icon: 'success',
            confirmButtonText: 'OK',
            timer: 2000,
            customClass: {
                container: 'success-alert'
            }
        });
    }

        function handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        // Log error to analytics or error tracking service
        if (typeof errorTrackingService !== 'undefined') {
            errorTrackingService.logError(error, context);
        }

        // Show user-friendly error message
        let userMessage = 'An unexpected error occurred. Please try again.';
        
        if (error instanceof PTOValidationError) {
            userMessage = error.message;
        } else if (error instanceof StorageError) {
            userMessage = 'Unable to save your changes. Please check your browser settings.';
        } else if (error instanceof NetworkError) {
            userMessage = 'Unable to connect to the server. Please check your internet connection.';
        }

        showError(userMessage);
    }

    // Custom Error Classes
    class PTOValidationError extends Error {
        constructor(message) {
            super(message);
            this.name = 'PTOValidationError';
        }
    }

    class StorageError extends Error {
        constructor(message) {
            super(message);
            this.name = 'StorageError';
        }
    }

    class NetworkError extends Error {
        constructor(message) {
            super(message);
            this.name = 'NetworkError';
        }
    }

    // Notification System
    function notifyUser(message, type = 'info', duration = 5000) {
        if (!preferences.notifications) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        const container = document.querySelector('.notification-container') || 
            createNotificationContainer();

        container.appendChild(notification);

        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after duration
        setTimeout(() => {
            notification.classList.add('notification-fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    function createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    function notifyPTOConfirmation(startDate, endDate) {
        const days = calculateBusinessDays(startDate, endDate);
        notifyUser(
            `PTO request for ${days} day${days !== 1 ? 's' : ''} starting ${formatDate(startDate)} has been saved.`,
            'success'
        );
    }

    function notifyHolidayExtension(holiday, extensionType) {
        notifyUser(
            `Holiday extension ${extensionType} ${holiday.name} has been added.`,
            'info'
        );
    }

    function notifyPTOReminder() {
        const remainingDays = calculateRemainingPTODays();
        const currentMonth = new Date().getMonth();
        const isLastQuarter = currentMonth >= 9; // October or later

        if (isLastQuarter && remainingDays > 5) {
            notifyUser(
                `You still have ${remainingDays} PTO days remaining this year. Don't forget to use them!`,
                'warning',
                10000
            );
        }
    }

    // Error Boundary
    function wrapWithErrorBoundary(fn, context) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                handleError(error, context);
                throw error; // Re-throw for upstream handling if needed
            }
        };
    }
        // Part 10 - Helper Functions and Initialization
    function getMonthName(monthIndex) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    }

    function formatDateForICal(date) {
        const d = new Date(date);
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    function downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function findHolidayByDate(date) {
        const year = date.split('-')[0];
        return bankHolidays[year]?.find(holiday => holiday.date === date);
    }

    function handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + S to save
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            saveToLocalStorage();
            notifyUser('Changes saved successfully', 'success');
        }

        // Esc to close modals
        if (event.key === 'Escape') {
            const visibleModal = document.querySelector('.modal[style*="display: flex"]');
            if (visibleModal) {
                visibleModal.style.display = 'none';
            }
        }
    }

    function handleWindowResize() {
        if (calendar) {
            calendar.updateSize();
        }
    }

    function handleBeforeUnload(event) {
        // Check if there are unsaved changes
        const hasUnsavedChanges = checkForUnsavedChanges();
        if (hasUnsavedChanges) {
            event.preventDefault();
            event.returnValue = '';
            return '';
        }
    }

    function checkForUnsavedChanges() {
        // Implementation depends on your change tracking mechanism
        return false; // Placeholder
    }

    function handleLoading(isLoading) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'flex' : 'none';
        }
    }

    function handleDatesSet(dateInfo) {
        const currentDate = calendar.getDate();
        const yearSelect = document.getElementById('yearSelect');
        if (yearSelect) {
            yearSelect.value = currentDate.getFullYear();
        }
        updateMonthStatistics();
    }

    function handleEventDrop(info) {
        const event = info.event;
        const newStart = event.start;
        const newEnd = event.end || newStart;

        if (!isValidDateSelection(newStart, newEnd)) {
            info.revert();
            return;
        }

        updatePTOEvent(event);
    }

    function handleEventResize(info) {
        const event = info.event;
        const newStart = event.start;
        const newEnd = event.end;

        if (!isValidDateSelection(newStart, newEnd)) {
            info.revert();
            return;
        }

        updatePTOEvent(event);
    }

    function handleEventMount(info) {
        // Add tooltips or additional styling to events
        const event = info.event;
        if (event.extendedProps.type === 'pto') {
            info.el.setAttribute('data-tooltip', 
                `PTO: ${formatDate(event.start)} - ${formatDate(event.end)}`);
        }
    }

    function handleDateClick(info) {
        // Handle single date clicks (different from date selection)
        const clickedDate = info.date;
        showDateInfo(clickedDate);
    }

    function showDateInfo(date) {
        const dateStr = date.toISOString().split('T')[0];
        const holiday = findHolidayByDate(dateStr);
        const ptoEvent = ptoEvents.get(dateStr);

        let infoHTML = `<h3>${formatDate(date)}</h3>`;
        if (holiday && selectedHolidays.has(dateStr)) {
            infoHTML += `<p>Bank Holiday: ${holiday.name}</p>`;
            if (holidayExtensions.has(dateStr)) {
                infoHTML += `<p>Holiday Extension: ${holidayExtensions.get(dateStr)}</p>`;
            }
        }
        if (ptoEvent) {
            infoHTML += `<p>PTO Day</p>`;
            if (ptoEvent.extendedProps?.notes) {
                infoHTML += `<p>Notes: ${ptoEvent.extendedProps.notes}</p>`;
            }
        }

        Swal.fire({
            title: 'Date Information',
            html: infoHTML,
            icon: 'info'
        });
    }

    // Initialize the application
    function initialize() {
        try {
            loadFromLocalStorage();
            initializeCalendar();
            setupMonthSelector();
            updatePTOCount();
            updateHolidayCount();
            updateUpcomingHolidays();
            generateAnalytics();
            
            // Set up periodic reminders
            setInterval(notifyPTOReminder, 24 * 60 * 60 * 1000); // Daily check
            
            // Initial reminder check
            notifyPTOReminder();
        } catch (error) {
            handleError(error, 'initialization');
        }
    }

    // Start the application
    initialize();
});
