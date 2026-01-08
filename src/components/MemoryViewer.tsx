"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import type { Memory } from "@/types";

export default function MemoryViewer() {
  const { characters } = useGameStore();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<Memory["type"] | "all">("all");

  const selectedChar = characters.find((c) => c.id === selectedCharacter);
  const memories = selectedChar?.memoryStream || [];

  const filteredMemories = filterType === "all"
    ? memories
    : memories.filter((m) => m.type === filterType);

  const sortedMemories = [...filteredMemories].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  const getTypeColor = (type: Memory["type"]) => {
    switch (type) {
      case "observation":
        return "text-blue-400";
      case "reflection":
        return "text-purple-400";
      case "plan":
        return "text-green-400";
      case "conversation":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getTypeEmoji = (type: Memory["type"]) => {
    switch (type) {
      case "observation":
        return "👁️";
      case "reflection":
        return "💭";
      case "plan":
        return "📋";
      case "conversation":
        return "💬";
      default:
        return "📝";
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white shadow-xl border border-gray-700">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>🧠</span> Memory Stream
      </h2>

      {/* Character selector */}
      <div className="mb-3">
        <select
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          value={selectedCharacter || ""}
          onChange={(e) => setSelectedCharacter(e.target.value || null)}
        >
          <option value="">Select character...</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.memoryStream.length} memories)
            </option>
          ))}
        </select>
      </div>

      {selectedCharacter && (
        <>
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-1 mb-3">
            {(["all", "observation", "reflection", "plan", "conversation"] as const).map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    filterType === type
                      ? "bg-gray-600 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-400"
                  }`}
                >
                  {type === "all" ? "All" : `${getTypeEmoji(type)} ${type}`}
                </button>
              )
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3 text-center">
            <div className="bg-gray-800/50 rounded p-1">
              <div className="text-xs text-gray-400">👁️</div>
              <div className="text-sm font-bold text-blue-400">
                {memories.filter((m) => m.type === "observation").length}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded p-1">
              <div className="text-xs text-gray-400">💭</div>
              <div className="text-sm font-bold text-purple-400">
                {memories.filter((m) => m.type === "reflection").length}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded p-1">
              <div className="text-xs text-gray-400">📋</div>
              <div className="text-sm font-bold text-green-400">
                {memories.filter((m) => m.type === "plan").length}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded p-1">
              <div className="text-xs text-gray-400">💬</div>
              <div className="text-sm font-bold text-yellow-400">
                {memories.filter((m) => m.type === "conversation").length}
              </div>
            </div>
          </div>

          {/* Importance accumulator */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-1">
              Reflection threshold: {selectedChar?.importanceAccumulator?.toFixed(0) || 0} / 150
            </div>
            <div className="h-2 bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{
                  width: `${Math.min(100, ((selectedChar?.importanceAccumulator || 0) / 150) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Memory list */}
          <div className="bg-gray-800/50 rounded-lg p-3 max-h-64 overflow-y-auto">
            {sortedMemories.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-4">
                No memories yet...
              </div>
            ) : (
              <div className="space-y-2">
                {sortedMemories.slice(0, 50).map((memory) => (
                  <div
                    key={memory.id}
                    className="bg-gray-700/50 rounded p-2 text-xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getTypeEmoji(memory.type)}</span>
                      <span className={`font-medium ${getTypeColor(memory.type)}`}>
                        {memory.type}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">{formatTime(memory.createdAt)}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-orange-400">⚡{memory.importance}</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{memory.content}</p>
                    {memory.pointers && memory.pointers.length > 0 && (
                      <p className="text-gray-500 mt-1">
                        ↳ Based on {memory.pointers.length} memories
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

