import { CONFIG } from './config.js';
import { getEvents } from './storage.js';

function validateLeaveRequest(startDate, endDate) {
    const events = getEvents();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate days difference
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Check if days are within limits
    if (days < CONFIG.MIN_LEAVE_DAYS || days > CONFIG.MAX_LEAVE_DAYS) {
        throw new Error(`Leave days must be between ${CONFIG.MIN_LEAVE_DAYS} and ${CONFIG.MAX_LEAVE_DAYS}`);
    }
    
    // Check if request is within allowed months ahead
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + CONFIG.ALLOWED_MONTHS_AHEAD);
    if (end > maxDate) {
        throw new Error(`Cannot request leave more than ${CONFIG.ALLOWED_MONTHS_AHEAD} months ahead`);
    }
    
    // Check for concurrent requests
    const overlappingEvents = events.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return start <= eventEnd && end >= eventStart;
    });
    
    if (overlappingEvents.length >= CONFIG.MAX_CONCURRENT_REQUESTS) {
        throw new Error(`Cannot have more than ${CONFIG.MAX_CONCURRENT_REQUESTS} concurrent leave requests`);
    }
    
    return days;
}

export { validateLeaveRequest };
