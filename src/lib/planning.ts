import type { Plan, DailyPlan, Character, GameTime } from '@/types';

// Generate a unique plan ID
function generatePlanId(): string {
	return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create a plan entry
export function createPlan(
	description: string,
	startHour: number,
	startMinute: number,
	duration: number,
	location?: string
): Plan {
	return {
		id: generatePlanId(),
		description,
		startTime: { hour: startHour, minute: startMinute },
		duration,
		location,
		status: 'pending',
	};
}

// Big Bang Theory character routines
const BBT_ROUTINES: Record<string, Plan[]> = {
	// Sheldon Cooper - Theoretical Physicist with very rigid schedule
	theoretical_physicist: [
		createPlan('Wake up at precisely 6:15 AM', 6, 15, 15),
		createPlan('Morning bathroom routine (exactly 11 minutes)', 6, 30, 11),
		createPlan(
			'Eat breakfast - cereal with 1/4 cup of milk on Mondays',
			6,
			45,
			30
		),
		createPlan('Watch morning cartoons (Doctor Who reruns)', 7, 15, 45),
		createPlan('Walk to Caltech (Leonard drives)', 8, 0, 30),
		createPlan('Work on string theory equations at Caltech', 8, 30, 210),
		createPlan(
			"Lunch at Caltech cafeteria - it's Thai food Thursday!",
			12,
			0,
			45
		),
		createPlan('Continue physics research at Caltech', 12, 45, 195),
		createPlan('Leave Caltech', 16, 0, 30),
		createPlan('Play Halo 3 or World of Warcraft', 16, 30, 90),
		createPlan('Watch vintage TV shows', 18, 0, 60),
		createPlan('Order dinner - Chinese food on Tuesdays', 19, 0, 60),
		createPlan('Comic book store visit or board game night', 20, 0, 120),
		createPlan('Prepare for bed with exact routine', 22, 0, 30),
		createPlan('Sleep', 22, 30, 480),
	],

	// Leonard Hofstadter - Experimental Physicist
	experimental_physicist: [
		createPlan('Wake up', 7, 0, 30),
		createPlan('Morning routine and breakfast', 7, 30, 45),
		createPlan('Drive Sheldon to Caltech', 8, 15, 30),
		createPlan('Work on laser experiments at Caltech', 8, 45, 195),
		createPlan('Lunch at Caltech', 12, 0, 45),
		createPlan('Continue experimental work at Caltech', 12, 45, 195),
		createPlan('Drive home from Caltech', 16, 0, 30),
		createPlan('Check on Penny or hang out with friends', 16, 30, 90),
		createPlan('Dinner', 18, 0, 60),
		createPlan('Video games or comic store with the guys', 19, 0, 120),
		createPlan('Watch TV or try to have alone time', 21, 0, 60),
		createPlan('Prepare for bed', 22, 0, 30),
		createPlan('Sleep', 22, 30, 510),
	],

	// Penny - Waitress and aspiring actress
	waitress: [
		createPlan('Wake up (usually late)', 9, 0, 30),
		createPlan('Morning routine', 9, 30, 45),
		createPlan('Quick breakfast', 10, 15, 30),
		createPlan('Practice lines for auditions', 10, 45, 75),
		createPlan('Get ready for work', 12, 0, 60),
		createPlan('Work lunch shift at Cheesecake Factory', 13, 0, 180),
		createPlan('Short break at work', 16, 0, 30),
		createPlan('Work dinner shift at Cheesecake Factory', 16, 30, 210),
		createPlan('End shift and clean up', 20, 0, 30),
		createPlan('Hang out with Leonard and the guys', 20, 30, 90),
		createPlan('Watch reality TV or relax', 22, 0, 60),
		createPlan('Sleep', 23, 0, 600),
	],

	// Howard Wolowitz - Aerospace Engineer
	aerospace_engineer: [
		createPlan('Wake up to mom yelling', 7, 30, 15),
		createPlan('Eat breakfast mom prepared', 7, 45, 30),
		createPlan("Morning routine (using mom's bathroom)", 8, 15, 30),
		createPlan('Drive to Caltech', 8, 45, 30),
		createPlan('Work on NASA projects at Caltech', 9, 15, 165),
		createPlan('Lunch at Caltech cafeteria - hit on women', 12, 0, 60),
		createPlan('Continue engineering work at Caltech', 13, 0, 180),
		createPlan('Leave Caltech', 16, 0, 30),
		createPlan('Hang out with Raj', 16, 30, 90),
		createPlan("Dinner at mom's house", 18, 0, 60),
		createPlan('Comic store or video games with the guys', 19, 0, 120),
		createPlan('Try online dating or work on pickup lines', 21, 0, 60),
		createPlan("Go to sleep at mom's house", 22, 0, 540),
	],

	// Raj Koothrappali - Astrophysicist
	astrophysicist: [
		createPlan('Wake up', 7, 0, 30),
		createPlan('Morning yoga and meditation', 7, 30, 30),
		createPlan('Breakfast', 8, 0, 30),
		createPlan('Drive to Caltech', 8, 30, 30),
		createPlan('Research on planetary formation at Caltech', 9, 0, 180),
		createPlan('Lunch at Caltech with Howard', 12, 0, 60),
		createPlan('Continue astrophysics research at Caltech', 13, 0, 180),
		createPlan('Leave Caltech', 16, 0, 30),
		createPlan('Hang out with Howard', 16, 30, 90),
		createPlan('Dinner', 18, 0, 60),
		createPlan('Video games or comic store with friends', 19, 0, 120),
		createPlan('Watch romantic comedies alone', 21, 0, 60),
		createPlan('Sleep', 22, 0, 540),
	],
	comic_book_store_owner: [
		createPlan('Wake up alone in small apartment', 8, 0, 30),
		createPlan('Contemplate existence while eating cereal', 8, 30, 30),
		createPlan('Open the Comic Center of Pasadena', 9, 0, 30),
		createPlan('Wait for customers at the Comic Store', 9, 30, 150),
		createPlan('Eat sad lunch alone at the store', 12, 0, 30),
		createPlan('Organize comics nobody will buy at Comic Store', 12, 30, 180),
		createPlan('Hope someone comes in to the Comic Store', 15, 30, 90),
		createPlan('New comic day prep at Comic Store', 17, 0, 60),
		createPlan('Close store, count meager earnings', 18, 0, 30),
		createPlan('Eat dinner alone', 18, 30, 60),
		createPlan('Draw sketches that will never be sold', 19, 30, 90),
		createPlan('Watch TV alone', 21, 0, 60),
		createPlan('Sleep', 22, 0, 600),
	],
};

// Default routine fallback
const DEFAULT_ROUTINES: Record<string, Plan[]> = {
	artist: [
		createPlan('Wake up and morning routine', 7, 0, 60),
		createPlan('Have breakfast', 8, 0, 30),
		createPlan('Work on art projects at the gallery', 9, 0, 180),
		createPlan('Take a break and have lunch', 12, 0, 60),
		createPlan('Continue art work or meet with clients', 13, 0, 180),
		createPlan('Take a walk for inspiration', 16, 0, 60),
		createPlan('Have dinner', 18, 0, 60),
		createPlan('Relax and socialize', 19, 0, 120),
		createPlan('Prepare for bed', 21, 0, 60),
	],
	bookstore_owner: [
		createPlan('Wake up and morning routine', 6, 30, 60),
		createPlan('Have breakfast and read', 7, 30, 45),
		createPlan('Open the bookstore', 8, 30, 30),
		createPlan('Manage store and help customers', 9, 0, 180),
		createPlan('Have lunch', 12, 0, 60),
		createPlan('Continue store operations', 13, 0, 240),
		createPlan('Close store and inventory', 17, 0, 60),
		createPlan('Have dinner', 18, 0, 60),
		createPlan('Read or socialize', 19, 0, 120),
		createPlan('Prepare for bed', 21, 0, 60),
	],
	barista: [
		createPlan('Wake up early', 5, 30, 60),
		createPlan('Have breakfast', 6, 30, 30),
		createPlan('Commute to cafe', 7, 0, 30),
		createPlan('Open cafe and prepare', 7, 30, 30),
		createPlan('Morning rush - serve customers', 8, 0, 180),
		createPlan('Take a break', 11, 0, 30),
		createPlan('Lunch service', 11, 30, 150),
		createPlan('Afternoon shift', 14, 0, 180),
		createPlan('End shift and clean up', 17, 0, 60),
		createPlan('Have dinner and relax', 18, 0, 120),
		createPlan('Socialize or personal time', 20, 0, 90),
		createPlan('Prepare for bed', 21, 30, 60),
	],
};

// Get routine based on occupation (BBT characters first, then defaults)
export function getDefaultRoutine(occupation: string): Plan[] {
	const lower = occupation.toLowerCase();

	// Check for Big Bang Theory specific occupations
	if (lower.includes('theoretical physicist')) {
		return BBT_ROUTINES.theoretical_physicist.map((p) => ({
			...p,
			id: generatePlanId(),
		}));
	}
	if (lower.includes('experimental physicist')) {
		return BBT_ROUTINES.experimental_physicist.map((p) => ({
			...p,
			id: generatePlanId(),
		}));
	}
	if (lower.includes('waitress')) {
		return BBT_ROUTINES.waitress.map((p) => ({ ...p, id: generatePlanId() }));
	}
	if (lower.includes('aerospace engineer')) {
		return BBT_ROUTINES.aerospace_engineer.map((p) => ({
			...p,
			id: generatePlanId(),
		}));
	}
	if (lower.includes('astrophysicist')) {
		return BBT_ROUTINES.astrophysicist.map((p) => ({
			...p,
			id: generatePlanId(),
		}));
	}

	// Fallback to default routines
	const key = occupation.toLowerCase().replace(/\s+/g, '_');
	if (DEFAULT_ROUTINES[key]) {
		return DEFAULT_ROUTINES[key].map((p) => ({ ...p, id: generatePlanId() }));
	}

	// Generic routine
	return [
		createPlan('Wake up and morning routine', 7, 0, 60),
		createPlan('Have breakfast', 8, 0, 30),
		createPlan('Work or activities', 9, 0, 180),
		createPlan('Have lunch', 12, 0, 60),
		createPlan('Continue activities', 13, 0, 240),
		createPlan('Have dinner', 18, 0, 60),
		createPlan('Evening relaxation', 19, 0, 120),
		createPlan('Prepare for bed', 21, 0, 60),
	];
}

// Decompose a broad plan into hourly chunks
export function decomposePlanToHourly(plan: Plan): Plan[] {
	const hourlyPlans: Plan[] = [];
	const totalMinutes = plan.duration;
	let currentMinute = 0;
	let currentHour = plan.startTime.hour;
	let currentMin = plan.startTime.minute;

	while (currentMinute < totalMinutes) {
		const remainingInHour = 60 - currentMin;
		const remainingInPlan = totalMinutes - currentMinute;
		const chunkDuration = Math.min(remainingInHour, remainingInPlan, 60);

		hourlyPlans.push({
			id: generatePlanId(),
			description: `${plan.description} (${
				Math.floor(currentMinute / 60) + 1
			}/${Math.ceil(totalMinutes / 60)})`,
			startTime: { hour: currentHour, minute: currentMin },
			duration: chunkDuration,
			location: plan.location,
			status: 'pending',
		});

		currentMinute += chunkDuration;
		currentMin += chunkDuration;
		if (currentMin >= 60) {
			currentHour++;
			currentMin -= 60;
		}
	}

	return hourlyPlans;
}

// Decompose hourly plans into 5-15 minute detailed actions
export function decomposePlanToDetailed(plan: Plan): Plan[] {
	const detailedPlans: Plan[] = [];
	const activities = getDetailedActivities(plan.description);

	let currentHour = plan.startTime.hour;
	let currentMin = plan.startTime.minute;
	let remainingDuration = plan.duration;

	activities.forEach((activity) => {
		const duration = Math.min(
			Math.floor(plan.duration / activities.length),
			remainingDuration,
			15
		);

		if (duration > 0) {
			detailedPlans.push({
				id: generatePlanId(),
				description: activity,
				startTime: { hour: currentHour, minute: currentMin },
				duration,
				location: plan.location,
				status: 'pending',
			});

			currentMin += duration;
			if (currentMin >= 60) {
				currentHour++;
				currentMin -= 60;
			}
			remainingDuration -= duration;
		}
	});

	return detailedPlans;
}

// Generate detailed activities for a plan (BBT-themed)
function getDetailedActivities(planDescription: string): string[] {
	const lower = planDescription.toLowerCase();

	// BBT-specific activities
	if (lower.includes('string theory') || lower.includes('physics research')) {
		return [
			'Review recent physics papers',
			'Work on equations on whiteboard',
			'Argue about theoretical approaches',
			'Take a coffee break',
			'Continue working on proofs',
		];
	}

	if (lower.includes('laser') || lower.includes('experimental')) {
		return [
			'Set up experimental apparatus',
			'Calibrate laser equipment',
			'Run experiments',
			'Record data',
			'Analyze results',
		];
	}

	if (lower.includes('halo') || lower.includes('video game')) {
		return [
			'Set up gaming station',
			'Play online matches',
			'Complain about other players',
			'Take a snack break',
			'Continue gaming session',
		];
	}

	if (lower.includes('comic')) {
		return [
			'Browse new arrivals',
			'Discuss comic storylines',
			'Argue about superhero rankings',
			'Make purchases',
			'Head home with new comics',
		];
	}

	if (lower.includes('cheesecake factory') || lower.includes('shift')) {
		return [
			'Clock in and put on uniform',
			'Check table assignments',
			'Take customer orders',
			'Serve food and drinks',
			'Handle difficult customers',
			'Clean tables',
		];
	}

	if (lower.includes('audition') || lower.includes('lines')) {
		return [
			'Read through script',
			'Practice emotional delivery',
			'Work on accents',
			'Record self for review',
			'Take a break',
		];
	}

	if (lower.includes('pickup lines') || lower.includes('online dating')) {
		return [
			'Browse dating profiles',
			'Write witty messages',
			'Get no responses',
			'Practice pickup lines in mirror',
			'Give up for the night',
		];
	}

	if (lower.includes('romantic comed')) {
		return [
			'Pick a movie to watch',
			'Get comfortable on couch',
			'Watch movie with snacks',
			'Cry at emotional scenes',
			'Dream about finding love',
		];
	}

	// Default activities
	if (lower.includes('morning routine') || lower.includes('wake up')) {
		return [
			'Get out of bed',
			'Brush teeth',
			'Take a shower',
			'Get dressed',
			'Check phone for messages',
		];
	}

	if (lower.includes('breakfast')) {
		return [
			'Prepare breakfast ingredients',
			'Cook breakfast',
			'Eat breakfast',
			'Clean up dishes',
		];
	}

	if (lower.includes('lunch') || lower.includes('dinner')) {
		return [
			'Decide what to eat',
			'Prepare or order food',
			'Eat the meal',
			'Clean up',
		];
	}

	if (lower.includes('work') || lower.includes('caltech')) {
		return [
			'Review tasks for the session',
			'Focus on primary work',
			'Take a short break',
			'Continue working',
			'Wrap up current task',
		];
	}

	if (lower.includes('walk') || lower.includes('drive')) {
		return ['Prepare to leave', 'Head out', 'Travel to destination', 'Arrive'];
	}

	if (lower.includes('socialize') || lower.includes('hang out')) {
		return [
			'Find someone to talk to',
			'Have a conversation',
			'Share experiences',
			'Say goodbye',
		];
	}

	if (lower.includes('bed') || lower.includes('sleep')) {
		return [
			'Change into sleepwear',
			'Brush teeth',
			'Set alarm for tomorrow',
			'Get into bed',
		];
	}

	// Default
	return [
		`Start ${planDescription.toLowerCase()}`,
		`Continue ${planDescription.toLowerCase()}`,
		`Finish ${planDescription.toLowerCase()}`,
	];
}

// Initialize daily plan for a character
export function initializeDailyPlan(
	character: Character,
	day: number
): DailyPlan {
	const broadStrokes = getDefaultRoutine(character.occupation);

	// Decompose to hourly
	const hourlyPlans: Plan[] = [];
	broadStrokes.forEach((plan) => {
		hourlyPlans.push(...decomposePlanToHourly(plan));
	});

	// Decompose to detailed (we'll do this on-demand to save memory)
	const detailedPlans: Plan[] = [];

	return {
		day,
		broadStrokes,
		hourlyPlans,
		detailedPlans,
	};
}

// Get current plan based on time
export function getCurrentPlan(
	dailyPlan: DailyPlan,
	time: GameTime
): Plan | null {
	const currentMinutes = time.hour * 60 + time.minute;

	// Check detailed plans first
	for (const plan of dailyPlan.detailedPlans) {
		const planStart = plan.startTime.hour * 60 + plan.startTime.minute;
		const planEnd = planStart + plan.duration;
		if (currentMinutes >= planStart && currentMinutes < planEnd) {
			return plan;
		}
	}

	// Fall back to hourly plans
	for (const plan of dailyPlan.hourlyPlans) {
		const planStart = plan.startTime.hour * 60 + plan.startTime.minute;
		const planEnd = planStart + plan.duration;
		if (currentMinutes >= planStart && currentMinutes < planEnd) {
			return plan;
		}
	}

	// Fall back to broad strokes
	for (const plan of dailyPlan.broadStrokes) {
		const planStart = plan.startTime.hour * 60 + plan.startTime.minute;
		const planEnd = planStart + plan.duration;
		if (currentMinutes >= planStart && currentMinutes < planEnd) {
			return plan;
		}
	}

	return null;
}

// Check if plan should be updated based on observations
export function shouldReplan(
	character: Character,
	currentPlan: Plan | null,
	observation: string
): boolean {
	if (!currentPlan) return true;

	// BBT-specific interrupts
	const importantKeywords = [
		'fire',
		'emergency',
		'help',
		'urgent',
		'friend',
		'conversation',
		'invite',
		'penny',
		'leonard',
		'sheldon',
		'howard',
		'raj',
		'klingon',
		'star trek',
		'comic',
	];

	const lower = observation.toLowerCase();
	return importantKeywords.some((kw) => lower.includes(kw));
}

// Format plan for display
export function formatPlanForDisplay(plan: Plan | null): string {
	if (!plan) return 'No current plan';

	const startStr = `${plan.startTime.hour
		.toString()
		.padStart(2, '0')}:${plan.startTime.minute.toString().padStart(2, '0')}`;
	return `${startStr} - ${plan.description}`;
}

// Get action emoji based on plan description (BBT-themed)
export function getPlanEmoji(description: string): string {
	const lower = description.toLowerCase();

	// BBT-specific emojis
	if (lower.includes('string theory') || lower.includes('physics')) return '🔬';
	if (lower.includes('laser') || lower.includes('experiment')) return '⚡';
	if (lower.includes('caltech')) return '🏛️';
	if (
		lower.includes('halo') ||
		lower.includes('video game') ||
		lower.includes('warcraft')
	)
		return '🎮';
	if (lower.includes('comic')) return '📚';
	if (lower.includes('cheesecake') || lower.includes('shift')) return '🍽️';
	if (
		lower.includes('audition') ||
		lower.includes('acting') ||
		lower.includes('lines')
	)
		return '🎭';
	if (lower.includes('klingon') || lower.includes('star trek')) return '🖖';
	if (lower.includes('pickup') || lower.includes('dating')) return '💘';
	if (lower.includes('romantic')) return '🎬';
	if (lower.includes('yoga') || lower.includes('meditation')) return '🧘';
	if (lower.includes('mom')) return '👩';
	if (lower.includes('drive')) return '🚗';
	if (lower.includes('chinese') || lower.includes('thai')) return '🥡';

	// Default emojis
	if (lower.includes('sleep') || lower.includes('bed')) return '😴';
	if (lower.includes('wake') || lower.includes('morning')) return '🌅';
	if (lower.includes('breakfast')) return '🍳';
	if (lower.includes('lunch')) return '🍽️';
	if (lower.includes('dinner')) return '🍝';
	if (lower.includes('work')) return '💼';
	if (lower.includes('book') || lower.includes('read')) return '📖';
	if (lower.includes('coffee') || lower.includes('cafe')) return '☕';
	if (lower.includes('walk')) return '🚶';
	if (
		lower.includes('talk') ||
		lower.includes('chat') ||
		lower.includes('socialize') ||
		lower.includes('hang out')
	)
		return '💬';
	if (
		lower.includes('shower') ||
		lower.includes('brush') ||
		lower.includes('bathroom')
	)
		return '🚿';
	if (lower.includes('phone')) return '📱';
	if (lower.includes('clean')) return '🧹';
	if (lower.includes('tv') || lower.includes('watch')) return '📺';

	return '📍';
}
