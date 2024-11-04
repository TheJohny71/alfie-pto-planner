// src/utils/errors.ts
export class LeaveError extends Error {
    constructor(
        public code: string,
        message: string,
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = 'LeaveError';
        Object.setPrototypeOf(this, LeaveError.prototype);
    }
}

export const ErrorCodes = {
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    STORAGE_ERROR: 'STORAGE_ERROR',
    DATE_ERROR: 'DATE_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR'
} as const;
