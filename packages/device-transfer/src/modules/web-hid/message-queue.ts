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
