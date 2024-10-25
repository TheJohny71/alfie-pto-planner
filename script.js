// Debug flag
const DEBUG = true;
function log(...args) {
    if (DEBUG) console.log(...args);
}

// Global Constants
const CONFIG = {
    COLORS: {
        PTO: '#059669',
        BANK_HOLIDAY: '#f59e0b',
        WEEKEND: '#e5e7eb'
    },
    INITIAL_YEAR: 2024,
    MAX_PTO: 50,
    DEFAULT_PTO: 0
};

// Bank Holidays Data
const BANK_HOLIDAYS = {
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
    ]
};

// State Management
let hasSetup = false;
let calendar;
let currentYear = CONFIG.INITIAL_YEAR;
let currentStep = 1;
const totalSteps = 3;
let userData = {
    totalPTO: CONFIG.DEFAULT_PTO,
    plannedPTO: 0,
    selectedDates: {},
    preferences: {
        extendBankHolidays: [],
        preferredMonths: [],
        schoolHolidays: []
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Clear any old data
    localStorage.clear();
    
    // Get elements
    const welcomeScreen = document.getElementById('welcomeScreen');
    const appContainer = document.getElementById('appContainer');
    const getStartedBtn = document.getElementById('getStartedBtn');
    
    console.log('Elements found:', {
        welcomeScreen: !!welcomeScreen,
        appContainer: !!appContainer,
        getStartedBtn: !!getStartedBtn
    });

    if (!welcomeScreen || !appContainer || !getStartedBtn) {
        console.error('Required elements not found');
        return;
    }

    // Ensure welcome screen is visible and app container is hidden initially
    welcomeScreen.classList.remove('hidden');
    appContainer.classList.add('hidden');

    // Add click handler
    getStartedBtn.addEventListener('click', function() {
        console.log('Get Started button clicked');
        
        try {
            welcomeScreen.classList.add('hidden');
            appContainer.classList.remove('hidden');
            setTimeout(() => {
                initializeSetupWizard();
            }, 100);
            console.log('Setup wizard initialized');
        } catch (error) {
            console.error('Error in Get Started click handler:', error);
            Swal.fire({
                title: 'Error',
                text: 'There was a problem starting the application. Please refresh the page and try again.',
                icon: 'error'
            });
        }
    });
});

function initializeApp() {
    log('Initializing app');
    showLoading();
    try {
        initializeCalendar();
        setupEventListeners();
        updateSummary();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    } finally {
        hideLoading();
    }
}

function initializeCalendar() {
    log('Initializing calendar');
    const calendarEl = document.getElementById('calendar');
    
    if (!calendarEl) {
        showError('Calendar element not found');
        return;
    }

    try {
        if (typeof FullCalendar === 'undefined') {
            throw new Error('FullCalendar library not loaded');
        }

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            firstDay: 1,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
            },
            selectable: true,
            select: handleDateSelection,
            eventDidMount: handleEventMount,
            events: generateEvents(),
            eventClick: handleEventClick,
            dayCellDidMount: handleDayCellMount,
            displayEventTime: false,
            eventDisplay: 'block',
            dayMaxEvents: true,
            weekends: true,
            slotEventOverlap: false
        });

        calendar.render();
    } catch (error) {
        console.error('Calendar initialization error:', error);
        showError('Failed to initialize calendar');
    }
}

function generateEvents() {
    let events = [];
    
    // Add bank holidays
    if (BANK_HOLIDAYS[currentYear]) {
        BANK_HOLIDAYS[currentYear].forEach(holiday => {
            // Background event for coloring
            events.push({
                title: holiday.title,
                start: holiday.date,
                backgroundColor: CONFIG.COLORS.BANK_HOLIDAY,
                borderColor: CONFIG.COLORS.BANK_HOLIDAY,
                classNames: ['bank-holiday'],
                display: 'background'
            });
            
            // Text event for the holiday name
            events.push({
                title: holiday.title,
                start: holiday.date,
                classNames: ['bank-holiday-label'],
                display: 'block',
                textColor: 'black'
            });
        });
    }

    // Add PTO days
    if (userData.selectedDates && userData.selectedDates[currentYear]) {
        userData.selectedDates[currentYear].forEach(date => {
            events.push({
                title: 'PTO Day',
                start: date,
                backgroundColor: CONFIG.COLORS.PTO,
                borderColor: CONFIG.COLORS.PTO,
                classNames: ['pto-day']
            });
        });
    }

    return events;
}
