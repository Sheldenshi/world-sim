"use client";

import { useRef, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

export default function SimulationLog() {
  const { simulationLog } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom within the container only (not the page)
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [simulationLog]);

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white shadow-xl border border-gray-700">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>📜</span> Simulation Log
      </h2>

      <div ref={containerRef} className="bg-gray-800/50 rounded-lg p-3 h-48 overflow-y-auto font-mono text-xs">
        {simulationLog.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No events yet...
          </div>
        ) : (
          <div className="space-y-1">
            {simulationLog.map((log, index) => (
              <div
                key={index}
                className={`${
                  log.includes("Conversation")
                    ? "text-blue-400"
                    : log.includes("reflecting")
                    ? "text-purple-400"
                    : log.includes("insights")
                    ? "text-green-400"
                    : log.includes("Day")
                    ? "text-yellow-400"
                    : "text-gray-400"
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

