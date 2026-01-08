import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Reactive Replanning API
 * When an agent observes something important, they may need to modify their current plan
 */
export async function POST(req: NextRequest) {
  try {
    const {
      characterSummary,
      currentPlan,
      observation,
      currentTime,
      relevantMemories,
    } = await req.json();

    // If no API key, return mock decision
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(getMockReplanDecision(observation, currentPlan));
    }

    const systemPrompt = `You are an AI agent deciding whether to modify your current plan based on a new observation.

You should consider:
1. Is this observation important enough to change my plans?
2. Does this align with my goals and personality?
3. Would a reasonable person in my situation react to this?

Social opportunities (meeting a friend, interesting conversation) often warrant plan changes.
Routine observations (seeing someone walk by) usually don't.

Respond in JSON format:
{
  "shouldReplan": true/false,
  "reasoning": "Why you decided to change or keep your plan",
  "newActivity": "What you'll do instead (if changing)",
  "newDuration": 30,  // minutes (if changing)
  "resumeOriginalPlan": true/false  // Whether to resume original plan after
}`;

    const userPrompt = `Character: ${characterSummary}

Current plan: ${currentPlan}
Current time: ${currentTime}

New observation: ${observation}

${relevantMemories ? `Relevant memories:\n${relevantMemories}` : ""}

Should you change your current plan in response to this observation?`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Replan error:", error);
    return NextResponse.json(
      { error: "Failed to decide on replanning" },
      { status: 500 }
    );
  }
}

function getMockReplanDecision(
  observation: string,
  currentPlan: string
): {
  shouldReplan: boolean;
  reasoning: string;
  newActivity?: string;
  newDuration?: number;
  resumeOriginalPlan?: boolean;
} {
  const lowerObs = observation.toLowerCase();

  // Check for social opportunities
  if (
    lowerObs.includes("talking to") ||
    lowerObs.includes("conversation") ||
    lowerObs.includes("chatting")
  ) {
    return {
      shouldReplan: true,
      reasoning: "A friend is having a conversation nearby. I should join them.",
      newActivity: "Join the conversation",
      newDuration: 15,
      resumeOriginalPlan: true,
    };
  }

  // Check for friends nearby
  if (
    lowerObs.includes("leonard") ||
    lowerObs.includes("sheldon") ||
    lowerObs.includes("penny") ||
    lowerObs.includes("howard") ||
    lowerObs.includes("raj")
  ) {
    if (Math.random() > 0.6) {
      return {
        shouldReplan: true,
        reasoning: "I see a friend! I should say hi.",
        newActivity: "Stop and chat with friend",
        newDuration: 10,
        resumeOriginalPlan: true,
      };
    }
  }

  // Check for interesting events
  if (
    lowerObs.includes("new") ||
    lowerObs.includes("interesting") ||
    lowerObs.includes("exciting")
  ) {
    return {
      shouldReplan: true,
      reasoning: "Something interesting is happening. I want to check it out.",
      newActivity: "Investigate the interesting event",
      newDuration: 15,
      resumeOriginalPlan: true,
    };
  }

  // Check for food-related observations
  if (
    lowerObs.includes("food") ||
    lowerObs.includes("eating") ||
    lowerObs.includes("lunch") ||
    lowerObs.includes("dinner")
  ) {
    if (!currentPlan.toLowerCase().includes("eat")) {
      return {
        shouldReplan: true,
        reasoning: "I'm reminded that I should eat something.",
        newActivity: "Get some food",
        newDuration: 30,
        resumeOriginalPlan: true,
      };
    }
  }

  // Default: don't replan
  return {
    shouldReplan: false,
    reasoning: "This observation doesn't require changing my current plan.",
  };
}
