"use client";

import { useGameStore } from "@/store/gameStore";
import { formatTime, formatTimeShort, getTimeOfDay } from "@/lib/time";

export default function TimeDisplay() {
  const { time, setTimeSpeed, togglePause } = useGameStore();

  const timeOfDay = getTimeOfDay(time.hour);

  const getTimeIcon = () => {
    switch (timeOfDay) {
      case "morning":
        return "🌅";
      case "afternoon":
        return "☀️";
      case "evening":
        return "🌆";
      case "night":
        return "🌙";
    }
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white shadow-xl border border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{getTimeIcon()}</span>
        <div>
          <div className="text-xl font-bold font-mono">
            {formatTimeShort(time)}
          </div>
          <div className="text-sm text-gray-400">Day {time.day}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={togglePause}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            time.isPaused
              ? "bg-green-600 hover:bg-green-500"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          {time.isPaused ? "▶ Play" : "⏸ Pause"}
        </button>

        <div className="flex items-center gap-1 bg-gray-800 rounded px-2">
          <span className="text-xs text-gray-400">Speed:</span>
          {[1, 2, 5, 10].map((speed) => (
            <button
              key={speed}
              onClick={() => setTimeSpeed(speed)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                time.speed === speed
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

