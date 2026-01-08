"use client";

import { useState, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import type { Character, UserCommand } from "@/types";
import { createMemory } from "@/lib/memory";
import { generateAgentSummary } from "@/lib/agentSummary";

interface UserCommandsPanelProps {
  selectedCharacter?: Character;
}

export default function UserCommandsPanel({
  selectedCharacter,
}: UserCommandsPanelProps) {
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<{
    interpretation: string;
    motivation: number;
    plannedActions: Array<{
      action: string;
      timing: string;
      reason: string;
    }>;
    internalThought: string;
  } | null>(null);

  const { addMemory, addToLog, time } = useGameStore();

  const characters = useGameStore((state) => state.characters);

  const handleSubmitCommand = useCallback(async () => {
    if (!selectedCharacter || !command.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      // Generate agent summary for context
      const characterSummary = generateAgentSummary(selectedCharacter, time);

      // Get relevant memories
      const relevantMemories = selectedCharacter.memoryStream
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 5)
        .map((m) => m.content)
        .join("\n");

      const response = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterSummary,
          command: command.trim(),
          currentActivity: selectedCharacter.currentAction,
          relevantMemories,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process command");
      }

      const result = await response.json();
      setLastResponse(result);

      // Add the command as a memory
      const commandMemory = createMemory(
        `I had an inner thought: "${command.trim()}" - ${result.interpretation}`,
        "command"
      );
      commandMemory.importance = Math.round(result.motivation * 10);
      addMemory(selectedCharacter.id, commandMemory);

      // Log the event
      addToLog(
        `${selectedCharacter.name} received inner voice: "${command.trim()}"`
      );

      // Clear the command input
      setCommand("");
    } catch (error) {
      console.error("Error processing command:", error);
      setLastResponse(null);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedCharacter, command, isProcessing, time, addMemory, addToLog]);

  // Preset command suggestions
  const presetCommands = [
    "You should throw a party for your friends",
    "You're curious about what's happening at Caltech",
    "You want to spend more time with your best friend",
    "You're feeling like you need a break from work",
    "You want to try something new and exciting",
    "You're thinking about your future career",
  ];

  if (!selectedCharacter) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-4">
        <div className="text-center">
          <p className="text-lg mb-2">👤 Select a character</p>
          <p className="text-sm">
            Click on a character to send them inner voice commands
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-950 p-4 overflow-hidden">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
          🧠 Inner Voice
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Send suggestions to{" "}
          <span className="text-white font-medium">
            {selectedCharacter.name}
          </span>
          's inner thoughts
        </p>
      </div>

      {/* Character current state */}
      <div className="bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: selectedCharacter.color }}
          />
          <span className="text-sm font-medium text-white">
            {selectedCharacter.name}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          <p>
            Currently:{" "}
            <span className="text-gray-300">
              {selectedCharacter.currentActionEmoji}{" "}
              {selectedCharacter.currentAction}
            </span>
          </p>
        </div>
      </div>

      {/* Command input */}
      <div className="mb-4">
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmitCommand();
            }
          }}
          placeholder="Enter a thought or suggestion..."
          className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-amber-500 transition-colors"
          rows={3}
          disabled={isProcessing}
        />
        <button
          onClick={handleSubmitCommand}
          disabled={!command.trim() || isProcessing}
          className="w-full mt-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <span className="animate-spin">⏳</span>
              Processing...
            </>
          ) : (
            <>
              <span>💭</span>
              Send Inner Thought
            </>
          )}
        </button>
      </div>

      {/* Preset suggestions */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
        <div className="flex flex-wrap gap-1">
          {presetCommands.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setCommand(preset)}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-full transition-colors truncate max-w-[200px]"
              title={preset}
            >
              {preset.length > 30 ? preset.slice(0, 30) + "..." : preset}
            </button>
          ))}
        </div>
      </div>

      {/* Response */}
      {lastResponse && (
        <div className="flex-1 overflow-auto">
          <div className="bg-gray-800/70 rounded-lg p-3 border border-gray-700">
            <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
              💬 Response
            </h4>

            {/* Interpretation */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Interpretation:</p>
              <p className="text-sm text-white italic">
                "{lastResponse.interpretation}"
              </p>
            </div>

            {/* Motivation */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Motivation level:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
                    style={{ width: `${lastResponse.motivation * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {Math.round(lastResponse.motivation * 100)}%
                </span>
              </div>
            </div>

            {/* Internal thought */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Internal thought:</p>
              <p className="text-sm text-gray-300 bg-gray-900/50 p-2 rounded italic">
                "{lastResponse.internalThought}"
              </p>
            </div>

            {/* Planned actions */}
            {lastResponse.plannedActions &&
              lastResponse.plannedActions.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Planned actions:</p>
                  <div className="space-y-2">
                    {lastResponse.plannedActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-900/50 p-2 rounded text-xs"
                      >
                        <p className="text-amber-300 font-medium">
                          {action.timing}: {action.action}
                        </p>
                        <p className="text-gray-500 mt-0.5">{action.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Info about Inner Voice */}
      {!lastResponse && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 text-xs px-4">
            <p className="mb-2">💡 The Inner Voice feature allows you to</p>
            <p className="mb-2">influence an agent's thoughts and goals.</p>
            <p>Try suggesting activities like throwing a party!</p>
          </div>
        </div>
      )}
    </div>
  );
}
