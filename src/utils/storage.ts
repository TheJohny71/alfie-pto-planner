import type { LeaveData, PTOSettings } from '../types';

export class StorageService {
    static getLeaveData(): LeaveData | null {
        const data = localStorage.getItem('leaveData');
        return data ? JSON.parse(data) : null;
    }

    static setLeaveData(data: LeaveData): void {
        localStorage.setItem('leaveData', JSON.stringify(data));
    }

    static getSettings(): PTOSettings | null {
        const settings = localStorage.getItem('settings');
        return settings ? JSON.parse(settings) : null;
    }

    static setSettings(settings: PTOSettings): void {
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    static setHasVisited(): void {
        localStorage.setItem('hasVisited', 'true');
    }

    static hasVisited(): boolean {
        return localStorage.getItem('hasVisited') === 'true';
    }
}
