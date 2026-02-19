
import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { clarifySchema, formatZodErrors } from "@/lib/validation";

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});

export async function POST(req: Request) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limit
        const rl = checkRateLimit(session.user.id, RATE_LIMITS.clarify);
        if (!rl.success) {
            return NextResponse.json(
                { error: "Rate limit reached. Please wait before sending more clarification requests.", remaining: 0 },
                { status: 429 }
            );
        }

        // Validate input
        const body = await req.json();
        const parsed = clarifySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: `Validation error: ${formatZodErrors(parsed.error)}` },
                { status: 400 }
            );
        }

        const { framework, userQuestion, previousQA } = parsed.data;

        const systemPrompt = `You are a prompt engineering expert helping a corporate user craft a high-quality AI prompt.
The user has selected the ${framework} framework and described their goal.
Your job is to ask ONE clarifying question at a time to gather the information needed
to build an excellent ${framework}-structured prompt.

Ask questions that uncover:
- Audience (who will read the output)
- Tone (formal, empathetic, direct)
- Constraints (length, format, things to avoid)
- Specific context details relevant to ${framework}

When you have enough information (after 2-4 questions), respond ONLY with the exact text:
READY_TO_GENERATE

Otherwise, respond with exactly ONE question. No preamble, no numbering.`;

        const messages: any[] = [
            { role: "user", content: userQuestion },
        ];

        if (previousQA && previousQA.length > 0) {
            previousQA.forEach((qa) => {
                messages.push({ role: "assistant", content: qa.question });
                messages.push({ role: "user", content: qa.answer });
            });
        }

        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 300,
            system: systemPrompt,
            messages: messages,
        });

        const reply = (response.content[0] as any).text;
        const inputTokens = response.usage.input_tokens;
        const outputTokens = response.usage.output_tokens;

        return NextResponse.json({
            question: reply,
            inputTokens,
            outputTokens,
        });

    } catch (error) {
        console.error("Claude API Error:", error);
        return NextResponse.json(
            { error: "Internal AI Error. Please try again." },
            { status: 500 }
        );
    }
}
