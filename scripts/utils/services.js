import { CONFIG } from './config';
import { LeaveError, ErrorCodes } from './errors';
export class DateService {
    static isWorkingDay(date) {
        const day = date.getDay();
        return day !== 0 && day !== 6; // Not Sunday(0) or Saturday(6)
    }
    static calculateWorkingDays(start, end) {
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
            if (this.isWorkingDay(current)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
    }
    static validateDateRange(start, end) {
        return start <= end &&
            this.calculateWorkingDays(start, end) <= CONFIG.VALIDATION.MAX_CONSECUTIVE_DAYS;
    }
}
export class StorageService {
    static saveLeaves(leaves) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(leaves));
        }
        catch (error) {
            throw new LeaveError(ErrorCodes.STORAGE_ERROR, 'Failed to save leave requests', { error });
        }
    }
    static getLeaves() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        }
        catch (error) {
            throw new LeaveError(ErrorCodes.STORAGE_ERROR, 'Failed to retrieve leave requests', { error });
        }
    }
}
StorageService.STORAGE_KEY = 'leave_requests';
