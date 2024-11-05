class PTOPlanner {
    constructor() {
        this.calendar = null;
        this.leaveData = {
            total: 25,
            used: 0,
            remaining: 25,
            requests: []
        };
        this.settings = {
            darkMode: false,
            department: 'General',
            yearlyAllowance: 25,
            bankHolidays: true
        };

        this.initializeApp();
    }

    initializeApp() {
        // Load saved data
        this.loadSavedData();
        
        // Initialize UI
        this.initializeUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize calendar
        this.calendar = this.initializeCalendar();
        
        // Fetch bank holidays if enabled
        if (this.settings.bankHolidays) {
            this.fetchBankHolidays();
        }

        // Initialize charts
        this.initializeCharts();
    }

    loadSavedData() {
        const savedLeaveData = localStorage.getItem('leaveData');
        const savedSettings = localStorage.getItem('settings');

        if (savedLeaveData) {
            this.leaveData = JSON.parse(savedLeaveData);
        }
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
        }
    }

    initializeUI() {
        // Update stats display
        this.updateLeaveStats();
        
        // Show welcome screen if first visit
        const isFirstVisit = !localStorage.getItem('hasVisited');
        if (isFirstVisit) {
            document.getElementById('welcome-screen').classList.remove('hidden');
            localStorage.setItem('hasVisited', 'true');
        } else {
            document.getElementById('app').classList.remove('hidden');
        }

        // Set department display
        document.getElementById('department-display').textContent = this.settings.department;
        
        // Apply dark mode if enabled
        if (this.settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    setupEventListeners() {
        // Welcome screen
        document.getElementById('start-setup').addEventListener('click', () => {
            document.getElementById('welcome-screen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
        });

        // Leave request modal
        document.getElementById('request-leave').addEventListener('click', () => {
            document.getElementById('leave-request-modal').style.display = 'block';
        });

        // Settings modal
        document.getElementById('settings-btn').addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'block';
        });

        // Dark mode toggle
        document.getElementById('dark-mode-toggle').addEventListener('click', () => {
            this.settings.darkMode = !this.settings.darkMode;
            document.documentElement.setAttribute('data-theme', this.settings.darkMode ? 'dark' : 'light');
            this.saveSettings();
        });

        // Close modals
        document.querySelectorAll('.close-modal, .cancel-request, .cancel-settings').forEach(element => {
            element.addEventListener('click', () => {
                document.getElementById('leave-request-modal').style.display = 'none';
                document.getElementById('settings-modal').style.display = 'none';
            });
        });

        // Form submissions
        document.getElementById('leave-request-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLeaveRequest();
        });

        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSettingsUpdate();
        });
    }

    initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        return new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            selectable: true,
            editable: true,
            events: this.leaveData.requests.map(request => ({
                title: `${request.type} Leave`,
                start: request.startDate,
                end: request.endDate,
                backgroundColor: this.getEventColor(request.type)
            })),
            select: (info) => {
                document.getElementById('start-date').value = info.startStr;
                document.getElementById('end-date').value = info.endStr;
                document.getElementById('leave-request-modal').style.display = 'block';
            }
        });
    }

    async fetchBankHolidays() {
        try {
            const response = await fetch('https://www.gov.uk/bank-holidays.json');
            const data = await response.json();
            const holidays = data['england-and-wales'].events.map(holiday => ({
                title: `Bank Holiday - ${holiday.title}`,
                start: holiday.date,
                display: 'background',
                backgroundColor: '#e3f2fd'
            }));
            this.calendar.addEventSource(holidays);
        } catch (error) {
            this.showNotification('Failed to fetch bank holidays', 'error');
        }
    }

    handleLeaveRequest() {
        const form = document.getElementById('leave-request-form');
        const formData = new FormData(form);

        const request = {
            type: formData.get('leave-type'),
            startDate: formData.get('start-date'),
            endDate: formData.get('end-date'),
            notes: formData.get('notes'),
            category: formData.get('category'),
            department: this.settings.department
        };

        // Validate request
        if (this.validateLeaveRequest(request)) {
            this.leaveData.requests.push(request);
            this.updateLeaveStats();
            this.saveData();
            this.calendar.addEvent({
                title: `${request.type} Leave`,
                start: request.startDate,
                end: request.endDate,
                backgroundColor: this.getEventColor(request.type)
            });
            this.showNotification('Leave request submitted successfully', 'success');
            form.reset();
            document.getElementById('leave-request-modal').style.display = 'none';
        }
    }

    handleSettingsUpdate() {
        const form = document.getElementById('settings-form');
        const formData = new FormData(form);

        this.settings.department = formData.get('department');
        this.settings.yearlyAllowance = parseInt(formData.get('yearlyAllowance'));
        this.settings.bankHolidays = formData.get('bankHolidays') === 'on';

        this.saveSettings();
        document.getElementById('department-display').textContent = this.settings.department;
        document.getElementById('settings-modal').style.display = 'none';
        this.showNotification('Settings updated successfully', 'success');
    }

    validateLeaveRequest(request) {
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);

        if (endDate < startDate) {
            this.showNotification('End date cannot be before start date', 'error');
            return false;
        }

        const daysRequested = this.calculateBusinessDays(startDate, endDate);
        if (daysRequested > this.leaveData.remaining) {
            this.showNotification('Insufficient leave days remaining', 'error');
            return false;
        }

        return true;
    }

    calculateBusinessDays(start, end) {
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            if (current.getDay() !== 0 && current.getDay() !== 6) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    }

    getEventColor(type) {
        const colors = {
            annual: '#4a90e2',
            sick: '#dc3545',
            compassionate: '#28a745',
            'bank-holiday': '#ffc107'
        };
        return colors[type] || '#4a90e2';
    }

    updateLeaveStats() {
        document.getElementById('total-leave').textContent = this.leaveData.total;
        document.getElementById('used-leave').textContent = this.leaveData.used;
        document.getElementById('remaining-leave').textContent = this.leaveData.remaining;
    }

    showNotification(message, type) {
        Swal.fire({
            text: message,
            icon: type,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    }

    saveData() {
        localStorage.setItem('leaveData', JSON.stringify(this.leaveData));
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    initializeCharts() {
        // Leave distribution chart
        const distributionCtx = document.getElementById('leaveDistributionChart').getContext('2d');
        new Chart(distributionCtx, {
            type: 'pie',
            data: {
                labels: ['Used', 'Remaining'],
                datasets: [{
                    data: [this.leaveData.used, this.leaveData.remaining],
                    backgroundColor: ['#4a90e2', '#28a745']
                }]
            }
        });

        // Department stats chart
        const statsCtx = document.getElementById('departmentStatsChart').getContext('2d');
        new Chart(statsCtx, {
            type: 'bar',
            data: {
                labels: ['Annual', 'Sick', 'Compassionate', 'Bank Holiday'],
                datasets: [{
                    label: 'Leave Days by Type',
                    data: this.calculateLeaveTypeStats(),
                    backgroundColor: ['#4a90e2', '#dc3545', '#28a745', '#ffc107']
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    calculateLeaveTypeStats() {
        const stats = {
            annual: 0,
            sick: 0,
            compassionate: 0,
            'bank-holiday': 0
        };

        this.leaveData.requests.forEach(request => {
            const days = this.calculateBusinessDays(new Date(request.startDate), new Date(request.endDate));
            stats[request.type] += days;
        });

        return Object.values(stats);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.ptoPlanner = new PTOPlanner();
});
