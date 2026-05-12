import type { Request } from './types';
export class HIDMessageQueue {
  private queue: Map<string, Request> | Array<[string, Request]>;
  constructor(queueType?: 'map' | 'arrary') {
    if (queueType && queueType === 'arrary') {
      this.queue = [];
    } else {
      this.queue = new Map();
    }
  }
  add(messageId: string, data: Request): void {
    if (Array.isArray(this.queue)) {
      this.queue.push([messageId, data]);
      return;
    }
    this.queue.set(messageId, data);
  }

  remove(messageId: string): void {
    if (Array.isArray(this.queue)) {
      const idx = this.queue.findIndex(([id]) => id === messageId);
      if (idx < 0) {
        return;
      }
      this.queue.splice(idx, 1);
      return;
    }
    this.queue.delete(messageId);
  }

  get(messageId: string): Request | undefined {
    if (Array.isArray(this.queue)) {
      const [_, data] = this.queue.find(([id]) => id === messageId) || [];
      return data;
    }
    return this.queue.get(messageId);
  }
  entries() {
    // if (this.queue instanceof Array) {
    //   return this.queue.entries()
    // }
    return this.queue.entries();
  }
  clear(): void {
    if (Array.isArray(this.queue)) {
      this.queue.forEach(([_, i]) => clearTimeout(i.timeoutId));
      this.queue = [];
      return;
    }
    this.queue.forEach(i => clearTimeout(i.timeoutId));
    this.queue.clear();
  }
}
export class HIDMessageListener {
  private listeners: Map<string, Array<(data?: any) => void>> = new Map();

  dispathOn(name: string, callback: (data?: any) => void): void {
    if (!this.listeners.get(name)) {
      this.listeners.set(name, []);
    }
    const callbacks = this.listeners.get(name)!;
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }
  }
  dispathOff(name: string, callback: (data?: any) => void): void {
    if (!this.listeners.has(name)) return;
    const callbacks = this.listeners.get(name)!;
    const filteredCallbacks = callbacks.filter(cb => cb !== callback);
    if (filteredCallbacks.length === 0) {
      this.listeners.delete(name);
    } else {
      this.listeners.set(name, filteredCallbacks);
    }
  }
  get(name: string) {
    return this.listeners.get(name);
  }
  clear() {
    this.listeners.clear();
  }
}
