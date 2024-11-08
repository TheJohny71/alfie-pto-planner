// Import utility modules
import './utils/config.js';
import storageManager from './utils/storage.js';
import { handleError } from './utils/errors.js';
import { calculateHolidays } from './utils/holidayCalculator.js';
import { initializeServices } from './utils/services.js';

// Import components
import { Calendar } from './components/calendar.js';
import { LeaveRequestForm } from './components/LeaveRequestForm.js';

class PTOApplication {
    constructor() {
        this.calendar = null;
        this.leaveRequestForm = null;
        this.currentRegion = 'US';
    }

    async initialize() {
        try {
            // Initialize components
            this.initializeCalendar();
            this.initializeLeaveRequestForm();
            this.setupEventListeners();
            this.setupModals();
            
            // Initialize services and load data
            await this.loadInitialData();
        } catch (error) {
            handleError('Failed to initialize application', error);
        }
    }

    initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) throw new Error('Calendar element not found');
        
        this.calendar = new Calendar(calendarEl);
        this.calendar.init();
    }

    initializeLeaveRequestForm() {
        const formEl = document.getElementById('ptoForm');
        if (!formEl) throw new Error('PTO form element not found');
        
        this.leaveRequestForm = new LeaveRequestForm(formEl, {
            onSubmit: this.handleLeaveRequest.bind(this)
        });
    }

    setupEventListeners() {
        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleViewChange(e.target.dataset.view));
        });

        // Navigation
        document.getElementById('prevBtn')?.addEventListener('click', () => this.calendar.previousMonth());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.calendar.nextMonth());

        // Quick navigation
        document.querySelectorAll('.quick-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleQuickNav(e.target.dataset.nav));
        });

        // Region selection
        document.getElementById('regionSelect')?.addEventListener('change', (e) => {
            this.handleRegionChange(e.target.value);
        });

        // Modal actions
        document.querySelectorAll('[data-action]').forEach(element => {
            element.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (typeof this[action] === 'function') {
                    this[action]();
                }
            });
        });
    }

    setupModals() {
        // Close modals when clicking outside
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal(modal.id);
            });
        });
    }

    async loadInitialData() {
        try {
            // Load holidays for current region
            const holidays = await calculateHolidays(this.currentRegion);
            this.calendar.setHolidays(holidays);

            // Load saved PTO requests
            const savedRequests = await storageManager.getAllLeaveRequests();
            this.calendar.setLeaveRequests(savedRequests);

            // Update statistics
            await this.updateStatistics();
        } catch (error) {
            handleError('Failed to load initial data', error);
        }
    }

    // Event Handlers
    handleViewChange(view) {
        this.calendar.setView(view);
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    }

    handleQuickNav(navType) {
        switch (navType) {
            case 'today':
                this.calendar.goToToday();
                break;
            case 'thisWeek':
                this.calendar.goToThisWeek();
                break;
            case 'thisMonth':
                this.calendar.goToThisMonth();
                break;
        }
    }

    async handleRegionChange(region) {
        this.currentRegion = region;
        const holidays = await calculateHolidays(region);
        this.calendar.setHolidays(holidays);
        this.calendar.render();
    }

    async handleLeaveRequest(requestData) {
        try {
            const success = await storageManager.saveLeaveRequest(requestData);
            if (success) {
                await this.loadInitialData(); // Refresh calendar and stats
                this.closeModal('ptoModal');
            }
        } catch (error) {
            handleError('Failed to save leave request', error);
        }
    }

    // Modal Controls
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'block';
    }

    toggleStatsPanel() {
        const panel = document.getElementById('statsPanel');
        if (panel) panel.classList.toggle('open');
    }

    // Statistics
    async updateStatistics() {
        try {
            const requests = await storageManager.getAllLeaveRequests();
            const stats = this.calculateStatistics(requests);
            this.updateStatisticsDisplay(stats);
        } catch (error) {
            handleError('Failed to update statistics', error);
        }
    }

    calculateStatistics(requests) {
        // Add your statistics calculation logic here
        return {
            totalDays: 25, // Example value
            daysTaken: requests.length,
            daysRemaining: 25 - requests.length
        };
    }

    updateStatisticsDisplay(stats) {
        document.getElementById('totalPTODays').textContent = stats.totalDays;
        document.getElementById('daysTaken').textContent = stats.daysTaken;
        document.getElementById('daysRemaining').textContent = stats.daysRemaining;
    }

    // Export functions
    exportToICal() {
        // Implement iCal export
        console.log('Export to iCal not implemented');
    }

    exportToGoogle() {
        // Implement Google Calendar export
        console.log('Export to Google Calendar not implemented');
    }

    exportToCSV() {
        // Implement CSV export
        console.log('Export to CSV not implemented');
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PTOApplication();
    app.initialize().catch(error => {
        handleError('Failed to initialize application', error);
    });
});
