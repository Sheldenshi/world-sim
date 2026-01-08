"use client";

import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import type { Character } from "@/types";

export default function CharacterPanel() {
  const { characters } = useGameStore();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white shadow-xl border border-gray-700">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>👥</span> Characters
      </h2>

      <div className="space-y-3">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            isSelected={selectedCharacter === character.id}
            onSelect={() =>
              setSelectedCharacter(
                selectedCharacter === character.id ? null : character.id
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

function CharacterCard({
  character,
  isSelected,
  onSelect,
}: {
  character: Character;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`bg-gray-800/50 rounded-lg p-3 border-l-4 cursor-pointer transition-all ${
        isSelected ? "ring-2 ring-white/30" : "hover:bg-gray-800/70"
      }`}
      style={{ borderColor: character.color }}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: character.color }}
        />
        <span className="font-semibold">{character.name}</span>
        <span className="text-lg ml-auto">{character.currentActionEmoji}</span>
      </div>
      <div className="text-xs text-gray-400">{character.occupation}</div>
      <div className="text-sm text-gray-300 mt-1 truncate">
        {character.currentAction}
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2 text-xs">
          <div className="text-gray-400">
            <span className="text-gray-500">Age:</span> {character.age}
          </div>
          <div className="text-gray-400">
            <span className="text-gray-500">Personality:</span>{" "}
            {character.personality}
          </div>
          <div className="text-gray-400">
            <span className="text-gray-500">Position:</span> ({character.position.x},{" "}
            {character.position.y})
          </div>

          {/* Relationships */}
          {Object.keys(character.relationships).length > 0 && (
            <div className="mt-2">
              <div className="text-gray-500 mb-1">Relationships:</div>
              {Object.entries(character.relationships).map(([id, rel]) => (
                <div key={id} className="text-gray-400 pl-2 flex items-center gap-1">
                  <span
                    className={`text-xs ${
                      rel.sentiment > 0.3
                        ? "text-green-400"
                        : rel.sentiment < -0.3
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {rel.sentiment > 0.3 ? "❤️" : rel.sentiment < -0.3 ? "💔" : "🤝"}
                  </span>
                  {rel.description}
                </div>
              ))}
            </div>
          )}

          {/* Recent memories */}
          {character.memoryStream.length > 0 && (
            <div className="mt-2">
              <div className="text-gray-500 mb-1">
                Memories ({character.memoryStream.length}):
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {character.memoryStream.slice(-3).map((mem) => (
                  <div
                    key={mem.id}
                    className={`text-xs pl-2 ${
                      mem.type === "reflection"
                        ? "text-purple-400"
                        : mem.type === "conversation"
                        ? "text-blue-400"
                        : mem.type === "plan"
                        ? "text-yellow-400"
                        : "text-gray-400"
                    }`}
                  >
                    <span className="text-gray-600">
                      {mem.type === "reflection" && "💭 "}
                      {mem.type === "conversation" && "💬 "}
                      {mem.type === "plan" && "📋 "}
                      {mem.type === "observation" && "👁️ "}
                    </span>
                    {mem.content.length > 50
                      ? mem.content.substring(0, 50) + "..."
                      : mem.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Importance accumulator (for reflection) */}
          <div className="mt-2">
            <div className="text-gray-500 mb-1">Reflection Progress:</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (character.importanceAccumulator / 150) * 100)}%`,
                }}
              />
            </div>
            <div className="text-gray-500 text-right mt-0.5">
              {character.importanceAccumulator.toFixed(0)}/150
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
