// Define the structure for leave requests
interface LeaveRequest {
    id: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    type: 'vacation' | 'sick' | 'personal';
    status: 'pending' | 'approved' | 'rejected';
    notes?: string;
}

// Configuration interface
interface StorageConfig {
    storageKey: string;
    version: string;
}

// Main storage manager class
class PTOStorageManager {
    private readonly config: StorageConfig;

    constructor(config: StorageConfig = { storageKey: 'pto_calendar_data', version: '1.0.0' }) {
        this.config = config;
    }

    // Save a new leave request
    async saveLeaveRequest(request: LeaveRequest): Promise<boolean> {
        try {
            const currentData = await this.getAllLeaveRequests();
            const updatedData = [...currentData, request];
            localStorage.setItem(this.config.storageKey, JSON.stringify(updatedData));
            return true;
        } catch (error) {
            console.error('Error saving leave request:', error);
            return false;
        }
    }

    // Get all leave requests
    async getAllLeaveRequests(): Promise<LeaveRequest[]> {
        try {
            const data = localStorage.getItem(this.config.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error retrieving leave requests:', error);
            return [];
        }
    }

    // Update an existing leave request
    async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<boolean> {
        try {
            const requests = await this.getAllLeaveRequests();
            const index = requests.findIndex(req => req.id === id);
            
            if (index === -1) return false;
            
            requests[index] = { ...requests[index], ...updates };
            localStorage.setItem(this.config.storageKey, JSON.stringify(requests));
            return true;
        } catch (error) {
            console.error('Error updating leave request:', error);
            return false;
        }
    }

    // Delete a leave request
    async deleteLeaveRequest(id: string): Promise<boolean> {
        try {
            const requests = await this.getAllLeaveRequests();
            const filteredRequests = requests.filter(req => req.id !== id);
            localStorage.setItem(this.config.storageKey, JSON.stringify(filteredRequests));
            return true;
        } catch (error) {
            console.error('Error deleting leave request:', error);
            return false;
        }
    }

    // Get leave requests for a specific employee
    async getLeaveRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]> {
        try {
            const requests = await this.getAllLeaveRequests();
            return requests.filter(req => req.employeeId === employeeId);
        } catch (error) {
            console.error('Error retrieving employee leave requests:', error);
            return [];
        }
    }

    // Clear all storage data
    async clearStorage(): Promise<boolean> {
        try {
            localStorage.removeItem(this.config.storageKey);
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
}

// Create and export a default instance
const storageManager = new PTOStorageManager();
export default storageManager;

// Export types and class for advanced usage
export { PTOStorageManager, type LeaveRequest, type StorageConfig };
