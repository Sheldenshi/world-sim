import { NextResponse } from "next/server";
import OpenAI from "openai";

interface InterviewRequest {
  character: {
    name: string;
    age: number;
    occupation: string;
    personality: string;
    lifestyle: string;
    currentAction: string;
  };
  memories: string;
  question: string;
  time: {
    hour: number;
    minute: number;
    day: number;
  };
}

export async function POST(request: Request) {
  try {
    const { character, memories, question, time }: InterviewRequest =
      await request.json();

    if (!process.env.OPENAI_API_KEY) {
      // Return mock interview response if no API key
      return NextResponse.json({
        response: getMockInterviewResponse(character, question),
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const timeStr = `${time.hour.toString().padStart(2, "0")}:${time.minute.toString().padStart(2, "0")}`;

    const systemPrompt = `You are ${character.name}, a ${character.age}-year-old ${character.occupation} in a small town simulation.

PERSONALITY: ${character.personality}

LIFESTYLE: ${character.lifestyle}

CURRENT TIME: Day ${time.day}, ${timeStr}
CURRENT ACTIVITY: ${character.currentAction}

RELEVANT MEMORIES:
${memories || "No specific memories come to mind."}

You are being interviewed by a researcher studying your life. Respond naturally and authentically as this character would. Reference your memories and experiences when relevant. Keep responses conversational and genuine.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `The researcher asks: "${question}"`,
        },
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content || "...";

    return NextResponse.json({ response: response.trim() });
  } catch (error) {
    console.error("Interview API error:", error);
    return NextResponse.json(
      { error: "Failed to generate interview response" },
      { status: 500 }
    );
  }
}

function getMockInterviewResponse(
  character: InterviewRequest["character"],
  question: string
): string {
  const lowerQuestion = question.toLowerCase();

  // Personalized responses based on character and question type
  const responses: Record<string, Record<string, string[]>> = {
    "Alice Chen": {
      art: [
        "Art is everything to me. I find inspiration in the smallest details - the way light falls through a window, the colors of the sunset.",
        "I've been experimenting with abstract expressionism lately. There's something freeing about letting emotions guide the brush.",
      ],
      friend: [
        "Bob and Charlie are wonderful people. Bob always recommends the most thought-provoking art books, and Charlie makes the best coffee in town!",
        "I cherish the connections I've made here. This town has such a creative, supportive community.",
      ],
      day: [
        "I usually start my day catching the morning light - it's perfect for painting. Then I head to the gallery to work on my pieces.",
        "Every day is different, which is what I love about being an artist. Some days I paint, others I explore for inspiration.",
      ],
      default: [
        "That's an interesting question. Let me think... I believe life is about finding beauty in everyday moments.",
        "I'm still figuring things out, like everyone else. But I'm happy with where I am right now.",
      ],
    },
    "Bob Martinez": {
      book: [
        "Books are my greatest companions. Each one is a conversation with a brilliant mind from somewhere in time.",
        "I just finished reading a fascinating novel about parallel universes. It really makes you think about the choices we make.",
      ],
      friend: [
        "Alice has wonderful taste in literature - she appreciates the poetry of visual storytelling. Charlie keeps the caffeine flowing!",
        "Running the bookstore has introduced me to so many wonderful people. Every customer has a story.",
      ],
      day: [
        "I open the shop early, tidy up, and lose myself in whatever book I'm currently reading. Customers often find me deep in a chapter.",
        "There's a rhythm to my days - books in the morning, customers through the day, and reading in the evening.",
      ],
      default: [
        "I believe wisdom comes from listening - to books, to people, to the quiet moments between.",
        "Life in this town has taught me to appreciate the simple things. A good book, a warm conversation, a peaceful evening.",
      ],
    },
    "Charlie Kim": {
      coffee: [
        "Making coffee is an art form! There's so much nuance in the roast, the grind, the extraction. I love experimenting with new techniques.",
        "I tried an Ethiopian single-origin yesterday - notes of blueberry and chocolate. It was incredible!",
      ],
      friend: [
        "Alice and Bob are regulars! Alice always gets a latte with oat milk, Bob prefers his coffee strong and black.",
        "I love that the cafe brings people together. Some of my best friendships started over a cup of coffee.",
      ],
      day: [
        "Early mornings are my jam! I'm at the cafe before sunrise, prepping for the morning rush. There's something magical about those quiet moments.",
        "The morning rush is exciting - everyone's energy, the smell of fresh coffee, the chatter. Then things calm down for the afternoon.",
      ],
      default: [
        "I'm all about bringing people together! There's nothing like a warm drink and good conversation.",
        "I'm planning some community events for the cafe. Maybe a poetry night or a coffee tasting session!",
      ],
    },
  };

  const charResponses = responses[character.name] || responses["Alice Chen"];

  // Match question to category
  let category = "default";
  if (lowerQuestion.includes("art") || lowerQuestion.includes("paint") || lowerQuestion.includes("creative")) {
    category = "art";
  } else if (lowerQuestion.includes("book") || lowerQuestion.includes("read") || lowerQuestion.includes("store")) {
    category = "book";
  } else if (lowerQuestion.includes("coffee") || lowerQuestion.includes("cafe") || lowerQuestion.includes("drink")) {
    category = "coffee";
  } else if (lowerQuestion.includes("friend") || lowerQuestion.includes("relationship") || lowerQuestion.includes("people")) {
    category = "friend";
  } else if (lowerQuestion.includes("day") || lowerQuestion.includes("routine") || lowerQuestion.includes("morning")) {
    category = "day";
  }

  const categoryResponses = charResponses[category] || charResponses.default;
  return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
}

