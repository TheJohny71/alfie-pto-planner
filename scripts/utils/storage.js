export class StorageService {
    static getLeaveData() {
        const data = localStorage.getItem('leaveData');
        return data ? JSON.parse(data) : null;
    }
    static setLeaveData(data) {
        localStorage.setItem('leaveData', JSON.stringify(data));
    }
    static getSettings() {
        const settings = localStorage.getItem('settings');
        return settings ? JSON.parse(settings) : null;
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
}
