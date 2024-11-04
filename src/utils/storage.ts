import { LeaveRequest, UserSettings } from '../types';

export class StorageManager {
    private static readonly LEAVE_KEY = 'leave_requests';
    private static readonly SETTINGS_KEY = 'user_settings';

    static getLeaveRequests(): LeaveRequest[] {
        const data = localStorage.getItem(this.LEAVE_KEY);
        return data ? JSON.parse(data) : [];
    }

    static saveLeaveRequest(request: LeaveRequest): void {
        const requests = this.getLeaveRequests();
        requests.push(request);
        localStorage.setItem(this.LEAVE_KEY, JSON.stringify(requests));
    }

    static getUserSettings(): UserSettings {
        const defaultSettings: UserSettings = {
            theme: 'light',
            totalAllowance: 25,
            year: new Date().getFullYear()
        };
        const data = localStorage.getItem(this.SETTINGS_KEY);
        return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
    }

    static saveUserSettings(settings: Partial<UserSettings>): void {
        const currentSettings = this.getUserSettings();
        const newSettings = { ...currentSettings, ...settings };
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
    }
}
