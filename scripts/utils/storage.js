export class StorageService {
    // Existing methods
    static getLeaveData() {
        const data = localStorage.getItem('leaveData');
        return data ? JSON.parse(data) : null;
    }

    static setLeaveData(data) {
        localStorage.setItem('leaveData', JSON.stringify(data));
    }

    static getSettings() {
        const settings = localStorage.getItem('settings');
        return settings ? JSON.parse(settings) : {
            theme: 'light',
            defaultRegion: 'US',
            showWeekends: true
        };
    }

    static setSettings(settings) {
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    static setHasVisited() {
        localStorage.setItem('hasVisited', 'true');
    }

    static hasVisited() {
        return localStorage.getItem('hasVisited') === 'true';
    }

    // New methods for leave requests
    static getLeaveRequests() {
        const requests = localStorage.getItem('leaveRequests');
        return requests ? JSON.parse(requests) : [];
    }

    static saveLeaveRequest(request) {
        const requests = this.getLeaveRequests();
        // Add timestamp and status to the request
        const enhancedRequest = {
            ...request,
            id: Date.now().toString(),
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };
        requests.push(enhancedRequest);
        localStorage.setItem('leaveRequests', JSON.stringify(requests));
        return enhancedRequest;
    }

    static updateLeaveRequest(requestId, updates) {
        const requests = this.getLeaveRequests();
        const index = requests.findIndex(req => req.id === requestId);
        if (index !== -1) {
            requests[index] = { ...requests[index], ...updates };
            localStorage.setItem('leaveRequests', JSON.stringify(requests));
            return true;
        }
        return false;
    }

    // Region settings
    static getRegionSettings() {
        return localStorage.getItem('selectedRegion') || 'US';
    }

    static setRegionSettings(region) {
        if (region === 'US' || region === 'UK') {
            localStorage.setItem('selectedRegion', region);
            return true;
        }
        return false;
    }

    // Theme settings
    static getTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    static setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            localStorage.setItem('theme', theme);
            return true;
        }
        return false;
    }

    // Clear specific data (useful for testing or resetting)
    static clearLeaveRequests() {
        localStorage.removeItem('leaveRequests');
    }

    static clearAllData() {
        localStorage.clear();
    }
}
