import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * User Commands API (Inner Voice)
 * This allows users to influence agent behavior by planting suggestions
 * Similar to how the paper describes users commanding agents via "inner voice"
 */
export async function POST(req: NextRequest) {
  try {
    const { characterSummary, command, currentActivity, relevantMemories } =
      await req.json();

    // If no API key, return mock interpretation
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(getMockCommandInterpretation(command));
    }

    const systemPrompt = `You are an AI agent receiving an inner thought or suggestion. This is like a voice in your head giving you an idea or urging you to do something.

You should:
1. Interpret this suggestion in a way that fits your personality
2. Decide how strongly you feel about acting on it
3. Determine what specific actions you would take

The suggestion might be:
- A social activity ("You should throw a party")
- A personal goal ("You want to impress someone")
- An observation ("You're curious about what Leonard is doing")
- A feeling ("You're feeling lonely")

Respond in JSON format:
{
  "interpretation": "How you interpret this suggestion in your own words",
  "motivation": 0.0-1.0,  // How motivated you are to act on this
  "plannedActions": [
    {
      "action": "What you'll do",
      "timing": "When (immediate, later today, tomorrow, etc.)",
      "reason": "Why this fits your personality"
    }
  ],
  "internalThought": "What you're thinking to yourself about this"
}`;

    const userPrompt = `Character: ${characterSummary}

Current activity: ${currentActivity}

${relevantMemories ? `Relevant memories:\n${relevantMemories}` : ""}

Inner voice says: "${command}"

How do you interpret and respond to this inner thought?`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Command interpretation error:", error);
    return NextResponse.json(
      { error: "Failed to interpret command" },
      { status: 500 }
    );
  }
}

function getMockCommandInterpretation(command: string): {
  interpretation: string;
  motivation: number;
  plannedActions: Array<{
    action: string;
    timing: string;
    reason: string;
  }>;
  internalThought: string;
} {
  const lowerCommand = command.toLowerCase();

  // Party-related commands
  if (lowerCommand.includes("party") || lowerCommand.includes("celebrate")) {
    return {
      interpretation: "I should organize a social gathering",
      motivation: 0.8,
      plannedActions: [
        {
          action: "Decide on a date and theme for the party",
          timing: "immediate",
          reason: "I need to plan ahead for a successful event",
        },
        {
          action: "Invite friends to the party",
          timing: "later today",
          reason: "I want my friends to be there",
        },
        {
          action: "Get supplies for the party",
          timing: "tomorrow",
          reason: "We'll need food and drinks",
        },
      ],
      internalThought: "A party could be fun. I should start planning!",
    };
  }

  // Romance-related commands
  if (
    lowerCommand.includes("talk to") ||
    lowerCommand.includes("ask out") ||
    lowerCommand.includes("romantic")
  ) {
    return {
      interpretation: "I should pursue a romantic connection",
      motivation: 0.7,
      plannedActions: [
        {
          action: "Find a good opportunity to talk to them",
          timing: "later today",
          reason: "I need the right moment",
        },
        {
          action: "Think of something interesting to say",
          timing: "immediate",
          reason: "First impressions matter",
        },
      ],
      internalThought:
        "Maybe this is the time to make a move. I've been thinking about this for a while.",
    };
  }

  // Work-related commands
  if (
    lowerCommand.includes("work") ||
    lowerCommand.includes("research") ||
    lowerCommand.includes("study")
  ) {
    return {
      interpretation: "I should focus more on my work or research",
      motivation: 0.6,
      plannedActions: [
        {
          action: "Set aside dedicated time for focused work",
          timing: "tomorrow",
          reason: "I need uninterrupted time to make progress",
        },
        {
          action: "Review my current research goals",
          timing: "immediate",
          reason: "I should know what I'm working towards",
        },
      ],
      internalThought:
        "I should probably be more productive. Let me refocus on what matters.",
    };
  }

  // Social-related commands
  if (
    lowerCommand.includes("friend") ||
    lowerCommand.includes("hang out") ||
    lowerCommand.includes("spend time")
  ) {
    return {
      interpretation: "I want to strengthen my friendships",
      motivation: 0.75,
      plannedActions: [
        {
          action: "Reach out to a friend",
          timing: "immediate",
          reason: "I value my friendships",
        },
        {
          action: "Plan a group activity",
          timing: "later today",
          reason: "Shared experiences bring people closer",
        },
      ],
      internalThought:
        "I've been meaning to spend more time with my friends. Life is about connections.",
    };
  }

  // Default interpretation
  return {
    interpretation: `I'm feeling drawn to: ${command}`,
    motivation: 0.5,
    plannedActions: [
      {
        action: `Consider how to act on this feeling`,
        timing: "later today",
        reason: "I should think about what this means for me",
      },
    ],
    internalThought: "Hmm, interesting thought. I'll keep this in mind.",
  };
}
