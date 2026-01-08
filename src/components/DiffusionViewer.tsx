"use client";

import { useState, useEffect } from "react";
import { getDiffusionSummary, diffusionLog } from "@/lib/memory";
import { useGameStore } from "@/store/gameStore";

export default function DiffusionViewer() {
  const [summary, setSummary] = useState({
    totalEvents: 0,
    uniqueInformation: 0,
    mostDiffusedInfo: [] as { content: string; count: number }[],
    mostConnectedAgents: [] as { id: string; count: number }[],
  });

  const characters = useGameStore((state) => state.characters);

  // Refresh summary periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getDiffusionSummary());
    }, 5000);

    setSummary(getDiffusionSummary());
    return () => clearInterval(interval);
  }, []);

  const getCharacterName = (id: string) => {
    const char = characters.find((c) => c.id === id);
    return char?.name.split(" ")[0] || id;
  };

  const getCharacterColor = (id: string) => {
    const char = characters.find((c) => c.id === id);
    return char?.color || "#666";
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg p-4 border border-gray-700">
      <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
        📡 Information Diffusion
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-cyan-400">
            {summary.totalEvents}
          </p>
          <p className="text-xs text-gray-400">Info Shares</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {summary.uniqueInformation}
          </p>
          <p className="text-xs text-gray-400">Unique Facts</p>
        </div>
      </div>

      {/* Most shared information */}
      {summary.mostDiffusedInfo.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">
            🔥 Most Shared Info
          </h4>
          <div className="space-y-2">
            {summary.mostDiffusedInfo.slice(0, 3).map((info, idx) => (
              <div
                key={idx}
                className="bg-gray-800/50 rounded-lg p-2 text-xs"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-cyan-400 font-medium">
                    {info.count}x shared
                  </span>
                </div>
                <p className="text-gray-300 line-clamp-2">{info.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most connected agents */}
      {summary.mostConnectedAgents.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">
            🌐 Social Hubs
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.mostConnectedAgents.map((agent, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-gray-800/50 rounded-full px-3 py-1"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getCharacterColor(agent.id) }}
                />
                <span className="text-xs text-white">
                  {getCharacterName(agent.id)}
                </span>
                <span className="text-xs text-gray-400">({agent.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent events */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          📜 Recent Shares
        </h4>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {diffusionLog
            .slice(-10)
            .reverse()
            .map((event, idx) => (
              <div
                key={event.id}
                className="bg-gray-800/30 rounded p-2 text-xs border-l-2"
                style={{ borderColor: getCharacterColor(event.sourceCharacterId) }}
              >
                <div className="flex items-center gap-1 text-gray-400">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: getCharacterColor(event.sourceCharacterId),
                    }}
                  />
                  <span className="font-medium text-white">
                    {getCharacterName(event.sourceCharacterId)}
                  </span>
                  <span>→</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: getCharacterColor(event.targetCharacterId),
                    }}
                  />
                  <span className="font-medium text-white">
                    {getCharacterName(event.targetCharacterId)}
                  </span>
                </div>
                <p className="text-gray-300 mt-1 line-clamp-1">
                  {event.originalContent}
                </p>
              </div>
            ))}

          {diffusionLog.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-4">
              No information has been shared yet.
              <br />
              Agents will share news during conversations.
            </p>
          )}
        </div>
      </div>

      {/* Info about diffusion */}
      <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
        <p className="text-xs text-gray-500">
          💡 Information diffusion tracks how news and gossip spreads through
          the social network. When agents have conversations, they may share
          important memories with each other.
        </p>
      </div>
    </div>
  );
}
