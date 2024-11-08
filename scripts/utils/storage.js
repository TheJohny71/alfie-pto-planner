export class StorageService {
    // Get and set leave data
    static getLeaveData() {
        const data = localStorage.getItem('leaveData');
        return data ? JSON.parse(data) : null;
    }

    static setLeaveData(data) {
        localStorage.setItem('leaveData', JSON.stringify(data));
    }

    // Get and set settings
    static getSettings() {
        const settings = localStorage.getItem('settings');
        return settings ? JSON.parse(settings) : {
            theme: 'light',
            region: 'US',
            showWeekends: true
        };
    }

    static setSettings(settings) {
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    // Track if user has visited
    static setHasVisited() {
        localStorage.setItem('hasVisited', 'true');
    }

    static hasVisited() {
        return localStorage.getItem('hasVisited') === 'true';
    }

    // Handle leave requests
    static getLeaveRequests() {
        const requests = localStorage.getItem('leaveRequests');
        return requests ? JSON.parse(requests) : [];
    }

    static saveLeaveRequest(request) {
        const requests = this.getLeaveRequests();
        const newRequest = {
            ...request,
            id: Date.now().toString(),
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };
        requests.push(newRequest);
        localStorage.setItem('leaveRequests', JSON.stringify(requests));
        return newRequest;
    }

    // Get and set region
    static getRegion() {
        return localStorage.getItem('selectedRegion') || 'US';
    }

    static setRegion(region) {
        if (region === 'US' || region === 'UK') {
            localStorage.setItem('selectedRegion', region);
        }
    }
}
