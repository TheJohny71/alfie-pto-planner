// File: alfie-pto-planner/src/utils/storage.ts

import type { LeaveData, PTOSettings } from '../types';

// Types
interface StorageState {
    leaveData: LeaveData | null;
    settings: PTOSettings | null;
    version: string;
    lastUpdated: string;
}

interface HistoryEntry {
    state: StorageState;
    timestamp: string;
}

// Enhanced StorageService Class
export class StorageService {
    private static instance: StorageService;
    private readonly VERSION = '2.0.0';
    private readonly MAX_HISTORY = 10;
    private history: HistoryEntry[] = [];
    private currentHistoryIndex = -1;
    private listeners: Map<string, Function[]> = new Map();

    private constructor() {
        this.initializeHistory();
        this.setupStorageListener();
    }

    static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    // Core Storage Methods
    static getLeaveData(): LeaveData | null {
        try {
            const compressed = localStorage.getItem('leaveData');
            if (!compressed) return null;
            return this.decompress(compressed);
        } catch (error) {
            console.error('Error getting leave data:', error);
            this.handleStorageError('read', error);
            return null;
        }
    }

    static setLeaveData(data: LeaveData): void {
        try {
            const compressed = this.compress(data);
            localStorage.setItem('leaveData', compressed);
            this.getInstance().addToHistory({
                leaveData: data,
                settings: this.getSettings(),
                version: this.getInstance().VERSION,
                lastUpdated: new Date().toISOString()
            });
            this.getInstance().notifyListeners('leaveData', data);
        } catch (error) {
            console.error('Error setting leave data:', error);
            this.handleStorageError('write', error);
        }
    }

    static getSettings(): PTOSettings | null {
        try {
            const settings = localStorage.getItem('settings');
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Error getting settings:', error);
            this.handleStorageError('read', error);
            return null;
        }
    }

    static setSettings(settings: PTOSettings): void {
        try {
            localStorage.setItem('settings', JSON.stringify(settings));
            this.getInstance().addToHistory({
                leaveData: this.getLeaveData(),
                settings: settings,
                version: this.getInstance().VERSION,
                lastUpdated: new Date().toISOString()
            });
            this.getInstance().notifyListeners('settings', settings);
        } catch (error) {
            console.error('Error setting settings:', error);
            this.handleStorageError('write', error);
        }
    }

    // History Management
    undo(): boolean {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            this.restoreHistoryState(this.history[this.currentHistoryIndex]);
            return true;
        }
        return false;
    }

    redo(): boolean {
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.currentHistoryIndex++;
            this.restoreHistoryState(this.history[this.currentHistoryIndex]);
            return true;
        }
        return false;
    }

    // Compression Methods
    private static compress(data: any): string {
        try {
            const jsonString = JSON.stringify(data);
            return btoa(this.lzCompress(jsonString));
        } catch (error) {
            console.error('Compression failed:', error);
            return JSON.stringify(data); // Fallback to regular JSON
        }
    }

    private static decompress(compressed: string): any {
        try {
            const decompressed = this.lzDecompress(atob(compressed));
            return JSON.parse(decompressed);
        } catch (error) {
            console.error('Decompression failed:', error);
            return JSON.parse(compressed); // Fallback to regular JSON
        }
    }

    // LZ77 Compression Implementation
    private static lzCompress(input: string): string {
        let dictionary = new Map<string, number>();
        let current = '';
        let output = '';
        let dictSize = 256;

        for (let i = 0; i < 256; i++) {
            dictionary.set(String.fromCharCode(i), i);
        }

        for (let char of input) {
            const phrase = current + char;
            if (dictionary.has(phrase)) {
                current = phrase;
            } else {
                output += String.fromCharCode(dictionary.get(current)!);
                dictionary.set(phrase, dictSize++);
                current = char;
            }
        }

        if (current !== '') {
            output += String.fromCharCode(dictionary.get(current)!);
        }

        return output;
    }

    private static lzDecompress(input: string): string {
        let dictionary = new Map<number, string>();
        let current = input[0];
        let output = current;
        let dictSize = 256;

        for (let i = 0; i < 256; i++) {
            dictionary.set(i, String.fromCharCode(i));
        }

        for (let i = 1; i < input.length; i++) {
            const next = input.charCodeAt(i);
            let phrase: string;

            if (dictionary.has(next)) {
                phrase = dictionary.get(next)!;
            } else if (next === dictSize) {
                phrase = current + current[0];
            } else {
                throw new Error('Invalid compressed data');
            }

            output += phrase;
            dictionary.set(dictSize++, current + phrase[0]);
            current = phrase;
        }

        return output;
    }

    // Event Handling
    addEventListener(event: string, callback: Function): void {
        const callbacks = this.listeners.get(event) || [];
        callbacks.push(callback);
        this.listeners.set(event, callbacks);
    }

    removeEventListener(event: string, callback: Function): void {
        const callbacks = this.listeners.get(event) || [];
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
            this.listeners.set(event, callbacks);
        }
    }

    // Private Helper Methods
    private initializeHistory(): void {
        const currentState: StorageState = {
            leaveData: StorageService.getLeaveData(),
            settings: StorageService.getSettings(),
            version: this.VERSION,
            lastUpdated: new Date().toISOString()
        };
        this.history = [{ state: currentState, timestamp: new Date().toISOString() }];
        this.currentHistoryIndex = 0;
    }

    private addToHistory(state: StorageState): void {
        // Remove any future history if we're not at the end
        if (this.currentHistoryIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        }

        // Add new state
        this.history.push({
            state,
            timestamp: new Date().toISOString()
        });

        // Maintain history size
        if (this.history.length > this.MAX_HISTORY) {
            this.history.shift();
        } else {
            this.currentHistoryIndex++;
        }
    }

    private restoreHistoryState(entry: HistoryEntry): void {
        const { state } = entry;
        if (state.leaveData) {
            localStorage.setItem('leaveData', StorageService.compress(state.leaveData));
        }
        if (state.settings) {
            localStorage.setItem('settings', JSON.stringify(state.settings));
        }
        this.notifyListeners('historyChange', state);
    }

    private setupStorageListener(): void {
        window.addEventListener('storage', (event) => {
            if (event.key === 'leaveData' || event.key === 'settings') {
                this.notifyListeners(event.key, event.newValue ? JSON.parse(event.newValue) : null);
            }
        });
    }

    private notifyListeners(event: string, data: any): void {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }

    private static handleStorageError(operation: 'read' | 'write', error: any): void {
        const errorData = {
            operation,
            timestamp: new Date().toISOString(),
            error: error.message
        };
        console.error('Storage operation failed:', errorData);
        // You could implement additional error handling here
    }
}

// Initialize static instance
StorageService.getInstance();

export default StorageService;
