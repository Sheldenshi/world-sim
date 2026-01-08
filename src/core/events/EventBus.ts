/**
 * EventBus - Pub/Sub system for game events
 * Allows loose coupling between different parts of the simulation
 */

import type { GameEvent, GameEventType } from '../types';

export type EventHandler<T = unknown> = (event: GameEvent<T>) => void;

export class EventBus {
  private listeners: Map<GameEventType, Set<EventHandler<unknown>>> = new Map();
  private wildcardListeners: Set<EventHandler<unknown>> = new Set();
  private eventLog: GameEvent[] = [];
  private maxLogSize: number;

  constructor(maxLogSize: number = 1000) {
    this.maxLogSize = maxLogSize;
  }

  /**
   * Subscribe to a specific event type
   */
  on<T = unknown>(type: GameEventType, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler as EventHandler<unknown>);

    // Return unsubscribe function
    return () => this.off(type, handler);
  }

  /**
   * Subscribe to all events (useful for logging/debugging)
   */
  onAll(handler: EventHandler<unknown>): () => void {
    this.wildcardListeners.add(handler);
    return () => this.wildcardListeners.delete(handler);
  }

  /**
   * Unsubscribe from a specific event type
   */
  off<T = unknown>(type: GameEventType, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler as EventHandler<unknown>);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T = unknown>(type: GameEventType, payload: T): void {
    const event: GameEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    // Log the event
    this.logEvent(event);

    // Notify specific listeners
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${type}:`, error);
        }
      });
    }

    // Notify wildcard listeners
    this.wildcardListeners.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in wildcard event handler for ${type}:`, error);
      }
    });
  }

  /**
   * Emit an event and wait for all async handlers to complete
   */
  async emitAsync<T = unknown>(type: GameEventType, payload: T): Promise<void> {
    const event: GameEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    this.logEvent(event);

    const handlers = this.listeners.get(type);
    const promises: Promise<void>[] = [];

    if (handlers) {
      handlers.forEach((handler) => {
        promises.push(
          Promise.resolve().then(() => handler(event)).catch((error) => {
            console.error(`Error in async event handler for ${type}:`, error);
          })
        );
      });
    }

    this.wildcardListeners.forEach((handler) => {
      promises.push(
        Promise.resolve().then(() => handler(event)).catch((error) => {
          console.error(`Error in async wildcard event handler for ${type}:`, error);
        })
      );
    });

    await Promise.all(promises);
  }

  /**
   * Subscribe to an event that fires only once
   */
  once<T = unknown>(type: GameEventType, handler: EventHandler<T>): () => void {
    const wrappedHandler: EventHandler<T> = (event) => {
      this.off(type, wrappedHandler);
      handler(event);
    };
    return this.on(type, wrappedHandler);
  }

  /**
   * Get the event log
   */
  getEventLog(): GameEvent[] {
    return [...this.eventLog];
  }

  /**
   * Get events of a specific type from the log
   */
  getEventsByType(type: GameEventType): GameEvent[] {
    return this.eventLog.filter((e) => e.type === type);
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
    this.wildcardListeners.clear();
  }

  /**
   * Clear the event log
   */
  clearLog(): void {
    this.eventLog = [];
  }

  private logEvent(event: GameEvent): void {
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
  }
}

// Singleton instance for global event bus
let globalEventBus: EventBus | null = null;

export function getGlobalEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}

export function resetGlobalEventBus(): void {
  if (globalEventBus) {
    globalEventBus.clear();
    globalEventBus.clearLog();
  }
  globalEventBus = null;
}
