/**
 * Alfie PTO Planner Pro - Enterprise Edition
 * Version 2.0.0
 * A modern, enterprise-grade PTO management system
 */

// Modern App Configuration
const APP_CONFIG = {
    version: '2.0.0',
    features: {
        analytics: true,
        autoSave: true,
        notifications: true,
        exportData: true,
        darkMode: true,
        multiLanguage: true
    },
    limits: {
        maxPTODays: 50,
        minNoticeDays: 14,
        maxConsecutiveDays: 15
    },
    dateRanges: {
        startYear: 2024,
        endYear: 2028
    },
    refreshRates: {
        calendar: 5 * 60 * 1000,  // 5 minutes
        analytics: 15 * 60 * 1000, // 15 minutes
        autoSave: 30 * 1000       // 30 seconds
    }
};

// Modern Error Handling System
class AppError extends Error {
    constructor(message, code, context = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.context = context;
        this.timestamp = new Date();
    }
}

// Advanced Analytics System
class Analytics {
    constructor() {
        this.events = [];
        this.startTime = new Date();
    }

    trackEvent(eventName, data = {}) {
        this.events.push({
            event: eventName,
            timestamp: new Date(),
            data: data
        });
        
        // Auto-export analytics if buffer is large
        if (this.events.length > 100) {
            this.exportAnalytics();
        }
    }

    exportAnalytics() {
        // Enterprise analytics export
        console.log('Analytics exported:', this.events);
        this.events = [];
    }
}

// Modern State Management
class AppState {
    constructor() {
        this._state = {
            user: null,
            ptoEvents: new Map(),
            holidays: new Set(),
            preferences: {},
            analytics: new Analytics()
        };
        this.subscribers = new Set();
    }

    update(key, value) {
        this._state[key] = value;
        this.notifySubscribers();
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this._state));
    }
}

// Initialize Core App State
const appState = new AppState();
const analytics = new Analytics();

// Modern Document Ready Handler
document.addEventListener('DOMContentLoaded', function() {
    // Initialize core components
    initializeApp();
    setupEventListeners();
    loadUserPreferences();
});

// Modern App Initialization
async function initializeApp() {
    try {
        // Show loading indicator
        showLoadingState(true);
        
        // Initialize core features
        await Promise.all([
            initializeCalendar(),
            loadUserData(),
            setupNotifications(),
            initializeAnalytics()
        ]);

        // Setup auto-save
        setupAutoSave();

        // Setup theme
        initializeTheme();

        // Hide loading indicator
        showLoadingState(false);

        // Track successful initialization
        analytics.trackEvent('app_initialized');
    } catch (error) {
        handleError(error);
    }
}
// Modern Calendar Management
class CalendarManager {
    constructor() {
        this.calendar = null;
        this.events = new Map();
        this.view = 'dayGridMonth';
        this.currentDate = new Date();
    }

