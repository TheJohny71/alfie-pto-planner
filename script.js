/**
 * Alfie PTO Planner Pro - Enterprise Edition
 * Version 2.0.0
 */

// App Configuration
const APP_CONFIG = {
    version: '2.0.0',
    features: {
        analytics: true,
        autoSave: true,
        notifications: true,
        darkMode: true
    }
};

// Analytics System
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
    }
}

// Initialize Analytics
const analytics = new Analytics();

// Error Handler
function handleError(error) {
    console.error(error);
    showNotification(
        error.message || 'An unexpected error occurred',
        'error'
    );
    analytics.trackEvent('error_occurred', {
        message: error.message,
        code: error.code
    });
}

// Notification System
function showNotification(message, type = 'info') {
    Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        icon: type,
        title: message
    });
}

// Data Storage System
class DataStorage {
    constructor() {
        this.storage = window.localStorage;
    }

    save(key, data) {
        try {
            this.storage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            handleError(error);
            return false;
        }
    }

    load(key) {
        try {
            const data = this.storage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            handleError(error);
            return null;
        }
    }
}

// Initialize Storage
const dataStorage = new DataStorage();

// Calendar Event Handler
function handleCalendarEventClick(info) {
    Swal.fire({
        title: 'Event Details',
        html: `
            <div class="event-details">
                <p><strong>Date:</strong> ${info.event.startStr}</p>
                <p><strong>Type:</strong> ${info.event.extendedProps.type || 'PTO'}</p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Edit',
        cancelButtonText: 'Close'
    }).then((result) => {
        if (result.isConfirmed) {
            // Handle edit
            showEventEditDialog(info.event);
        }
    });
}

// Event Edit Dialog
function showEventEditDialog(event = null) {
    Swal.fire({
        title: event ? 'Edit Time Off' : 'Add Time Off',
        html: `
            <form id="eventForm">
                <div class="form-group">
                    <label>Type</label>
                    <select id="eventType" class="swal2-input">
                        <option value="pto">PTO</option>
                        <option value="sick">Sick Leave</option>
                        <option value="holiday">Holiday</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="eventNotes" class="swal2-textarea"></textarea>
                </div>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: event ? 'Update' : 'Add',
        showDenyButton: event ? true : false,
        denyButtonText: 'Delete'
    }).then((result) => {
        if (result.isConfirmed) {
            // Handle save/update
            saveEvent();
        } else if (result.isDenied && event) {
            // Handle delete
            deleteEvent(event);
        }
    });
}

// Main Application Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let calendar;
    const welcomeScreen = document.getElementById('welcomeScreen');
    const appContainer = document.getElementById('appContainer');
    const getStartedBtn = document.getElementById('getStartedBtn');

    // Initialize core functionality
    function init() {
        setupEventListeners();
        initializeCalendar();
        loadSavedData();
    }

    // Setup event listeners
    function setupEventListeners() {
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', function() {
                if (welcomeScreen && appContainer) {
                    welcomeScreen.style.display = 'none';
                    appContainer.style.display = 'block';
                    // Track app start
                    analytics.trackEvent('app_started');
                }
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
    }

    // Initialize calendar
    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
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
                        duration: { years: 1 }
                    }
                },
                selectable: true,
                editable: true,
                dayMaxEvents: true,
                weekNumbers: true,
                nowIndicator: true,
                events: loadEvents(),
                select: function(info) {
                    showEventEditDialog();
                },
                eventClick: handleCalendarEventClick,
                eventDrop: function(info) {
                    saveEvent(info.event);
                }
            });
            calendar.render();
        }
    }

    // Load saved events
    function loadEvents() {
        const savedEvents = dataStorage.load('calendarEvents') || [];
        return savedEvents.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
        }));
    }

    // Save event
    function saveEvent(eventData) {
        const events = loadEvents();
        if (eventData.id) {
            // Update existing event
            const index = events.findIndex(e => e.id === eventData.id);
            if (index !== -1) {
                events[index] = eventData;
            }
        } else {
            // Add new event
            events.push({
                id: 'evt_' + new Date().getTime(),
                ...eventData
            });
        }
        dataStorage.save('calendarEvents', events);
        calendar.refetchEvents();
    }

    // Delete event
    function deleteEvent(eventData) {
        const events = loadEvents().filter(e => e.id !== eventData.id);
        dataStorage.save('calendarEvents', events);
        calendar.refetchEvents();
    }

    // Theme toggle
    function toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        dataStorage.save('theme', newTheme);
        analytics.trackEvent('theme_changed', { theme: newTheme });
    }

    // Load saved data
    function loadSavedData() {
        // Load theme
        const savedTheme = dataStorage.load('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
    }

    // Start the application
    init();
});
