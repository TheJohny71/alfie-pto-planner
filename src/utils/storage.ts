// src/services/storage/types.ts

import { LeaveData, PTOSettings } from '../../types';

export interface StorageState {
  leaveData: LeaveData | null;
  settings: PTOSettings | null;
  version: string;
  lastUpdated: string;
}

export interface StorageHistory {
  past: StorageState[];
  future: StorageState[];
  current: StorageState | null;
}

export interface SyncMetadata {
  lastSynced: string;
  deviceId: string;
  version: string;
  status: 'synced' | 'pending' | 'error';
}

export interface CompressedData {
  data: string; // Base64 encoded compressed data
  algorithm: 'lz' | 'gzip';
  originalSize: number;
  compressedSize: number;
}

export interface StorageErrorEvent {
  code: string;
  message: string;
  timestamp: string;
  data?: unknown;
}

export type StorageEventType = 
  | 'save'
  | 'load'
  | 'sync'
  | 'error'
  | 'undo'
  | 'redo'
  | 'compress'
  | 'decompress';

export interface StorageEventCallback {
  (event: StorageEventType, data?: unknown): void;
}
// src/services/storage/compression.ts

import { CompressedData } from './types';

export class CompressionUtil {
  private static instance: CompressionUtil;
  private constructor() {}

  static getInstance(): CompressionUtil {
    if (!CompressionUtil.instance) {
      CompressionUtil.instance = new CompressionUtil();
    }
    return CompressionUtil.instance;
  }

  async compress(data: unknown): Promise<CompressedData> {
    try {
      const jsonString = JSON.stringify(data);
      const textEncoder = new TextEncoder();
      const uint8Array = textEncoder.encode(jsonString);
      
      // Use CompressionStream if available
      if ('CompressionStream' in window) {
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        const compressedStream = writer.write(uint8Array);
        await writer.close();
        
        const reader = cs.readable.getReader();
        const chunks = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        const compressedData = new Uint8Array(
          chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        );
        
        let offset = 0;
        for (const chunk of chunks) {
          compressedData.set(chunk, offset);
          offset += chunk.length;
        }
        
        return {
          data: btoa(String.fromCharCode.apply(null, [...compressedData])),
          algorithm: 'gzip',
          originalSize: uint8Array.length,
          compressedSize: compressedData.length
        };
      }
      
      // Fallback to basic LZ compression
      return this.lzCompress(jsonString);
    } catch (error) {
      console.error('Compression failed:', error);
      throw new Error('Failed to compress data');
    }
  }

  async decompress(compressed: CompressedData): Promise<unknown> {
    try {
      if (compressed.algorithm === 'gzip') {
        const compressedData = Uint8Array.from(
          atob(compressed.data)
            .split('')
            .map(char => char.charCodeAt(0))
        );
        
        if ('DecompressionStream' in window) {
          const ds = new DecompressionStream('gzip');
          const writer = ds.writable.getWriter();
          await writer.write(compressedData);
          await writer.close();
          
          const reader = ds.readable.getReader();
          const chunks = [];
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          
          const decompressedData = new Uint8Array(
            chunks.reduce((acc, chunk) => acc + chunk.length, 0)
          );
          
          let offset = 0;
          for (const chunk of chunks) {
            decompressedData.set(chunk, offset);
            offset += chunk.length;
          }
          
          const textDecoder = new TextDecoder();
          const jsonString = textDecoder.decode(decompressedData);
          return JSON.parse(jsonString);
        }
      }
      
      // Fallback to LZ decompression
      return this.lzDecompress(compressed.data);
    } catch (error) {
      console.error('Decompression failed:', error);
      throw new Error('Failed to decompress data');
    }
  }

  private lzCompress(input: string): CompressedData {
    // Basic LZ77 compression implementation
    let output = '';
    let dictionary = new Map<string, number>();
    let current = '';
    let counter = 0;

    for (let char of input) {
      current += char;
      if (!dictionary.has(current)) {
        dictionary.set(current, counter++);
        if (current.length > 1) {
          output += `${dictionary.get(current.slice(0, -1))},${char}`;
        } else {
          output += char;
        }
        current = '';
      }
    }

    return {
      data: btoa(output),
      algorithm: 'lz',
      originalSize: input.length,
      compressedSize: output.length
    };
  }

  private lzDecompress(input: string): unknown {
    // Basic LZ77 decompression implementation
    const compressed = atob(input);
    let dictionary = new Map<number, string>();
    let counter = 0;
    let output = '';
    let current = '';

    for (let i = 0; i < compressed.length; i++) {
      const char = compressed[i];
      if (char === ',') {
        const index = parseInt(current);
        if (dictionary.has(index)) {
          output += dictionary.get(index);
        }
        current = '';
      } else {
        current += char;
        if (current.length === 1) {
          dictionary.set(counter++, current);
          output += current;
          current = '';
        }
      }
    }

    return JSON.parse(output);
  }
}
// src/services/storage/history-manager.ts

import { StorageState, StorageHistory } from './types';

export class HistoryManager {
  private static instance: HistoryManager;
  private history: StorageHistory;
  private maxHistorySize: number;

  private constructor() {
    this.history = {
      past: [],
      future: [],
      current: null
    };
    this.maxHistorySize = 50; // Configurable history size
  }

  static getInstance(): HistoryManager {
    if (!HistoryManager.instance) {
      HistoryManager.instance = new HistoryManager();
    }
    return HistoryManager.instance;
  }

  push(state: StorageState): void {
    if (this.history.current) {
      this.history.past.push(this.history.current);
      if (this.history.past.length > this.maxHistorySize) {
        this.history.past.shift();
      }
    }
    this.history.current = this.deepClone(state);
    this.history.future = [];
  }

  undo(): StorageState | null {
    if (this.history.past.length === 0) return null;

    const previous = this.history.past.pop()!;
    if (this.history.current) {
      this.history.future.push(this.history.current);
    }
    this.history.current = this.deepClone(previous);
    return this.history.current;
  }

  redo(): StorageState | null {
    if (this.history.future.length === 0) return null;

    const next = this.history.future.pop()!;
    if (this.history.current) {
      this.history.past.push(this.history.current);
    }
    this.history.current = this.deepClone(next);
    return this.history.current;
  }

  getCurrentState(): StorageState | null {
    return this.history.current ? this.deepClone(this.history.current) : null;
  }

  canUndo(): boolean {
    return this.history.past.length > 0;
  }

  canRedo(): boolean {
    return this.history.future.length > 0;
  }

  clear(): void {
    this.history = {
      past: [],
      future: [],
      current: null
    };
  }

  getHistorySize(): { past: number; future: number } {
    return {
      past: this.history.past.length,
      future: this.history.future.length
    };
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
