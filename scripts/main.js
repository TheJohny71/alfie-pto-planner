// Import utility modules
import config from './utils/config.js';
import { handleError } from './utils/errors.js';
import storageManager from './utils/storage.js';

class PTOCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedView = 'month';
        this.bindEvents();
        this.loadInitialData();
    }

    bindEvents() {
        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeView(e.target.dataset.view));
        });

        // Navigation
        document.getElementById('prevBtn')?.addEventListener('click', () => this.navigate('prev'));
        document.getElementById('nextBtn')?.addEventListener('click', () => this.navigate('next'));

        // Quick navigation
        document.querySelectorAll('.quick-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.quickNav(e.target.dataset.nav));
        });

        // Modal controls
        document.getElementById('addPTOBtn')?.addEventListener('click', () => this.openModal('ptoModal'));
        document.getElementById('statsButton')?.addEventListener('click', () => this.toggleStatsPanel());

        // Form submission
        document.getElementById('ptoForm')?.addEventListener('submit', (e) => this.handlePTOSubmit(e));

        // Close buttons
        document.querySelectorAll('[data-action="closeModal"]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal('ptoModal'));
        });
    }

    async loadInitialData() {
        try {
            const requests = await storageManager.getAllLeaveRequests();
            this.renderCalendar();
            this.updateStats(requests);
        } catch (error) {
            handleError('Failed to load initial data', error);
        }
    }

    changeView(view) {
        this.selectedView = view;
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        this.renderCalendar();
    }

    navigate(direction) {
        switch(this.selectedView) {
            case 'month':
                this.currentDate.setMonth(
                    this.currentDate.getMonth() + (direction === 'prev' ? -1 : 1)
                );
                break;
            case 'week':
                this.currentDate.setDate(
                    this.currentDate.getDate() + (direction === 'prev' ? -7 : 7)
                );
                break;
            case 'year':
                this.currentDate.setFullYear(
                    this.currentDate.getFullYear() + (direction === 'prev' ? -1 : 1)
                );
                break;
        }
        this.renderCalendar();
    }

    quickNav(navType) {
        this.currentDate = new Date();
        if (navType === 'thisWeek') {
            this.selectedView = 'week';
        } else if (navType === 'thisMonth') {
            this.selectedView = 'month';
        }
        this.renderCalendar();
    }

    renderCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        document.getElementById('currentMonth').textContent = 
            `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        // Implementation of calendar rendering based on view type
        switch(this.selectedView) {
            case 'month':
                this.renderMonthView(calendarEl);
                break;
            case 'week':
                this.renderWeekView(calendarEl);
                break;
            case 'year':
                this.renderYearView(calendarEl);
                break;
        }
    }

    renderMonthView(container) {
        // Month view implementation
        // This is a placeholder - implement your month view logic here
        container.innerHTML = '<div class="placeholder">Month view implementation pending</div>';
    }

    renderWeekView(container) {
        // Week view implementation
        container.innerHTML = '<div class="placeholder">Week view implementation pending</div>';
    }

    renderYearView(container) {
        // Year view implementation
        container.innerHTML = '<div class="placeholder">Year view implementation pending</div>';
    }

    async handlePTOSubmit(e) {
        e.preventDefault();
        try {
            const formData = {
                id: Date.now().toString(),
                startDate: document.getElementById('ptoStartDate').value,
                endDate: document.getElementById('ptoEndDate').value,
                type: document.getElementById('ptoType').value,
                notes: document.getElementById('ptoNotes').value,
                status: 'pending'
            };

            const success = await storageManager.saveLeaveRequest(formData);
            if (success) {
                this.closeModal('ptoModal');
                this.loadInitialData();
            } else {
                throw new Error('Failed to save PTO request');
            }
        } catch (error) {
            handleError('Error submitting PTO request', error);
        }
    }

    toggleStatsPanel() {
        const panel = document.getElementById('statsPanel');
        if (panel) {
            panel.classList.toggle('open');
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            if (modalId === 'ptoModal') {
                document.getElementById('ptoForm').reset();
            }
        }
    }

    async updateStats(requests) {
        const totalPTODays = config.maxPTODays;
        const daysTaken = requests.length;
        const daysRemaining = totalPTODays - daysTaken;

        document.getElementById('totalPTODays').textContent = totalPTODays;
        document.getElementById('daysTaken').textContent = daysTaken;
        document.getElementById('daysRemaining').textContent = daysRemaining;

        // Update upcoming PTO list
        const upcomingList = document.getElementById('upcomingPTOList');
        if (upcomingList) {
            upcomingList.innerHTML = requests
                .filter(req => new Date(req.startDate) >= new Date())
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .map(req => `
                    <li class="upcoming-item">
                        <span class="date">${new Date(req.startDate).toLocaleDateString()}</span>
                        <span class="type">${req.type}</span>
                    </li>
                `)
                .join('');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new PTOCalendar();
    } catch (error) {
        handleError('Failed to initialize calendar', error);
    }
});
