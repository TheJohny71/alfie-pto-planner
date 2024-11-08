// Import the storage manager from the TypeScript implementation
import storageManager from '../../src/utils/storage';

// Re-export the storage manager
export default storageManager;

// Example functions showing how to use the storage manager
export const createLeaveRequest = async (employeeId, startDate, endDate, type) => {
    const request = {
        id: Date.now().toString(), // Simple ID generation
        employeeId,
        startDate,
        endDate,
        type,
        status: 'pending'
    };
    
    return await storageManager.saveLeaveRequest(request);
};

export const getEmployeeLeaves = async (employeeId) => {
    return await storageManager.getLeaveRequestsByEmployee(employeeId);
};

export const updateLeaveStatus = async (requestId, newStatus) => {
    return await storageManager.updateLeaveRequest(requestId, { status: newStatus });
};
