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
    }
};

export default storageManager;
