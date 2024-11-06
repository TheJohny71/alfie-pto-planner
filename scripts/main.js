// Add at the top of the file
import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';
import { CalendarService } from './utils/calendar';
import { StorageService } from './utils/storage';
import { CONFIG } from './utils/config';
class PTOPlanner {
    constructor() {
        this.calendar = null;
        this.leaveData = {
            total: CONFIG.DEFAULT_LEAVE_DAYS,
            used: 0,
            remaining: CONFIG.DEFAULT_LEAVE_DAYS,
            requests: []
        };
        this.settings = {
            darkMode: false,
            department: 'General',
            yearlyAllowance: CONFIG.DEFAULT_LEAVE_DAYS,
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
        const savedLeaveData = StorageService.getLeaveData();
        const savedSettings = StorageService.getSettings();
        if (savedLeaveData) {
            this.leaveData = savedLeaveData;
        }
        if (savedSettings) {
            this.settings = savedSettings;
        }
    }
    initializeUI() {
        this.updateLeaveStats();
        const isFirstVisit = !StorageService.hasVisited();
        if (isFirstVisit) {
            const welcomeScreen = document.getElementById('welcome-screen');
            welcomeScreen?.classList.remove('hidden');
            StorageService.setHasVisited();
        }
        else {
            const appContainer = document.getElementById('app');
            appContainer?.classList.remove('hidden');
        }
        const departmentDisplay = document.getElementById('department-display');
        if (departmentDisplay) {
            departmentDisplay.textContent = this.settings.department;
        }
        if (this.settings.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
    setupEventListeners() {
        // Welcome screen
        document.getElementById('start-setup')?.addEventListener('click', () => {
            document.getElementById('welcome-screen')?.classList.add('hidden');
            document.getElementById('app')?.classList.remove('hidden');
        });
        // Leave request modal
        document.getElementById('request-leave')?.addEventListener('click', () => {
            const modal = document.getElementById('leave-request-modal');
            if (modal)
                modal.style.display = 'block';
        });
        // Settings modal
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            const modal = document.getElementById('settings-modal');
            if (modal)
                modal.style.display = 'block';
        });
        // Dark mode toggle
        document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
            this.settings.darkMode = !this.settings.darkMode;
            document.documentElement.setAttribute('data-theme', this.settings.darkMode ? 'dark' : 'light');
            this.saveSettings();
        });
        // Close modals
        document.querySelectorAll('.close-modal, .cancel-request, .cancel-settings').forEach(element => {
            element.addEventListener('click', () => {
                const leaveModal = document.getElementById('leave-request-modal');
                const settingsModal = document.getElementById('settings-modal');
                if (leaveModal)
                    leaveModal.style.display = 'none';
                if (settingsModal)
                    settingsModal.style.display = 'none';
            });
        });
        // Form submissions
        document.getElementById('leave-request-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLeaveRequest();
        });
        document.getElementById('settings-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSettingsUpdate();
        });
    }
    initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl)
            return;
        this.calendar = CalendarService.initializeCalendar(calendarEl, this.leaveData.requests, (start, end) => {
            this.openLeaveRequestModal(start, end);
        });
        this.calendar.render();
    }
    async fetchBankHolidays() {
        try {
            const response = await fetch(CONFIG.API_ENDPOINTS.BANK_HOLIDAYS);
            const data = await response.json();
            const holidays = data['england-and-wales'].events.map((holiday) => ({
                title: `Bank Holiday - ${holiday.title}`,
                start: holiday.date,
                end: holiday.date,
                display: 'background',
                backgroundColor: CONFIG.COLORS['bank-holiday']
            }));
            this.calendar?.addEventSource(holidays);
        }
        catch (error) {
            this.showNotification('Failed to fetch bank holidays', 'error');
        }
    }
    handleLeaveRequest() {
        const form = document.getElementById('leave-request-form');
        const formData = new FormData(form);
        const request = {
            id: crypto.randomUUID(),
            type: formData.get('leave-type'),
            startDate: formData.get('start-date'),
            endDate: formData.get('end-date'),
            notes: formData.get('notes'),
            category: formData.get('category'),
            department: this.settings.department,
            status: 'pending'
        };
        if (this.validateLeaveRequest(request)) {
            this.leaveData.requests.push(request);
            this.updateLeaveStats();
            StorageService.setLeaveData(this.leaveData);
            this.calendar?.addEvent({
                title: `${request.type} Leave (${request.status})`,
                start: request.startDate,
                end: request.endDate,
                backgroundColor: CONFIG.COLORS[request.type]
            });
            this.showNotification('Leave request submitted successfully', 'success');
            form.reset();
            const modal = document.getElementById('leave-request-modal');
            if (modal)
                modal.style.display = 'none';
        }
    }
    handleSettingsUpdate() {
        const form = document.getElementById('settings-form');
        const formData = new FormData(form);
        this.settings = {
            ...this.settings,
            department: formData.get('department'),
            yearlyAllowance: parseInt(formData.get('yearlyAllowance')),
            bankHolidays: formData.get('bankHolidays') === 'on'
        };
        this.saveSettings();
        const departmentDisplay = document.getElementById('department-display');
        if (departmentDisplay) {
            departmentDisplay.textContent = this.settings.department;
        }
        const modal = document.getElementById('settings-modal');
        if (modal)
            modal.style.display = 'none';
        this.showNotification('Settings updated successfully', 'success');
    }
    validateLeaveRequest(request) {
        const startDate = new Date(request.startDate);
        const endDate = new Date(request.endDate);
        if (endDate < startDate) {
            this.showNotification('End date cannot be before start date', 'error');
            return false;
        }
        const daysRequested = CalendarService.calculateBusinessDays(startDate, endDate);
        if (daysRequested > this.leaveData.remaining) {
            this.showNotification('Insufficient leave days remaining', 'error');
            return false;
        }
        return true;
    }
    updateLeaveStats() {
        const totalEl = document.getElementById('total-leave');
        const usedEl = document.getElementById('used-leave');
        const remainingEl = document.getElementById('remaining-leave');
        if (totalEl)
            totalEl.textContent = this.leaveData.total.toString();
        if (usedEl)
            usedEl.textContent = this.leaveData.used.toString();
        if (remainingEl)
            remainingEl.textContent = this.leaveData.remaining.toString();
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
    saveSettings() {
        StorageService.setSettings(this.settings);
    }
    openLeaveRequestModal(start, end) {
        const modal = document.getElementById('leave-request-modal');
        if (!modal)
            return;
        const startInput = document.getElementById('start-date');
        const endInput = document.getElementById('end-date');
        if (startInput && endInput) {
            startInput.value = start.toISOString().split('T')[0];
            endInput.value = end.toISOString().split('T')[0];
        }
        modal.style.display = 'block';
    }
    initializeCharts() {
        this.initializeLeaveDistributionChart();
        this.initializeLeaveTypeChart();
    }
    initializeLeaveDistributionChart() {
        const ctx = document.getElementById('leaveDistributionChart');
        if (!ctx)
            return;
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Used', 'Remaining'],
                datasets: [{
                        data: [this.leaveData.used, this.leaveData.remaining],
                        backgroundColor: [CONFIG.COLORS.annual, CONFIG.COLORS.sick]
                    }]
            }
        });
    }
    initializeLeaveTypeChart() {
        const ctx = document.getElementById('departmentStatsChart');
        if (!ctx)
            return;
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Annual', 'Sick', 'Compassionate', 'Bank Holiday'],
                datasets: [{
                        label: 'Leave Days by Type',
                        data: this.calculateLeaveTypeStats(),
                        backgroundColor: Object.values(CONFIG.COLORS)
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
            const days = CalendarService.calculateBusinessDays(new Date(request.startDate), new Date(request.endDate));
            stats[request.type] += days;
        });
        return Object.values(stats);
    }
    // Public methods for external access
    exportData(format) {
        // Implementation for data export
        console.log(`Exporting data in ${format} format`);
    }
}
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.ptoPlanner = new PTOPlanner();
});
