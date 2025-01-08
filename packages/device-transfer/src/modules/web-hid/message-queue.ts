import type { Request } from './types';
export class HIDMessageQueue {
  private queue: Map<string, Request> = new Map();

  add(messageId: string, data: Request): void {
    this.queue.set(messageId, data);
  }

  remove(messageId: string): void {
    this.queue.delete(messageId);
  }

  get(messageId: string): Request | undefined {
    return this.queue.get(messageId);
  }
  entries() {
    return this.queue.entries();
  }
  clear(): void {
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
