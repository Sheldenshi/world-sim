import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { systemPrompt, conversationContext, characterName, checkEnding } =
      await request.json();

    if (!process.env.OPENAI_API_KEY) {
      // Return mock response if no API key
      const mockResponse = getMockResponse(characterName, checkEnding);
      return NextResponse.json(mockResponse);
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // If checking for conversation ending
    if (checkEnding) {
      const endingCheck = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are analyzing a conversation to determine if it should naturally end.
Output ONLY a JSON object: {"shouldEnd": boolean, "reason": "string"}
The conversation should end if:
- Someone says goodbye/farewell
- The topic has been exhausted
- It's been more than 5-6 exchanges
- There's a natural pause point`,
          },
          {
            role: "user",
            content: conversationContext,
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      try {
        const result = JSON.parse(endingCheck.choices[0]?.message?.content || "{}");
        return NextResponse.json(result);
      } catch {
        return NextResponse.json({ shouldEnd: false });
      }
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: conversationContext,
        },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    const message = completion.choices[0]?.message?.content || "...";

    return NextResponse.json({ message: message.trim() });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

function getMockResponse(
  characterName: string,
  checkEnding?: boolean
): { message?: string; shouldEnd?: boolean; reason?: string } {
  if (checkEnding) {
    // Random chance to end conversation after some messages
    const shouldEnd = Math.random() > 0.7;
    return {
      shouldEnd,
      reason: shouldEnd ? "Natural conversation pause" : "",
    };
  }

  const responses: Record<string, string[]> = {
    "Alice Chen": [
      "I've been working on a new abstract piece lately. The colors are inspired by the sunset.",
      "Have you seen the new exhibition at the gallery? It's quite thought-provoking!",
      "Art has this way of connecting people, don't you think?",
      "I love how this town brings together so many creative souls.",
      "Sometimes I just sit by the window and sketch whatever catches my eye.",
      "I should probably get back to my canvas soon. It's calling me!",
    ],
    "Bob Martinez": [
      "I just finished reading an incredible novel. The character development was masterful.",
      "Books have this magical ability to transport us to different worlds.",
      "I've been thinking about starting a book club. Would you be interested?",
      "There's a rare first edition that came into the shop today. Quite exciting!",
      "Reading is like having a conversation with the greatest minds of history.",
      "I should check on the shop soon. Customers might be waiting.",
    ],
    "Charlie Kim": [
      "I tried a new coffee blend today - Ethiopian with notes of blueberry. Amazing!",
      "The cafe was so busy this morning! Everyone needed their caffeine fix.",
      "I'm planning a little community event for next month. Something cozy!",
      "There's something special about the smell of fresh coffee in the morning.",
      "Making latte art is like meditation for me. So peaceful!",
      "I wonder if we should add some new pastries to the menu.",
    ],
  };

  const characterResponses = responses[characterName] || [
    "That's interesting! Tell me more.",
    "I hadn't thought about it that way before.",
    "How fascinating! I'd love to hear your thoughts.",
  ];

  const message =
    characterResponses[Math.floor(Math.random() * characterResponses.length)];
  return { message };
}
