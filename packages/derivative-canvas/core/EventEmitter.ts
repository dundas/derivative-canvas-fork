import type { FrameworkEvent } from './types';

export class EventEmitter {
  private events = new Map<FrameworkEvent, Set<Function>>();

  on(event: FrameworkEvent, handler: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  off(event: FrameworkEvent, handler: Function): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  emit(event: FrameworkEvent, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      });
    }
  }

  removeAllListeners(event?: FrameworkEvent): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  listenerCount(event: FrameworkEvent): number {
    return this.events.get(event)?.size || 0;
  }

  eventNames(): FrameworkEvent[] {
    return Array.from(this.events.keys());
  }
}