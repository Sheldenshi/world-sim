'use client';

import { useState } from 'react';
import GameCanvas from '@/components/GameCanvas';
import TimeDisplay from '@/components/TimeDisplay';
import CharacterPanel from '@/components/CharacterPanel';
import ConversationPanel from '@/components/ConversationPanel';
import SimulationLog from '@/components/SimulationLog';
import InterviewPanel from '@/components/InterviewPanel';
import MemoryViewer from '@/components/MemoryViewer';
import UserCommandsPanel from '@/components/UserCommandsPanel';
import DiffusionViewer from '@/components/DiffusionViewer';
import { useGameStore } from '@/store/gameStore';

type RightTab =
	| 'conversation'
	| 'interview'
	| 'memory'
	| 'commands'
	| 'diffusion';

export default function Home() {
	const [rightTab, setRightTab] = useState<RightTab>('conversation');
	const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
		null
	);
	const characters = useGameStore((state) => state.characters);
	const selectedCharacter = selectedCharacterId
		? characters.find((c) => c.id === selectedCharacterId)
		: undefined;

	return (
		<main className="min-h-screen p-2 md:p-4">
			<div className="flex flex-col items-center gap-4 max-w-4xl mx-auto">
				{/* 1. Time Control */}
				<TimeDisplay />

				{/* 2. Map */}
				<div className="overflow-x-auto max-w-full">
					<GameCanvas />
				</div>

				{/* 3. Simulation Log */}
				<div className="w-full">
					<SimulationLog />
				</div>

				{/* 4. Conversations (with tabs) */}
				<div className="w-full">
					{/* Tab selector */}
					<div className="flex bg-gray-900/90 rounded-lg p-1 border border-gray-700 mb-4">
						<button
							onClick={() => setRightTab('conversation')}
							className={`flex-1 text-sm py-2 px-3 rounded transition-colors ${
								rightTab === 'conversation'
									? 'bg-blue-600 text-white'
									: 'text-gray-400 hover:text-white'
							}`}
						>
							💬 Chat
						</button>
						<button
							onClick={() => setRightTab('interview')}
							className={`flex-1 text-sm py-2 px-3 rounded transition-colors ${
								rightTab === 'interview'
									? 'bg-purple-600 text-white'
									: 'text-gray-400 hover:text-white'
							}`}
						>
							🎤 Interview
						</button>
						<button
							onClick={() => setRightTab('memory')}
							className={`flex-1 text-sm py-2 px-3 rounded transition-colors ${
								rightTab === 'memory'
									? 'bg-green-600 text-white'
									: 'text-gray-400 hover:text-white'
							}`}
						>
							🧠 Memory
						</button>
						<button
							onClick={() => setRightTab('commands')}
							className={`flex-1 text-sm py-2 px-3 rounded transition-colors ${
								rightTab === 'commands'
									? 'bg-amber-600 text-white'
									: 'text-gray-400 hover:text-white'
							}`}
						>
							💭 Voice
						</button>
						<button
							onClick={() => setRightTab('diffusion')}
							className={`flex-1 text-sm py-2 px-3 rounded transition-colors ${
								rightTab === 'diffusion'
									? 'bg-cyan-600 text-white'
									: 'text-gray-400 hover:text-white'
							}`}
						>
							📡 Gossip
						</button>
					</div>

					{/* Character selector for commands tab */}
					{rightTab === 'commands' && (
						<div className="mb-4">
							<p className="text-xs text-gray-400 mb-2">
								Select a character to influence:
							</p>
							<div className="flex flex-wrap gap-2">
								{characters.map((char) => (
									<button
										key={char.id}
										onClick={() => setSelectedCharacterId(char.id)}
										className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
											selectedCharacterId === char.id
												? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900'
												: 'hover:scale-105'
										}`}
										style={{
											backgroundColor: char.color,
											color: 'white',
										}}
									>
										{char.name.split(' ')[0]}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Tab content */}
					{rightTab === 'conversation' && <ConversationPanel />}
					{rightTab === 'interview' && <InterviewPanel />}
					{rightTab === 'memory' && <MemoryViewer />}
					{rightTab === 'commands' && (
						<UserCommandsPanel selectedCharacter={selectedCharacter} />
					)}
					{rightTab === 'diffusion' && <DiffusionViewer />}
				</div>

				{/* 5. Characters */}
				<div className="w-full">
					<CharacterPanel />
				</div>
			</div>
		</main>
	);
}
