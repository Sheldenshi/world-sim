"use client";

import { useState, useRef, useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { retrieveMemories, formatMemoriesForContext } from "@/lib/memory";

interface InterviewMessage {
  role: "user" | "character";
  content: string;
  characterName?: string;
}

export default function InterviewPanel() {
  const { characters, time } = useGameStore();
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom within the container only (not the page)
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAsk = async () => {
    if (!selectedCharacter || !question.trim()) return;

    const character = characters.find((c) => c.id === selectedCharacter);
    if (!character) return;

    // Add user's question to messages
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsAsking(true);

    try {
      // Retrieve relevant memories for the question
      const relevantMemories = retrieveMemories(
        character.memoryStream,
        question,
        Date.now(),
        48, // Last 48 game hours
        { recency: 0.5, importance: 1, relevance: 2 },
        10
      );

      const memoryContext = formatMemoriesForContext(relevantMemories);

      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: {
            name: character.name,
            age: character.age,
            occupation: character.occupation,
            personality: character.personality,
            lifestyle: character.lifestyle,
            currentAction: character.currentAction,
          },
          memories: memoryContext,
          question: question,
          time: {
            hour: time.hour,
            minute: time.minute,
            day: time.day,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "character",
            content: data.response,
            characterName: character.name,
          },
        ]);
      }
    } catch (error) {
      console.error("Interview failed:", error);
    }

    setQuestion("");
    setIsAsking(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const selectedChar = characters.find((c) => c.id === selectedCharacter);

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white shadow-xl border border-gray-700">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span>🎤</span> Interview Agent
      </h2>

      <p className="text-xs text-gray-400 mb-3">
        Ask questions to learn about the characters' inner lives and memories.
      </p>

      {/* Character selector */}
      <div className="mb-3">
        <label className="text-sm text-gray-400 mb-1 block">
          Select character:
        </label>
        <select
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          value={selectedCharacter || ""}
          onChange={(e) => {
            setSelectedCharacter(e.target.value || null);
            setMessages([]);
          }}
        >
          <option value="">Choose...</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.occupation})
            </option>
          ))}
        </select>
      </div>

      {selectedCharacter && (
        <>
          {/* Character info */}
          <div
            className="bg-gray-800/50 rounded-lg p-3 mb-3 border-l-4"
            style={{ borderColor: selectedChar?.color }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedChar?.color }}
              />
              <span className="font-semibold">{selectedChar?.name}</span>
            </div>
            <p className="text-xs text-gray-400">
              Currently: {selectedChar?.currentAction}
            </p>
            <p className="text-xs text-gray-500">
              Memories: {selectedChar?.memoryStream.length || 0}
            </p>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="bg-gray-800/50 rounded-lg p-3 max-h-48 overflow-y-auto mb-3">
            {messages.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-4">
                Ask {selectedChar?.name} a question...
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-2 ${
                      msg.role === "user" ? "justify-end" : ""
                    }`}
                  >
                    {msg.role === "character" && (
                      <div
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: selectedChar?.color }}
                      />
                    )}
                    <div
                      className={`text-sm p-2 rounded-lg max-w-[85%] ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-200"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Question input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              disabled={isAsking}
            />
            <button
              onClick={handleAsk}
              disabled={!question.trim() || isAsking}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              {isAsking ? "..." : "Ask"}
            </button>
          </div>

          {/* Suggested questions */}
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-1">
              {[
                "What's on your mind today?",
                "Tell me about your friends",
                "What do you enjoy most?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

