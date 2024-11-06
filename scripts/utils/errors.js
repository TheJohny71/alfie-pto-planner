// src/utils/errors.ts
export class LeaveError extends Error {
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'LeaveError';
        Object.setPrototypeOf(this, LeaveError.prototype);
    }
}
export const ErrorCodes = {
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    STORAGE_ERROR: 'STORAGE_ERROR',
    DATE_ERROR: 'DATE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR'
};
