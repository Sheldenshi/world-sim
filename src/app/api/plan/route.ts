import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { characterSummary, memories, currentDay, previousDayReflections } =
      await req.json();

    // If no API key, return mock plans
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        plans: getMockPlans(characterSummary),
      });
    }

    const systemPrompt = `You are generating a daily plan for an AI agent in a simulation. The agent should have realistic, believable behavior based on their personality and lifestyle.

Create a day's schedule in broad strokes (5-8 high-level activities). Each activity should have:
- description: What the agent will do
- startTime: When it starts (24-hour format, e.g., "08:00")
- duration: How long in minutes
- location: Where this happens

The schedule should:
1. Reflect the character's personality and occupation
2. Include routine activities (eating, sleeping, working)
3. Include social activities when appropriate
4. Be influenced by recent memories and reflections
5. Feel natural and human-like

Format your response as JSON:
{
  "plans": [
    {
      "description": "Activity description",
      "startTime": "HH:MM",
      "duration": 60,
      "location": "Location name"
    }
  ]
}`;

    const userPrompt = `Character: ${characterSummary}

Recent memories:
${memories}

${previousDayReflections ? `Yesterday's reflections:\n${previousDayReflections}` : ""}

Generate a realistic daily schedule for Day ${currentDay}. Start from when they wake up until they go to sleep.`;

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
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}

function getMockPlans(characterSummary: string): Array<{
  description: string;
  startTime: string;
  duration: number;
  location: string;
}> {
  // Return occupation-based mock plans
  const lowerSummary = characterSummary.toLowerCase();

  if (lowerSummary.includes("theoretical physicist") || lowerSummary.includes("sheldon")) {
    return [
      { description: "Wake up and morning routine", startTime: "06:30", duration: 60, location: "Apartment 4A" },
      { description: "Eat breakfast cereal while watching Doctor Who", startTime: "07:30", duration: 30, location: "Apartment 4A" },
      { description: "Work on string theory research", startTime: "08:00", duration: 240, location: "Caltech" },
      { description: "Lunch at the cafeteria with the guys", startTime: "12:00", duration: 60, location: "Caltech" },
      { description: "Continue research and whiteboard calculations", startTime: "13:00", duration: 240, location: "Caltech" },
      { description: "Return home, it's Thai food Thursday", startTime: "17:00", duration: 60, location: "Apartment 4A" },
      { description: "Play video games or watch sci-fi shows", startTime: "18:00", duration: 180, location: "Apartment 4A" },
      { description: "Prepare for bed (scheduled bedtime)", startTime: "21:00", duration: 60, location: "Apartment 4A" },
    ];
  }

  if (lowerSummary.includes("experimental physicist") || lowerSummary.includes("leonard")) {
    return [
      { description: "Wake up and get ready", startTime: "07:00", duration: 60, location: "Apartment 4A" },
      { description: "Drive Sheldon to work", startTime: "08:00", duration: 30, location: "Path" },
      { description: "Run laser experiments in the lab", startTime: "08:30", duration: 210, location: "Caltech" },
      { description: "Lunch with Howard and Raj", startTime: "12:00", duration: 60, location: "Caltech" },
      { description: "Continue experiments and data analysis", startTime: "13:00", duration: 240, location: "Caltech" },
      { description: "Check if Penny is home", startTime: "17:00", duration: 30, location: "Apartment 4B" },
      { description: "Dinner and relaxation", startTime: "18:00", duration: 120, location: "Apartment 4A" },
      { description: "Comic book night or video games", startTime: "20:00", duration: 120, location: "Apartment 4A" },
    ];
  }

  if (lowerSummary.includes("waitress") || lowerSummary.includes("penny")) {
    return [
      { description: "Sleep in", startTime: "09:00", duration: 60, location: "Apartment 4B" },
      { description: "Yoga and getting ready", startTime: "10:00", duration: 90, location: "Apartment 4B" },
      { description: "Practice acting for auditions", startTime: "11:30", duration: 90, location: "Apartment 4B" },
      { description: "Quick lunch", startTime: "13:00", duration: 30, location: "Apartment 4B" },
      { description: "Work shift at Cheesecake Factory", startTime: "14:00", duration: 360, location: "Cheesecake Factory" },
      { description: "Come home exhausted", startTime: "20:00", duration: 30, location: "Apartment 4B" },
      { description: "Watch TV and wind down", startTime: "20:30", duration: 150, location: "Apartment 4B" },
    ];
  }

  if (lowerSummary.includes("aerospace engineer") || lowerSummary.includes("howard")) {
    return [
      { description: "Wake up to mom calling for breakfast", startTime: "07:30", duration: 60, location: "Wolowitz House" },
      { description: "Work on NASA equipment designs", startTime: "09:00", duration: 180, location: "Caltech" },
      { description: "Lunch with the guys", startTime: "12:00", duration: 60, location: "Caltech" },
      { description: "Continue engineering work", startTime: "13:00", duration: 240, location: "Caltech" },
      { description: "Hang out with Raj", startTime: "17:00", duration: 120, location: "Comic Store" },
      { description: "Come home for mom's dinner", startTime: "19:00", duration: 60, location: "Wolowitz House" },
      { description: "Online gaming or tinkering", startTime: "20:00", duration: 180, location: "Wolowitz House" },
    ];
  }

  if (lowerSummary.includes("astrophysicist") || lowerSummary.includes("raj")) {
    return [
      { description: "Wake up and make fancy coffee", startTime: "07:00", duration: 60, location: "Raj's Apartment" },
      { description: "Research at Caltech", startTime: "08:00", duration: 240, location: "Caltech" },
      { description: "Lunch at the cafeteria", startTime: "12:00", duration: 60, location: "Caltech" },
      { description: "Continue analyzing telescope data", startTime: "13:00", duration: 240, location: "Caltech" },
      { description: "Meet up with Howard", startTime: "17:00", duration: 120, location: "Comic Store" },
      { description: "Go to 4A for dinner with the group", startTime: "19:00", duration: 120, location: "Apartment 4A" },
      { description: "Watch a romantic comedy alone", startTime: "21:00", duration: 120, location: "Raj's Apartment" },
    ];
  }

  if (lowerSummary.includes("comic") || lowerSummary.includes("stuart")) {
    return [
      { description: "Wake up late, feeling unmotivated", startTime: "09:00", duration: 60, location: "Comic Store" },
      { description: "Open the store, no customers", startTime: "10:00", duration: 120, location: "Comic Store" },
      { description: "Organize new comic shipment", startTime: "12:00", duration: 60, location: "Comic Store" },
      { description: "Eat a sad lunch alone", startTime: "13:00", duration: 30, location: "Comic Store" },
      { description: "Wait for customers, draw to pass time", startTime: "13:30", duration: 210, location: "Comic Store" },
      { description: "The guys might come by after work", startTime: "17:00", duration: 120, location: "Comic Store" },
      { description: "Close up shop", startTime: "19:00", duration: 30, location: "Comic Store" },
      { description: "Go home and contemplate existence", startTime: "19:30", duration: 180, location: "Comic Store" },
    ];
  }

  // Default generic plan
  return [
    { description: "Wake up and morning routine", startTime: "07:00", duration: 60, location: "Home" },
    { description: "Work", startTime: "08:00", duration: 480, location: "Work" },
    { description: "Lunch break", startTime: "12:00", duration: 60, location: "Cafeteria" },
    { description: "Evening activities", startTime: "17:00", duration: 180, location: "Home" },
    { description: "Dinner", startTime: "19:00", duration: 60, location: "Home" },
    { description: "Relaxation", startTime: "20:00", duration: 120, location: "Home" },
  ];
}
