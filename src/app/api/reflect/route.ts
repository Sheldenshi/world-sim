import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { characterSummary, memories, questions } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      // Return mock reflections if no API key
      return NextResponse.json({
        reflections: getMockReflections(questions),
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const reflections: string[] = [];

    for (const question of questions.slice(0, 3)) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are generating higher-level insights for a character in a life simulation.
Based on the character's recent memories, generate a thoughtful reflection that synthesizes what they've learned or realized.
Keep the reflection to 1-2 sentences, written in first person as if the character is thinking.

Character: ${characterSummary}`,
          },
          {
            role: "user",
            content: `Recent memories:
${memories}

Question to reflect on: ${question}

Generate a brief, insightful reflection:`,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const reflection = completion.choices[0]?.message?.content?.trim();
      if (reflection) {
        reflections.push(reflection);
      }
    }

    return NextResponse.json({ reflections });
  } catch (error) {
    console.error("Reflection API error:", error);
    return NextResponse.json(
      { error: "Failed to generate reflections" },
      { status: 500 }
    );
  }
}

function getMockReflections(questions: string[]): string[] {
  const genericReflections = [
    "I've noticed that my daily routines give me a sense of stability and purpose.",
    "The connections I make with others in this town are what make life meaningful.",
    "I should make more time for the things that truly bring me joy.",
    "Sometimes the small moments are the most memorable ones.",
    "I'm grateful for the community we've built here.",
  ];

  return questions
    .slice(0, 3)
    .map(() => genericReflections[Math.floor(Math.random() * genericReflections.length)]);
}

