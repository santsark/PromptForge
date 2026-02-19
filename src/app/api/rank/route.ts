
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { llmPricing } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { rankSchema, formatZodErrors } from "@/lib/validation";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limit
        const rl = checkRateLimit(session.user.id, RATE_LIMITS.rank);
        if (!rl.success) {
            return NextResponse.json(
                { error: "Rate limit reached. Please wait before ranking more prompts.", remaining: 0 },
                { status: 429 }
            );
        }

        // Validate input
        const body = await req.json();
        const parsed = rankSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: `Validation error: ${formatZodErrors(parsed.error)}` },
                { status: 400 }
            );
        }

        const { framework, userQuestion, prompts } = parsed.data;

        const prices = await db.select().from(llmPricing).where(eq(llmPricing.model, "gpt-4o"));
        const price = prices[0] || { costPer1kInput: 0, costPer1kOutput: 0 };

        const systemPrompt = `You are an expert prompt engineer and judge. Evaluate 3 AI prompts generated 
for the same task and rank them 1st, 2nd, 3rd.`;

        const userMessage = `Framework used: ${framework}
Original task: ${userQuestion}

PROMPT A (Gemini):
${prompts.gemini.prompt}

PROMPT B (Claude):
${prompts.claude.prompt}

PROMPT C (DeepSeek):
${prompts.deepseek.prompt}

Evaluate each prompt on: Clarity, Completeness, Framework Adherence, Usability.

Respond in this exact JSON format:
{
  "ranking": ["A", "B", "C"],
  "scores": { 
     "A": {"clarity":0, "completeness":0, "adherence":0, "usability":0},
     "B": {"clarity":0, "completeness":0, "adherence":0, "usability":0},
     "C": {"clarity":0, "completeness":0, "adherence":0, "usability":0} 
  },
  "explanation": "string explaining the ranking in 2-3 sentences",
  "winner": "A"
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ]
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");
        const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0 };

        const cost = (usage.prompt_tokens / 1000) * Number(price.costPer1kInput) +
            (usage.completion_tokens / 1000) * Number(price.costPer1kOutput);

        return NextResponse.json({
            evaluation: result,
            cost,
            tokens: { input: usage.prompt_tokens, output: usage.completion_tokens }
        });

    } catch (error) {
        console.error("Ranking API Error:", error);
        return NextResponse.json(
            { error: "Ranking failed. Please try again." },
            { status: 500 }
        );
    }
}
