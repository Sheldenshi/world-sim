import { NextResponse } from "next/server";
import OpenAI from "openai";

interface DecisionRequest {
  character: {
    name: string;
    occupation: string;
    personality: string;
    currentAction: string;
    memoryContext: string;
  };
  time: {
    hour: number;
    minute: number;
    day: number;
  };
  nearbyCharacters: Array<{
    name: string;
    action: string;
    relationship: string;
  }>;
  currentPlan: string;
}

interface DecisionResponse {
  shouldMove: boolean;
  direction?: "up" | "down" | "left" | "right";
  shouldInteract: boolean;
  interactWith?: string;
  newAction?: string;
  thought?: string;
}

export async function POST(request: Request) {
  try {
    const { character, time, nearbyCharacters, currentPlan }: DecisionRequest =
      await request.json();

    if (!process.env.OPENAI_API_KEY) {
      // Return intelligent mock decision if no API key
      return NextResponse.json(getMockDecision(nearbyCharacters, currentPlan, time));
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = buildDecisionPrompt(character, time, nearbyCharacters, currentPlan);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a decision engine for a character simulation.
Output ONLY valid JSON with no markdown or explanation.
Format: {
  "shouldMove": boolean,
  "direction": "up"|"down"|"left"|"right" (only if shouldMove is true),
  "shouldInteract": boolean,
  "interactWith": "character name" (only if shouldInteract is true),
  "newAction": "brief action description",
  "thought": "brief internal thought"
}

Make decisions that feel natural and consistent with the character's personality and current plan.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || "{}";

    try {
      const decision = JSON.parse(content);
      return NextResponse.json(decision);
    } catch {
      return NextResponse.json(getMockDecision(nearbyCharacters, currentPlan, time));
    }
  } catch (error) {
    console.error("Decision API error:", error);
    return NextResponse.json(
      { error: "Failed to make decision" },
      { status: 500 }
    );
  }
}

function buildDecisionPrompt(
  character: DecisionRequest["character"],
  time: DecisionRequest["time"],
  nearbyCharacters: DecisionRequest["nearbyCharacters"],
  currentPlan: string
): string {
  const timeStr = `${time.hour.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")}`;
  
  let prompt = `Character: ${character.name} (${character.occupation})
Personality: ${character.personality}
Current time: Day ${time.day}, ${timeStr}
Current plan: ${currentPlan}
Current action: ${character.currentAction}

Recent memories:
${character.memoryContext || "None yet"}

`;

  if (nearbyCharacters.length > 0) {
    prompt += `Nearby characters:\n`;
    nearbyCharacters.forEach((nc) => {
      prompt += `- ${nc.name}: ${nc.action} (${nc.relationship})\n`;
    });
  } else {
    prompt += `No one is nearby.\n`;
  }

  prompt += `\nWhat should ${character.name} do next? Consider their personality, current plan, and who is nearby.`;

  return prompt;
}

function getMockDecision(
  nearbyCharacters: DecisionRequest["nearbyCharacters"],
  currentPlan: string,
  time: DecisionRequest["time"]
): DecisionResponse {
  const directions: ("up" | "down" | "left" | "right")[] = ["up", "down", "left", "right"];
  
  // More likely to interact if someone is nearby
  if (nearbyCharacters.length > 0 && Math.random() > 0.6) {
    const target = nearbyCharacters[Math.floor(Math.random() * nearbyCharacters.length)];
    return {
      shouldMove: false,
      shouldInteract: true,
      interactWith: target.name,
      newAction: `Chatting with ${target.name}`,
      thought: `I should say hello to ${target.name}`,
    };
  }

  // Movement decision based on time of day
  const shouldMove = Math.random() > 0.5;
  
  if (shouldMove) {
    return {
      shouldMove: true,
      direction: directions[Math.floor(Math.random() * directions.length)],
      shouldInteract: false,
      newAction: currentPlan || "Walking around",
      thought: "I should keep moving",
    };
  }

  // Stay in place
  return {
    shouldMove: false,
    shouldInteract: false,
    newAction: currentPlan || "Standing idle",
    thought: "I'll stay here for a moment",
  };
}
