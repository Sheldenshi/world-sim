'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
	generateCharacterResponse,
	checkConversationEnding,
} from '@/lib/openai';
import { createMemory } from '@/lib/memory';

export default function ConversationPanel() {
	const {
		characters,
		activeConversation,
		time,
		startConversation,
		addConversationMessage,
		endConversation,
		addMemory,
		addToLog,
	} = useGameStore();

	const [isGenerating, setIsGenerating] = useState(false);
	const [selectedPair, setSelectedPair] = useState<[string, string] | null>(
		null
	);
	const [autoMode, setAutoMode] = useState(false);
	const autoModeRef = useRef(false);
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive (within container only)
	useEffect(() => {
		// Only scroll if there's an active conversation with messages
		if (
			activeConversation &&
			activeConversation.messages.length > 0 &&
			messagesContainerRef.current
		) {
			messagesContainerRef.current.scrollTop =
				messagesContainerRef.current.scrollHeight;
		}
	}, [activeConversation?.messages]);

	// Update ref when autoMode changes
	useEffect(() => {
		autoModeRef.current = autoMode;
	}, [autoMode]);

	// Auto conversation loop
	useEffect(() => {
		if (!autoMode || !activeConversation || isGenerating) return;

		const runAutoConversation = async () => {
			if (!autoModeRef.current || !activeConversation) return;

			// Check if conversation should end
			const endCheck = await checkConversationEnding(
				activeConversation.messages,
				characters
			);

			if (endCheck.shouldEnd) {
				addToLog(`Conversation ended: ${endCheck.reason}`);
				endConversation(activeConversation.id);
				setSelectedPair(null);
				setAutoMode(false);
				return;
			}

			// Generate next response
			await handleContinueConversation();
		};

		const timer = setTimeout(runAutoConversation, 2000);
		return () => clearTimeout(timer);
	}, [autoMode, activeConversation, isGenerating]);

	const handleStartConversation = async () => {
		if (!selectedPair) return;

		const [id1, id2] = selectedPair;
		const char1 = characters.find((c) => c.id === id1)!;
		const char2 = characters.find((c) => c.id === id2)!;

		// Use first character's position for conversation location
		startConversation([id1, id2], char1.position);

		// Generate initial message from first character
		setIsGenerating(true);
		try {
			const response = await generateCharacterResponse({
				character: char1,
				otherCharacter: char2,
				conversationHistory: [],
				time,
			});

			addConversationMessage(useGameStore.getState().activeConversation!.id, {
				speakerId: id1,
				content: response.message,
			});

			// Add to memory
			addMemory(
				char1.id,
				createMemory(
					`I said to ${char2.name}: "${response.message}"`,
					'conversation'
				)
			);
		} catch (error) {
			console.error('Failed to start conversation:', error);
		}
		setIsGenerating(false);
	};

	const handleContinueConversation = async () => {
		if (!activeConversation || activeConversation.messages.length === 0) return;

		const lastMessage =
			activeConversation.messages[activeConversation.messages.length - 1];
		if (!lastMessage) return;

		const nextSpeakerId = activeConversation.participants.find(
			(id) => id !== lastMessage.speakerId
		)!;

		const speaker = characters.find((c) => c.id === nextSpeakerId)!;
		const otherSpeaker = characters.find(
			(c) => c.id === lastMessage.speakerId
		)!;

		setIsGenerating(true);
		try {
			const response = await generateCharacterResponse({
				character: speaker,
				otherCharacter: otherSpeaker,
				conversationHistory: activeConversation.messages,
				time,
			});

			addConversationMessage(activeConversation.id, {
				speakerId: nextSpeakerId,
				content: response.message,
			});

			// Add to both characters' memories
			addMemory(
				speaker.id,
				createMemory(
					`I said to ${otherSpeaker.name}: "${response.message}"`,
					'conversation'
				)
			);
			addMemory(
				otherSpeaker.id,
				createMemory(
					`${speaker.name} said to me: "${response.message}"`,
					'conversation'
				)
			);

			// Information diffusion: Extract and share notable information
			const sharedInfo = extractSharedInformation(response.message, speaker);
			if (sharedInfo) {
				addMemory(
					otherSpeaker.id,
					createMemory(
						`I learned from ${speaker.name}: ${sharedInfo}`,
						'observation'
					)
				);
				addToLog(
					`💡 ${otherSpeaker.name} learned something from ${speaker.name}`
				);
			}
		} catch (error) {
			console.error('Failed to continue conversation:', error);
		}
		setIsGenerating(false);
	};

	const handleEndConversation = () => {
		if (activeConversation) {
			endConversation(activeConversation.id);
			setSelectedPair(null);
			setAutoMode(false);
		}
	};

	// Extract notable information that could be shared (information diffusion)
	const extractSharedInformation = (
		message: string,
		speaker: (typeof characters)[0]
	): string | null => {
		const lowerMessage = message.toLowerCase();

		// Look for information-sharing patterns
		const sharePatterns = [
			/(?:i've been|i am|i'm)\s+([^.!?]+)/i,
			/(?:did you know|heard that|apparently)\s+([^.!?]+)/i,
			/(?:planning to|going to|thinking about)\s+([^.!?]+)/i,
			/(?:just finished|recently|yesterday)\s+([^.!?]+)/i,
		];

		for (const pattern of sharePatterns) {
			const match = message.match(pattern);
			if (match && match[1] && match[1].length > 15) {
				return `${speaker.name} ${match[0]}`;
			}
		}

		// If message mentions an event, activity, or plan
		const eventKeywords = [
			'party',
			'event',
			'meeting',
			'exhibition',
			'opening',
			'gathering',
			'celebration',
		];
		if (eventKeywords.some((kw) => lowerMessage.includes(kw))) {
			return message.length > 30 ? message.substring(0, 80) + '...' : message;
		}

		return null;
	};

	// Generate all possible pairs
	const pairs: [string, string][] = [];
	for (let i = 0; i < characters.length; i++) {
		for (let j = i + 1; j < characters.length; j++) {
			pairs.push([characters[i].id, characters[j].id]);
		}
	}

	return (
		<div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 text-white shadow-xl border border-gray-700">
			<h2 className="text-lg font-bold mb-3 flex items-center gap-2">
				<span>💬</span> Conversations
			</h2>

			{!activeConversation ? (
				<div className="space-y-3">
					<div>
						<label className="text-sm text-gray-400 mb-1 block">
							Start a conversation:
						</label>
						<select
							className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
							value={
								selectedPair ? `${selectedPair[0]}-${selectedPair[1]}` : ''
							}
							onChange={(e) => {
								if (e.target.value) {
									const [id1, id2] = e.target.value.split('-');
									setSelectedPair([id1, id2]);
								} else {
									setSelectedPair(null);
								}
							}}
						>
							<option value="">Select characters...</option>
							{pairs.map(([id1, id2]) => {
								const char1 = characters.find((c) => c.id === id1)!;
								const char2 = characters.find((c) => c.id === id2)!;
								return (
									<option key={`${id1}-${id2}`} value={`${id1}-${id2}`}>
										{char1.name} & {char2.name}
									</option>
								);
							})}
						</select>
					</div>

					<button
						className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded px-4 py-2 text-sm font-medium transition-colors"
						disabled={!selectedPair || isGenerating}
						onClick={handleStartConversation}
					>
						{isGenerating ? 'Starting...' : 'Start Conversation'}
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{/* Messages */}
					<div
						ref={messagesContainerRef}
						className="bg-gray-800/50 rounded-lg p-3 max-h-64 overflow-y-auto"
					>
						{activeConversation.messages.length === 0 ? (
							<div className="text-gray-500 text-sm text-center py-4">
								Conversation starting...
							</div>
						) : (
							<div className="space-y-3">
								{activeConversation.messages.map((msg, index) => {
									const speaker = characters.find(
										(c) => c.id === msg.speakerId
									);
									return (
										<div key={index} className="flex gap-2">
											<div
												className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
												style={{ backgroundColor: speaker?.color || '#888' }}
											/>
											<div>
												<div
													className="text-xs font-semibold"
													style={{ color: speaker?.color }}
												>
													{speaker?.name}
												</div>
												<div className="text-sm text-gray-300">
													{msg.content}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Exchange count */}
					<div className="text-xs text-gray-500 text-center">
						{activeConversation.messages.length} exchanges
						{activeConversation.messages.length >= 8 && (
							<span className="text-yellow-500 ml-2">
								(conversation may end soon)
							</span>
						)}
					</div>

					{/* Auto mode toggle */}
					<label className="flex items-center gap-2 text-sm cursor-pointer">
						<input
							type="checkbox"
							checked={autoMode}
							onChange={(e) => setAutoMode(e.target.checked)}
							className="w-4 h-4 rounded bg-gray-700 border-gray-600"
						/>
						<span className="text-gray-300">Auto-continue conversation</span>
					</label>

					{/* Controls */}
					<div className="flex gap-2">
						<button
							className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded px-4 py-2 text-sm font-medium transition-colors"
							disabled={isGenerating || autoMode}
							onClick={handleContinueConversation}
						>
							{isGenerating ? 'Thinking...' : 'Continue'}
						</button>
						<button
							className="flex-1 bg-red-600 hover:bg-red-700 rounded px-4 py-2 text-sm font-medium transition-colors"
							onClick={handleEndConversation}
						>
							End
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
