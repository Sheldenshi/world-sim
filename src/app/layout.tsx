import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'Generative Agents - Interactive Simulacra',
	description: 'A simulation of believable human behavior using AI agents',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased game-bg min-h-screen">{children}</body>
		</html>
	);
}
