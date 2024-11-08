class StorageService {
    static getLeaveData() {
        const data = localStorage.getItem('leaveData')
        return data ? JSON.parse(data) : null
    }

    static setLeaveData(data) {
        localStorage.setItem('leaveData', JSON.stringify(data))
    }

    static getSettings() {
        const settings = localStorage.getItem('settings')
        return settings ? JSON.parse(settings) : {
            theme: 'light',
            region: 'US',
            showWeekends: true
        }
    }

    static setSettings(settings) {
        localStorage.setItem('settings', JSON.stringify(settings))
    }

    static setHasVisited() {
        localStorage.setItem('hasVisited', 'true')
    }

    static hasVisited() {
        return localStorage.getItem('hasVisited') === 'true'
    }

    static getLeaveRequests() {
        const requests = localStorage.getItem('leaveRequests')
        return requests ? JSON.parse(requests) : []
    }

    static saveLeaveRequest(request) {
        const requests = this.getLeaveRequests()
        const newRequest = {
            id: String(Date.now()),
            status: 'pending',
            ...request
        }
        requests.push(newRequest)
        localStorage.setItem('leaveRequests', JSON.stringify(requests))
        return newRequest
    }
}
