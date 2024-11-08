// storage.js
const storageManager = {
    storageKey: 'pto_calendar_data',

    async saveLeaveRequest(request) {
        try {
            const currentData = await this.getAllLeaveRequests();
            const updatedData = [...currentData, request];
            localStorage.setItem(this.storageKey, JSON.stringify(updatedData));
            return true;
        } catch (error) {
            console.error('Error saving leave request:', error);
            return false;
        }
    },

    async getAllLeaveRequests() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error retrieving leave requests:', error);
            return [];
        }
    },

    async updateLeaveRequest(id, updates) {
        try {
            const requests = await this.getAllLeaveRequests();
            const index = requests.findIndex(req => req.id === id);
            
            if (index === -1) return false;
            
            requests[index] = { ...requests[index], ...updates };
            localStorage.setItem(this.storageKey, JSON.stringify(requests));
            return true;
        } catch (error) {
            console.error('Error updating leave request:', error);
            return false;
        }
    },

    async deleteLeaveRequest(id) {
        try {
            const requests = await this.getAllLeaveRequests();
            const filteredRequests = requests.filter(req => req.id !== id);
            localStorage.setItem(this.storageKey, JSON.stringify(filteredRequests));
            return true;
        } catch (error) {
            console.error('Error deleting leave request:', error);
            return false;
        }
    }
};

export default storageManager;