    async initialize() {
        const calendarEl = document.getElementById('calendar');
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: this.view,
            themeSystem: 'standard',
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
            droppable: true,
            dayMaxEvents: true,
            weekNumbers: true,
            nowIndicator: true,
            businessHours: true,
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false
            },
            slotMinTime: '08:00:00',
            slotMaxTime: '20:00:00',
            events: this.loadEvents.bind(this),
            select: this.handleDateSelect.bind(this),
            eventClick: this.handleEventClick.bind(this),
            eventDrop: this.handleEventDrop.bind(this),
            eventResize: this.handleEventResize.bind(this),
            datesSet: this.handleDatesSet.bind(this)
        });

        this.calendar.render();
        this.setupEventListeners();
        this.loadSavedEvents();
    }

    async loadEvents(info, successCallback, failureCallback) {
        try {
            const events = Array.from(this.events.values()).map(event => ({
                id: event.id,
                title: event.title,
                start: event.startDate,
                end: event.endDate,
                className: this.getEventClassName(event.type),
                extendedProps: {
                    type: event.type,
                    status: event.status,
                    notes: event.notes
                }
            }));
            successCallback(events);
        } catch (error) {
            failureCallback(error);
            handleError(error);
        }
    }

    getEventClassName(type) {
        const classMap = {
            pto: 'event-pto',
            holiday: 'event-holiday',
            training: 'event-training',
            remote: 'event-remote'
        };
        return classMap[type] || 'event-default';
    }

    async handleDateSelect(selectInfo) {
        try {
            const result = await this.showEventDialog('add', {
                startDate: selectInfo.start,
                endDate: selectInfo.end
            });

            if (result.isConfirmed) {
                const event = await this.createEvent(result.value);
                this.calendar.addEvent(event);
                analytics.trackEvent('event_created', { type: event.type });
            }
        } catch (error) {
            handleError(error);
        }
    }

    async handleEventClick(clickInfo) {
        try {
            const event = clickInfo.event;
            const result = await this.showEventDialog('edit', {
                id: event.id,
                title: event.title,
                startDate: event.start,
                endDate: event.end,
                type: event.extendedProps.type,
                notes: event.extendedProps.notes
            });

            if (result.isConfirmed) {
                if (result.value.action === 'delete') {
                    await this.deleteEvent(event.id);
                    event.remove();
                } else {
                    await this.updateEvent(event.id, result.value);
                    Object.assign(event, result.value);
                    event.setDates(result.value.startDate, result.value.endDate);
                }
                analytics.trackEvent('event_updated', { id: event.id });
            }
        } catch (error) {
            handleError(error);
        }
    }

    async showEventDialog(mode, eventData = {}) {
        const title = mode === 'add' ? 'Add Time Off' : 'Edit Time Off';
        return Swal.fire({
            title: title,
            html: this.generateEventFormHtml(eventData),
            showCancelButton: true,
            confirmButtonText: mode === 'add' ? 'Add' : 'Update',
            showDenyButton: mode === 'edit',
            denyButtonText: 'Delete',
            focusConfirm: false,
            preConfirm: () => this.validateAndCollectFormData(),
            didOpen: () => this.initializeDatePickers(eventData)
        });
    }

    generateEventFormHtml(eventData) {
        return `
            <form id="eventForm" class="event-form">
                <div class="form-group">
                    <label for="eventType">Type</label>
                    <select id="eventType" class="swal2-input" required>
                        <option value="pto" ${eventData.type === 'pto' ? 'selected' : ''}>PTO</option>
                        <option value="remote" ${eventData.type === 'remote' ? 'selected' : ''}>Remote Work</option>
                        <option value="training" ${eventData.type === 'training' ? 'selected' : ''}>Training</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="startDate">Start Date</label>
                    <input type="date" id="startDate" class="swal2-input" required>
                </div>
                <div class="form-group">
                    <label for="endDate">End Date</label>
                    <input type="date" id="endDate" class="swal2-input" required>
                </div>
                <div class="form-group">
                    <label for="notes">Notes</label>
                    <textarea id="notes" class="swal2-textarea">${eventData.notes || ''}</textarea>
                </div>
            </form>
        `;
    }

    validateAndCollectFormData() {
        const form = document.getElementById('eventForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Validation
        if (!data.startDate || !data.endDate) {
            Swal.showValidationMessage('Please select dates');
            return false;
        }

        if (new Date(data.startDate) > new Date(data.endDate)) {
            Swal.showValidationMessage('End date must be after start date');
            return false;
        }

        return data;
    }

    async saveEvents() {
        try {
            const events = Array.from(this.events.values());
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            analytics.trackEvent('events_saved', { count: events.length });
        } catch (error) {
            handleError(error);
        }
    }

    async loadSavedEvents() {
        try {
            const savedEvents = localStorage.getItem('calendarEvents');
            if (savedEvents) {
                const events = JSON.parse(savedEvents);
                events.forEach(event => this.events.set(event.id, event));
                this.calendar.refetchEvents();
            }
        } catch (error) {
            handleError(error);
        }
    }
}
// Modern UI Management
class UIManager {
    constructor() {
        this.theme = 'light';
        this.sidebar = {
            isOpen: true,
            width: 300
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Theme Toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Sidebar Toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Setup Modal Navigation
        document.querySelectorAll('.setup-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleSetupNavigation(e.target.dataset.direction);
            });
        });

        // Export Button
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.handleExport();
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.body.dataset.theme = this.theme;
        localStorage.setItem('theme', this.theme);
        analytics.trackEvent('theme_changed', { theme: this.theme });
    }

    toggleSidebar() {
        this.sidebar.isOpen = !this.sidebar.isOpen;
        document.getElementById('sidebar').style.width = 
            this.sidebar.isOpen ? `${this.sidebar.width}px` : '0';
        analytics.trackEvent('sidebar_toggled', { isOpen: this.sidebar.isOpen });
    }

    async handleExport() {
        try {
            const data = await this.prepareExportData();
            const format = await this.showExportFormatDialog();
            
            if (format) {
                await this.exportData(data, format);
                analytics.trackEvent('data_exported', { format });
            }
        } catch (error) {
            handleError(error);
        }
    }

    async prepareExportData() {
        return {
            events: Array.from(appState._state.ptoEvents.values()),
            analytics: appState._state.analytics.events,
            preferences: appState._state.preferences,
            exportDate: new Date(),
            version: APP_CONFIG.version
        };
    }

    async showExportFormatDialog() {
        const result = await Swal.fire({
            title: 'Export Format',
            input: 'select',
            inputOptions: {
                csv: 'CSV',
                excel: 'Excel',
                pdf: 'PDF',
                json: 'JSON'
            },
            inputPlaceholder: 'Select a format',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Please select a format!';
                }
            }
        });

        return result.isConfirmed ? result.value : null;
    }

    async exportData(data, format) {
        const exporters = {
            csv: this.exportToCSV,
            excel: this.exportToExcel,
            pdf: this.exportToPDF,
            json: this.exportToJSON
        };

        const exporter = exporters[format];
        if (exporter) {
            await exporter(data);
        } else {
            throw new AppError('Unsupported export format', 'EXPORT_ERROR');
        }
    }

    showLoadingState(isLoading) {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = isLoading ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
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
}
// Modern Data Management
class DataManager {
    constructor() {
        this.storage = window.localStorage;
        this.dbVersion = 1;
        this.initializeDB();
    }

