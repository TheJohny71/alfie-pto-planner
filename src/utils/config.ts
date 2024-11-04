// src/utils/config.ts
export const CONFIG = {
    LEAVE_YEAR: {
        START_MONTH: 3, // April (0-based)
        START_DAY: 1,
        DEFAULT_ALLOWANCE: 25
    },
    VALIDATION: {
        MIN_NOTICE_DAYS: 14,
        MAX_CONSECUTIVE_DAYS: 15,
        MAX_ADVANCE_BOOK_MONTHS: 12
    },
    RETRY: {
        MAX_ATTEMPTS: 3,
        BASE_DELAY: 1000
    },
    CACHE: {
        WORKING_DAYS: 5 * 60 * 1000, // 5 minutes
        CALENDAR_EVENTS: 60 * 1000 // 1 minute
    }
};
