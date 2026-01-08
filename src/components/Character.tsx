'use client';

import { useEffect, useRef } from 'react';
import type { Character as CharacterType } from '@/types';
import { getColorPalette, createCharacterSprites } from '@/lib/sprites';

interface CharacterProps {
	character: CharacterType;
	tileSize: number;
}

export default function Character({ character, tileSize }: CharacterProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Get character-specific sprite if available
		const sprite = createCharacterSprites(character.color, character.id);
		const spriteData = sprite.idle[character.direction];
		const palette = getColorPalette(character.color, character.id);

		// Draw sprite pixel by pixel
		const pixelSize = tileSize / 16;

		for (let y = 0; y < spriteData.length; y++) {
			for (let x = 0; x < spriteData[y].length; x++) {
				const colorIndex = spriteData[y][x];
				const color = palette[colorIndex];

				if (color !== 'transparent') {
					ctx.fillStyle = color;
					ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
				}
			}
		}
	}, [character, tileSize]);

	// Get display name (first name only for BBT characters)
	const displayName = character.name.split(' ')[0];

	return (
		<div
			className="absolute transition-all duration-200 ease-out"
			style={{
				left: character.position.x * tileSize,
				top: character.position.y * tileSize,
				width: tileSize,
				height: tileSize,
				zIndex: character.position.y + 10,
			}}
		>
			<canvas
				ref={canvasRef}
				width={tileSize}
				height={tileSize}
				className={`pixelated ${
					character.isMoving ? 'animate-bounce-subtle' : ''
				}`}
				style={{ imageRendering: 'pixelated' }}
			/>
			{/* Character name label */}
			<div
				className="absolute left-1/2 -translate-x-1/2 -top-4 whitespace-nowrap text-[6px] font-bold px-1 py-0.5 rounded"
				style={{
					backgroundColor: 'rgba(0,0,0,0.8)',
					color: character.color,
					textShadow: '0 1px 2px rgba(0,0,0,0.8)',
					border: `1px solid ${character.color}40`,
				}}
			>
				{displayName}
			</div>
			{/* Current action emoji */}
			<div
				className="absolute left-1/2 -translate-x-1/2 -bottom-2 text-[8px]"
				style={{ zIndex: 100 }}
			>
				{character.currentActionEmoji}
			</div>
		</div>
	);
}
