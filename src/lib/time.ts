import type { GameTime } from "@/types";

export function formatTime(time: GameTime): string {
  const hour = time.hour.toString().padStart(2, "0");
  const minute = time.minute.toString().padStart(2, "0");
  return `Day ${time.day} - ${hour}:${minute}`;
}

export function formatTimeShort(time: GameTime): string {
  const hour = time.hour.toString().padStart(2, "0");
  const minute = time.minute.toString().padStart(2, "0");
  const period = time.hour >= 12 ? "PM" : "AM";
  const displayHour = time.hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

export function getTimeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function getSkyColor(hour: number): string {
  if (hour >= 6 && hour < 8) return "#ff9a8b"; // Dawn
  if (hour >= 8 && hour < 17) return "#87ceeb"; // Day
  if (hour >= 17 && hour < 19) return "#ff7e5f"; // Sunset
  if (hour >= 19 && hour < 21) return "#4a4e69"; // Dusk
  return "#1a1a2e"; // Night
}

export function getGroundColor(hour: number): string {
  if (hour >= 6 && hour < 19) return "#7ec850"; // Day grass
  if (hour >= 19 && hour < 21) return "#5a8a3a"; // Dusk grass
  return "#3d5a2a"; // Night grass
}

// Calculate in-game minutes from real milliseconds
export function realToGameTime(realMs: number, speed: number): number {
  // 1 real second = 1 game minute at speed 1
  return (realMs / 1000) * speed;
}

// Check if two times are within a certain range (in game minutes)
export function isWithinTimeRange(
  time1: GameTime,
  time2: GameTime,
  rangeMinutes: number
): boolean {
  const totalMinutes1 = time1.day * 24 * 60 + time1.hour * 60 + time1.minute;
  const totalMinutes2 = time2.day * 24 * 60 + time2.hour * 60 + time2.minute;
  return Math.abs(totalMinutes1 - totalMinutes2) <= rangeMinutes;
}

// Get a description of the current time context for AI
export function getTimeContext(time: GameTime): string {
  const timeOfDay = getTimeOfDay(time.hour);
  const formattedTime = formatTimeShort(time);
  return `It is ${timeOfDay}, ${formattedTime} on Day ${time.day}.`;
}

