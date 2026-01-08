/**
 * TimeSystem - Manages game time, progression, and time-based events
 */

import type { GameTime, TimeOfDay } from '../types';
import { EventBus } from '../events/EventBus';

export interface TimeSystemConfig {
  initialTime?: Partial<GameTime>;
  tickIntervalMs?: number; // Real-world milliseconds per tick
}

const DEFAULT_TIME: GameTime = {
  day: 1,
  hour: 8,
  minute: 0,
  speed: 1,
  isPaused: false,
};

export class TimeSystem {
  private time: GameTime;
  private eventBus: EventBus;
  private tickInterval: number | null = null;
  private tickIntervalMs: number;
  private lastTickTime: number = 0;

  constructor(eventBus: EventBus, config: TimeSystemConfig = {}) {
    this.eventBus = eventBus;
    this.tickIntervalMs = config.tickIntervalMs ?? 1000; // Default 1 second per tick
    this.time = {
      ...DEFAULT_TIME,
      ...config.initialTime,
    };
  }

  /**
   * Get current game time
   */
  getTime(): GameTime {
    return { ...this.time };
  }

  /**
   * Set the game time
   */
  setTime(time: Partial<GameTime>): void {
    const oldTime = { ...this.time };
    this.time = { ...this.time, ...time };

    if (time.day !== undefined && time.day !== oldTime.day) {
      this.eventBus.emit('time:day-changed', { oldDay: oldTime.day, newDay: time.day });
    }
    if (time.hour !== undefined && time.hour !== oldTime.hour) {
      this.eventBus.emit('time:hour-changed', { oldHour: oldTime.hour, newHour: time.hour });
    }
  }

  /**
   * Advance time by one tick
   */
  tick(): void {
    if (this.time.isPaused) return;

    const oldTime = { ...this.time };
    let { minute, hour, day } = this.time;

    // Advance by speed amount
    minute += this.time.speed;

    // Handle minute overflow
    if (minute >= 60) {
      const hoursToAdd = Math.floor(minute / 60);
      minute = minute % 60;
      hour += hoursToAdd;

      // Emit hour changed for each hour that passed
      for (let i = 0; i < hoursToAdd; i++) {
        const newHour = (oldTime.hour + i + 1) % 24;
        this.eventBus.emit('time:hour-changed', {
          oldHour: (newHour - 1 + 24) % 24,
          newHour,
          day: oldTime.day + Math.floor((oldTime.hour + i + 1) / 24),
        });
      }
    }

    // Handle day overflow
    if (hour >= 24) {
      const daysToAdd = Math.floor(hour / 24);
      hour = hour % 24;
      day += daysToAdd;

      // Emit day changed
      for (let i = 0; i < daysToAdd; i++) {
        this.eventBus.emit('time:day-changed', {
          oldDay: oldTime.day + i,
          newDay: oldTime.day + i + 1,
        });
      }
    }

    this.time = { ...this.time, minute, hour, day };
    this.eventBus.emit('time:tick', { time: this.getTime(), delta: this.time.speed });
  }

  /**
   * Start automatic time progression
   */
  start(): void {
    if (this.tickInterval !== null) return;

    this.lastTickTime = Date.now();
    this.tickInterval = window.setInterval(() => {
      this.tick();
    }, this.tickIntervalMs);
  }

  /**
   * Stop automatic time progression
   */
  stop(): void {
    if (this.tickInterval !== null) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    if (!this.time.isPaused) {
      this.time.isPaused = true;
      this.eventBus.emit('time:paused', { time: this.getTime() });
    }
  }

  /**
   * Resume the simulation
   */
  resume(): void {
    if (this.time.isPaused) {
      this.time.isPaused = false;
      this.eventBus.emit('time:resumed', { time: this.getTime() });
    }
  }

  /**
   * Toggle pause state
   */
  togglePause(): void {
    if (this.time.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Set simulation speed
   */
  setSpeed(speed: number): void {
    const oldSpeed = this.time.speed;
    this.time.speed = Math.max(0.1, Math.min(60, speed)); // Clamp between 0.1 and 60
    this.eventBus.emit('time:speed-changed', { oldSpeed, newSpeed: this.time.speed });
  }

  /**
   * Get time of day
   */
  getTimeOfDay(): TimeOfDay {
    const { hour } = this.time;
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Format time for display
   */
  formatTime(): string {
    const { day, hour, minute } = this.time;
    const hourStr = hour.toString().padStart(2, '0');
    const minuteStr = minute.toString().padStart(2, '0');
    return `Day ${day} - ${hourStr}:${minuteStr}`;
  }

  /**
   * Format time in 12-hour format
   */
  formatTime12h(): string {
    const { hour, minute } = this.time;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const minuteStr = minute.toString().padStart(2, '0');
    return `${displayHour}:${minuteStr} ${period}`;
  }

  /**
   * Get time context description for AI
   */
  getTimeContext(): string {
    const timeOfDay = this.getTimeOfDay();
    const formattedTime = this.formatTime12h();
    return `It is ${timeOfDay}, ${formattedTime} on Day ${this.time.day}.`;
  }

  /**
   * Get sky color based on time
   */
  getSkyColor(): string {
    const { hour } = this.time;
    if (hour >= 6 && hour < 8) return '#ff9a8b'; // Dawn
    if (hour >= 8 && hour < 17) return '#87ceeb'; // Day
    if (hour >= 17 && hour < 19) return '#ff7e5f'; // Sunset
    if (hour >= 19 && hour < 21) return '#4a4e69'; // Dusk
    return '#1a1a2e'; // Night
  }

  /**
   * Get ground color based on time
   */
  getGroundColor(): string {
    const { hour } = this.time;
    if (hour >= 6 && hour < 19) return '#7ec850'; // Day grass
    if (hour >= 19 && hour < 21) return '#5a8a3a'; // Dusk grass
    return '#3d5a2a'; // Night grass
  }

  /**
   * Calculate total minutes elapsed since day 1, hour 0
   */
  getTotalMinutes(): number {
    return (this.time.day - 1) * 24 * 60 + this.time.hour * 60 + this.time.minute;
  }

  /**
   * Check if two times are within a certain range (in game minutes)
   */
  isWithinRange(other: GameTime, rangeMinutes: number): boolean {
    const thisTotal = this.getTotalMinutes();
    const otherTotal = (other.day - 1) * 24 * 60 + other.hour * 60 + other.minute;
    return Math.abs(thisTotal - otherTotal) <= rangeMinutes;
  }

  /**
   * Serialize time state
   */
  serialize(): GameTime {
    return { ...this.time };
  }

  /**
   * Deserialize and restore time state
   */
  deserialize(time: GameTime): void {
    this.time = { ...time };
  }

  /**
   * Reset to default time
   */
  reset(): void {
    this.time = { ...DEFAULT_TIME };
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.stop();
  }
}