    async initializeDB() {
        try {
            const request = indexedDB.open('ptoPlanner', this.dbVersion);
            
            request.onerror = () => {
                throw new AppError('Failed to initialize database', 'DB_ERROR');
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create stores
                if (!db.objectStoreNames.contains('events')) {
                    db.createObjectStore('events', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('preferences')) {
                    db.createObjectStore('preferences', { keyPath: 'id' });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.loadInitialData();
            };
        } catch (error) {
            handleError(error);
        }
    }

    async saveData(storeName, data) {
        try {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.put(data);
            
            analytics.trackEvent('data_saved', {
                store: storeName,
                dataSize: JSON.stringify(data).length
            });
        } catch (error) {
            handleError(error);
        }
    }

    async loadData(storeName) {
        try {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            return await store.getAll();
        } catch (error) {
            handleError(error);
            return null;
        }
    }

    async exportToCSV(data) {
        try {
            const csv = this.convertToCSV(data);
            this.downloadFile(csv, 'pto-data.csv', 'text/csv');
        } catch (error) {
            handleError(error);
        }
    }

    async exportToExcel(data) {
        try {
            // Implementation for Excel export
            console.log('Excel export not implemented yet');
        } catch (error) {
            handleError(error);
        }
    }

    async exportToPDF(data) {
        try {
            // Implementation for PDF export
            console.log('PDF export not implemented yet');
        } catch (error) {
            handleError(error);
        }
    }

    convertToCSV(data) {
        // CSV conversion logic
        return 'csv data';
    }

    downloadFile(content, fileName, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}

// Utility Functions
const utils = {
    generateId: () => {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },

    formatDate: (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    calculateDuration: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    isWeekend: (date) => {
        const day = new Date(date).getDay();
        return day === 0 || day === 6;
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle: (func, limit) => {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Initialize Application
const calendarManager = new CalendarManager();
const uiManager = new UIManager();
const dataManager = new DataManager();

// Start the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        uiManager.showLoadingState(true);
        await Promise.all([
            calendarManager.initialize(),
            dataManager.initializeDB()
        ]);
        uiManager.showLoadingState(false);
        analytics.trackEvent('app_initialized');
    } catch (error) {
        handleError(error);
    }
}

// Error Handler
function handleError(error) {
    console.error(error);
    uiManager.showNotification(
        error.message || 'An unexpected error occurred',
        'error'
    );
    analytics.trackEvent('error_occurred', {
        message: error.message,
        code: error.code,
        context: error.context
    });
}
// ... your existing code ...

// Error Handler
function handleError(error) {
    // ... error handling code ...
}

// Insert new initialization code here (at line 677)
document.addEventListener('DOMContentLoaded', function() {
    // Core initialization
    const app = {
        init: function() {
            this.setupEventListeners();
            this.initializeCalendar();
        },
        // ... rest of the new code ...
    };

    // Start the application
    app.init();
});
