/**
 * Planner - Daily planning and plan decomposition for agents
 * Based on the paper's hierarchical planning approach
 */

import type { Plan, DailyPlan, GameTime } from '../../types';

/**
 * Generate a unique plan ID
 */
function generatePlanId(): string {
  return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a plan entry
 */
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

/**
 * Decompose a broad plan into hourly chunks
 */
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
      description: `${plan.description} (${Math.floor(currentMinute / 60) + 1}/${Math.ceil(totalMinutes / 60)})`,
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

/**
 * Get detailed activities for a plan description
 */
function getDetailedActivities(planDescription: string): string[] {
  const lower = planDescription.toLowerCase();

  // Physics/Science activities
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

  // Entertainment activities
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

  // Work activities
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

  // Daily routine activities
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

/**
 * Decompose hourly plans into 5-15 minute detailed actions
 */
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

/**
 * Get current plan based on time
 */
export function getCurrentPlan(dailyPlan: DailyPlan, time: GameTime): Plan | null {
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

/**
 * Get action emoji based on plan description
 */
export function getPlanEmoji(description: string): string {
  const lower = description.toLowerCase();

  // Science/Work
  if (lower.includes('string theory') || lower.includes('physics')) return '🔬';
  if (lower.includes('laser') || lower.includes('experiment')) return '⚡';
  if (lower.includes('caltech')) return '🏛️';
  if (lower.includes('research')) return '📊';

  // Entertainment
  if (lower.includes('halo') || lower.includes('video game') || lower.includes('warcraft')) return '🎮';
  if (lower.includes('comic')) return '📚';
  if (lower.includes('tv') || lower.includes('watch')) return '📺';
  if (lower.includes('movie') || lower.includes('romantic')) return '🎬';

  // Social
  if (lower.includes('talk') || lower.includes('chat') || lower.includes('socialize') || lower.includes('hang out')) return '💬';
  if (lower.includes('pickup') || lower.includes('dating')) return '💘';
  if (lower.includes('party')) return '🎉';

  // Work
  if (lower.includes('cheesecake') || lower.includes('shift') || lower.includes('serve')) return '🍽️';
  if (lower.includes('audition') || lower.includes('acting') || lower.includes('lines')) return '🎭';
  if (lower.includes('work')) return '💼';

  // Daily routine
  if (lower.includes('sleep') || lower.includes('bed')) return '😴';
  if (lower.includes('wake') || lower.includes('morning')) return '🌅';
  if (lower.includes('breakfast')) return '🍳';
  if (lower.includes('lunch')) return '🍽️';
  if (lower.includes('dinner')) return '🍝';
  if (lower.includes('shower') || lower.includes('brush') || lower.includes('bathroom')) return '🚿';
  if (lower.includes('phone')) return '📱';
  if (lower.includes('clean')) return '🧹';

  // Transportation
  if (lower.includes('walk')) return '🚶';
  if (lower.includes('drive')) return '🚗';

  // Food
  if (lower.includes('chinese') || lower.includes('thai')) return '🥡';
  if (lower.includes('coffee') || lower.includes('cafe')) return '☕';

  // Special
  if (lower.includes('klingon') || lower.includes('star trek')) return '🖖';
  if (lower.includes('yoga') || lower.includes('meditation')) return '🧘';
  if (lower.includes('mom')) return '👩';
  if (lower.includes('book') || lower.includes('read')) return '📖';

  return '📍';
}

/**
 * Format plan for display
 */
export function formatPlanForDisplay(plan: Plan | null): string {
  if (!plan) return 'No current plan';

  const startStr = `${plan.startTime.hour.toString().padStart(2, '0')}:${plan.startTime.minute.toString().padStart(2, '0')}`;
  return `${startStr} - ${plan.description}`;
}

/**
 * Check if plan should be updated based on observations
 */
export function shouldReplan(currentPlan: Plan | null, observation: string): boolean {
  if (!currentPlan) return true;

  const importantKeywords = [
    'fire', 'emergency', 'help', 'urgent', 'friend', 'conversation', 'invite',
    'penny', 'leonard', 'sheldon', 'howard', 'raj', 'klingon', 'star trek', 'comic'
  ];

  const lower = observation.toLowerCase();
  return importantKeywords.some((kw) => lower.includes(kw));
}

/**
 * Planner class - manages daily planning for a character
 */
export class Planner {
  private currentPlan: DailyPlan | null = null;
  private routineGenerator: (occupation: string) => Plan[];

  constructor(routineGenerator: (occupation: string) => Plan[]) {
    this.routineGenerator = routineGenerator;
  }

  /**
   * Initialize daily plan for a character
   */
  initializeDailyPlan(occupation: string, day: number): DailyPlan {
    const broadStrokes = this.routineGenerator(occupation);

    // Decompose to hourly
    const hourlyPlans: Plan[] = [];
    broadStrokes.forEach((plan) => {
      hourlyPlans.push(...decomposePlanToHourly(plan));
    });

    this.currentPlan = {
      day,
      broadStrokes,
      hourlyPlans,
      detailedPlans: [],
    };

    return this.currentPlan;
  }

  /**
   * Get current plan
   */
  getCurrentPlan(time: GameTime): Plan | null {
    if (!this.currentPlan) return null;
    return getCurrentPlan(this.currentPlan, time);
  }

  /**
   * Get daily plan
   */
  getDailyPlan(): DailyPlan | null {
    return this.currentPlan;
  }

  /**
   * Set daily plan
   */
  setDailyPlan(plan: DailyPlan): void {
    this.currentPlan = plan;
  }

  /**
   * Update current action based on plan
   */
  getCurrentAction(time: GameTime): { action: string; emoji: string } {
    const plan = this.getCurrentPlan(time);
    if (!plan) {
      return { action: 'Standing idle', emoji: '📍' };
    }
    return {
      action: plan.description,
      emoji: getPlanEmoji(plan.description),
    };
  }
}
