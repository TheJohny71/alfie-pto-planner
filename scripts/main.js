// Import from CDN URLs
// Change these lines at the top of main.js
import { Calendar } from 'https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.10/+esm';
import dayGridPlugin from 'https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid@6.1.10/+esm';

// Update the calendar initialization to use dayGridPlugin
this.calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin],  // Change this line
    initialView: 'dayGridMonth',
    // ... rest of the options
});

// Global library references
const Swal = window.Swal;
const Chart = window.Chart;

class PTOPlanner {
    constructor() {
        this.calendar = null;
        this.leaveData = {
            total: 25, // Default value
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
        this.loadSavedData();
        this.initializeUI();
        this.setupEventListeners();
        this.initializeCalendar();
        this.initializeCharts();
        
        if (this.settings.bankHolidays) {
            this.fetchBankHolidays();
        }
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
        this.updateLeaveStats();
        
        const isFirstVisit = !localStorage.getItem('hasVisited');
        if (isFirstVisit) {
            const welcomeScreen = document.getElementById('welcome-screen');
            welcomeScreen?.classList.remove('hidden');
            localStorage.setItem('hasVisited', 'true');
        } else {
            document.getElementById('app')?.classList.remove('hidden');
        }

        // Set initial dark mode
        if (this.settings.darkMode) {
            document.body.setAttribute('data-theme', 'dark');
            document.getElementById('dark-mode-toggle').textContent = '☀️';
        }

        // Update department display
        document.getElementById('department-display').textContent = this.settings.department;
    }

    setupEventListeners() {
        // Welcome screen
        document.getElementById('start-setup')?.addEventListener('click', () => {
            document.getElementById('welcome-screen')?.classList.add('hidden');
            document.getElementById('app')?.classList.remove('hidden');
        });

        // Dark mode toggle
        document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // Leave request button
        document.getElementById('request-leave')?.addEventListener('click', () => {
            this.openLeaveRequestModal();
        });

        // Settings button
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.openSettingsModal();
        });

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });

        // Leave request form
        document.getElementById('leave-request-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLeaveRequest();
        });

        // Settings form
        document.getElementById('settings-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Cancel buttons
        document.querySelector('.cancel-request')?.addEventListener('click', () => {
            document.getElementById('leave-request-modal').style.display = 'none';
        });

        document.querySelector('.cancel-settings')?.addEventListener('click', () => {
            document.getElementById('settings-modal').style.display = 'none';
        });
    }

    initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        this.calendar = new Calendar(calendarEl, {
            plugins: [DayGrid],
            initialView: 'dayGridMonth',
            events: this.getCalendarEvents(),
            selectable: true,
            select: (info) => {
                this.openLeaveRequestModal(info.start, info.end);
            }
        });

        this.calendar.render();
    }

    getCalendarEvents() {
        return this.leaveData.requests.map(request => ({
            title: request.type,
            start: request.startDate,
            end: request.endDate,
            backgroundColor: this.getEventColor(request.type)
        }));
    }

    getEventColor(type) {
        const colors = {
            annual: '#4CAF50',
            sick: '#F44336',
            compassionate: '#2196F3',
            'bank-holiday': '#9C27B0'
        };
        return colors[type] || '#757575';
    }

    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        document.body.setAttribute('data-theme', this.settings.darkMode ? 'dark' : 'light');
        document.getElementById('dark-mode-toggle').textContent = this.settings.darkMode ? '☀️' : '🌙';
        this.saveSettings();
    }

    openLeaveRequestModal(start = null, end = null) {
        const modal = document.getElementById('leave-request-modal');
        if (!modal) return;

        if (start && end) {
            document.getElementById('start-date').value = start.toISOString().split('T')[0];
            document.getElementById('end-date').value = end.toISOString().split('T')[0];
        }

        modal.style.display = 'block';
    }

    handleLeaveRequest() {
        const form = document.getElementById('leave-request-form');
        const formData = new FormData(form);

        const request = {
            type: formData.get('leave-type'),
            startDate: formData.get('start-date'),
            endDate: formData.get('end-date'),
            category: formData.get('category'),
            notes: formData.get('notes'),
            status: 'pending'
        };

        if (this.validateRequest(request)) {
            this.leaveData.requests.push(request);
            this.updateLeaveStats();
            this.saveLeaveData();
            this.updateCalendar();
            
            document.getElementById('leave-request-modal').style.display = 'none';
            form.reset();

            Swal.fire({
                title: 'Success!',
                text: 'Leave request submitted successfully',
                icon: 'success'
            });
        }
    }

    validateRequest(request) {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);

        if (end < start) {
            Swal.fire({
                title: 'Error!',
                text: 'End date cannot be before start date',
                icon: 'error'
            });
            return false;
        }

        // Add more validation as needed

        return true;
    }

    updateLeaveStats() {
        document.getElementById('total-leave').textContent = this.leaveData.total;
        document.getElementById('used-leave').textContent = this.leaveData.used;
        document.getElementById('remaining-leave').textContent = this.leaveData.remaining;
    }

    saveLeaveData() {
        localStorage.setItem('leaveData', JSON.stringify(this.leaveData));
    }

    updateCalendar() {
        if (this.calendar) {
            this.calendar.removeAllEvents();
            this.calendar.addEventSource(this.getCalendarEvents());
        }
    }

    openSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (!modal) return;

        // Populate current settings
        document.getElementById('department-select').value = this.settings.department;
        document.getElementById('yearly-allowance').value = this.settings.yearlyAllowance;
        document.getElementById('bank-holidays').checked = this.settings.bankHolidays;

        modal.style.display = 'block';
    }

    saveSettings() {
        const form = document.getElementById('settings-form');
        const formData = new FormData(form);

        this.settings = {
            ...this.settings,
            department: formData.get('department'),
            yearlyAllowance: parseInt(formData.get('yearlyAllowance')),
            bankHolidays: formData.get('bankHolidays') === 'on'
        };

        this.saveSettingsToStorage();
        document.getElementById('settings-modal').style.display = 'none';
        this.updateUI();
    }

    saveSettingsToStorage() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    updateUI() {
        document.getElementById('department-display').textContent = this.settings.department;
        this.leaveData.total = this.settings.yearlyAllowance;
        this.updateLeaveStats();
        this.saveLeaveData();
    }

    async fetchBankHolidays() {
        try {
            const response = await fetch('https://www.gov.uk/bank-holidays.json');
            const data = await response.json();
            // Process bank holidays data
        } catch (error) {
            console.error('Failed to fetch bank holidays:', error);
        }
    }

    initializeCharts() {
        this.initializeLeaveDistributionChart();
        this.initializeLeaveTypeChart();
    }

    initializeLeaveDistributionChart() {
        const ctx = document.getElementById('leaveDistributionChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Used', 'Remaining'],
                datasets: [{
                    data: [this.leaveData.used, this.leaveData.remaining],
                    backgroundColor: ['#F44336', '#4CAF50']
                }]
            }
        });
    }

    initializeLeaveTypeChart() {
        const ctx = document.getElementById('departmentStatsChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Annual', 'Sick', 'Compassionate', 'Bank Holiday'],
                datasets: [{
                    label: 'Leave Days by Type',
                    data: this.calculateLeaveTypeStats(),
                    backgroundColor: ['#4CAF50', '#F44336', '#2196F3', '#9C27B0']
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
            const start = new Date(request.startDate);
            const end = new Date(request.endDate);
            const days = this.calculateBusinessDays(start, end);
            stats[request.type] += days;
        });

        return Object.values(stats);
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

    exportData(format) {
        console.log(`Exporting data in ${format} format`);
        // Implement export functionality
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.ptoPlanner = new PTOPlanner();
});

// Add this to make TypeScript happy about the global ptoPlanner variable
if (typeof window !== 'undefined') {
    window.ptoPlanner = window.ptoPlanner || {};
}