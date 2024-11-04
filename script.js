/**
 * Alfie PTO Planner Pro - Enterprise Edition
 * Version 2.0.0
 * Debugged and Marked Version
 */

// ===============================
// CONFIGURATION AND CONSTANTS
// ===============================
const APP_CONFIG = {
    version: '2.0.0',
    maxPTODays: 25,
    features: {
        analytics: true,
        autoSave: true,
        notifications: true,
        darkMode: true
    }
};

// ===============================
// UTILITY FUNCTIONS
// ===============================
const utils = {
    generateId: () => `evt_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`,
    formatDate: (date) => new Date(date).toLocaleDateString('en-GB'),
    calculateDuration: (start, end) => {
        const diffTime = Math.abs(new Date(end) - new Date(start));
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
};

// ===============================
// ANALYTICS SYSTEM
// ===============================
class Analytics {
    constructor() {
        this.events = [];
    }

    trackEvent(eventName, data = {}) {
        this.events.push({
            event: eventName,
            timestamp: new Date(),
            data: data
        });
        console.log(`Event tracked: ${eventName}`, data);
    }
}

// Initialize Analytics
const analytics = new Analytics();

// ===============================
// DATA MANAGEMENT
// ===============================
class DataManager {
    constructor() {
        this.storage = window.localStorage;
    }

    save(key, data) {
        try {
            this.storage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Save Error:', error);
            return false;
        }
    }

    load(key) {
        try {
            const data = this.storage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Load Error:', error);
            return null;
        }
    }
}

// Initialize Data Manager
const dataManager = new DataManager();

// ===============================
// UI MANAGEMENT
// ===============================
class UIManager {
    constructor() {
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.appContainer = document.getElementById('appContainer');
        this.loadingIndicator = document.getElementById('loadingIndicator');
    }

    showLoading(show = true) {
        this.loadingIndicator.classList.toggle('hidden', !show);
    }

    showApp() {
        this.welcomeScreen.classList.add('hidden');
        this.appContainer.classList.remove('hidden');
    }

    updatePTOSummary(used, total = APP_CONFIG.maxPTODays) {
        document.getElementById('usedPTO').textContent = used;
        document.getElementById('remainingPTO').textContent = total - used;
        document.getElementById('totalPTO').textContent = total;
    }

    showNotification(message, type = 'success') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            icon: type,
            title: message
        });
    }
}

// ===============================
// CALENDAR MANAGEMENT
// ===============================
class CalendarManager {
    constructor() {
        this.calendar = null;
        this.events = [];
    }

    // In the CalendarManager class
initialize() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    this.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        height: '100%',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        selectable: true,
        editable: true,
        dayMaxEvents: true,
        weekNumbers: true,
        events: this.loadEvents.bind(this),
        select: this.handleDateSelect.bind(this),
        eventClick: this.handleEventClick.bind(this),
        eventChange: this.handleEventChange.bind(this),
        viewDidMount: () => {
            // Ensure proper sizing
            this.calendar.updateSize();
        }
    });

    this.calendar.render();
}

    loadEvents() {
        return dataManager.load('events') || [];
    }

    async handleDateSelect(selectInfo) {
        const result = await this.showEventDialog();
        if (result.isConfirmed) {
            const event = {
                id: utils.generateId(),
                title: 'PTO',
                start: selectInfo.start,
                end: selectInfo.end,
                ...result.value
            };
            this.saveEvent(event);
        }
    }

    async handleEventClick(clickInfo) {
        const result = await this.showEventDialog(clickInfo.event);
        if (result.isConfirmed) {
            this.updateEvent(clickInfo.event, result.value);
        } else if (result.isDenied) {
            this.deleteEvent(clickInfo.event);
        }
    }

    handleEventChange(changeInfo) {
        this.saveEvent(changeInfo.event);
    }

    async showEventDialog(event = null) {
        return Swal.fire({
            title: event ? 'Edit Time Off' : 'Request Time Off',
            html: `
                <div class="event-form">
                    <select id="eventType" class="swal2-input">
                        <option value="PTO" ${event?.extendedProps?.type === 'PTO' ? 'selected' : ''}>PTO</option>
                        <option value="WFH" ${event?.extendedProps?.type === 'WFH' ? 'selected' : ''}>Work From Home</option>
                    </select>
                    <textarea id="eventNotes" class="swal2-textarea" placeholder="Notes (optional)">${event?.extendedProps?.notes || ''}</textarea>
                </div>
            `,
            showCancelButton: true,
            showDenyButton: event ? true : false,
            confirmButtonText: event ? 'Update' : 'Save',
            denyButtonText: event ? 'Delete' : undefined
        });
    }

    saveEvent(event) {
        const events = this.loadEvents();
        const existingIndex = events.findIndex(e => e.id === event.id);
        
        if (existingIndex >= 0) {
            events[existingIndex] = event;
        } else {
            events.push(event);
        }

        dataManager.save('events', events);
        this.calendar.refetchEvents();
        analytics.trackEvent('event_saved', { eventId: event.id });
    }

    deleteEvent(event) {
        const events = this.loadEvents().filter(e => e.id !== event.id);
        dataManager.save('events', events);
        this.calendar.refetchEvents();
        analytics.trackEvent('event_deleted', { eventId: event.id });
    }
}

// ===============================
// MAIN APPLICATION
// ===============================
document.addEventListener('DOMContentLoaded', function() {
    const ui = new UIManager();
    const calendar = new CalendarManager();

    // Initialize app
    function initializeApp() {
        ui.showLoading(true);
        setupEventListeners();
        calendar.initialize();
        loadSavedData();
        ui.showLoading(false);
        analytics.trackEvent('app_initialized');
    }

    // Setup event listeners
    function setupEventListeners() {
        // Get Started button
        document.getElementById('getStartedBtn')?.addEventListener('click', () => {
            ui.showApp();
            calendar.calendar.render(); // Re-render calendar after showing
            analytics.trackEvent('app_started');
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            document.body.setAttribute(
                'data-theme',
                document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light'
            );
            analytics.trackEvent('theme_changed');
        });

        // Year select
        document.getElementById('yearSelect')?.addEventListener('change', (e) => {
            calendar.calendar.gotoDate(`${e.target.value}-01-01`);
            analytics.trackEvent('year_changed', { year: e.target.value });
        });
    }

    // Load saved data
    function loadSavedData() {
        const theme = dataManager.load('theme') || 'light';
        document.body.setAttribute('data-theme', theme);
        
        const events = dataManager.load('events') || [];
        ui.updatePTOSummary(events.length);
    }

    // Start the application
    initializeApp();
});
