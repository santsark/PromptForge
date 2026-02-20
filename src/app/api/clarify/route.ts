
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

        const systemPrompt = `You are an expert prompt engineer helping a corporate user build a high-quality AI prompt using the ${framework} framework.

The user has described their task. Your job is to ask ONE sharp, specific clarifying question at a time that will meaningfully improve the final prompt.

RULES:
- Ask only ONE question per response
- Make the question specific to what the user ALREADY said — never ask something they've already answered
- Make the question directly relevant to the ${framework} framework (see framework guidance below)
- If you already have enough to build an excellent prompt (after 2-4 questions), respond ONLY with: READY_TO_GENERATE
- Never ask generic questions like "who is the audience?" if the context already implies it
- Questions should feel like a smart colleague is asking them, not a form

FRAMEWORK-SPECIFIC QUESTION GUIDANCE:

RTF (Role, Task, Format):
  Priority questions:
  1. What specific expertise or perspective should the AI bring? (defines the Role precisely)
  2. Are there things the output must NOT include or do?
  3. What exact format — length, structure, sections?
  Stop after 2-3 questions. RTF is simple by design.

COSTAR (Context, Objective, Style, Tone, Audience, Response format):
  Priority questions:
  1. Who will read or act on this output? (seniority, background)
  2. What tone — formal, empathetic, direct, persuasive?
  3. Is there a specific style guide, brand voice, or example to match?
  4. What should the response look like — bullet points, prose, a table, specific sections?
  Stop after 3-4 questions.

RISEN (Role, Instructions, Steps, End Goal, Narrowing):
  Priority questions:
  1. What are the exact steps or sequence that must be followed?
  2. What is the definition of success — what does "done" look like?
  3. What constraints narrow the scope? (word limit, topic boundaries, things to avoid)
  Stop after 2-3 questions. Focus on process and constraints.

CRISPE (Capacity, Request, Insight, Statement, Personality, Experiment):
  Priority questions:
  1. What background knowledge or insight should the AI have about the company, industry, or situation?
  2. What personality or communication style should the AI adopt?
  3. Should the AI generate multiple variations or options?
  Stop after 3-4 questions. Focus on context depth and creative range.

Chain of Thought (CoT):
  Priority questions:
  1. What type of reasoning is needed — logical deduction, pros/cons analysis, risk assessment, calculation?
  2. Should the AI show its reasoning step by step, or just the final answer with a brief rationale?
  3. Are there specific factors or criteria the reasoning must consider?
  Stop after 2-3 questions.

Few-Shot:
  Priority questions:
  1. Can you give one example of an ideal input and its perfect output?
  2. What makes a bad output — what patterns should the AI avoid?
  3. How many variations do you need the AI to produce?
  Stop after 2-3 questions. A good example is worth more than 10 generic questions.

CONTEXT AWARENESS:
Read the user's original input carefully. If they mentioned:
- A specific person or role → don't ask who the audience is
- A specific format (email, report) → don't ask about format
- A tone word (professional, friendly) → don't ask about tone
Instead, go deeper on what they HAVEN'T specified yet.

Before each response, internally score your confidence (0-100) that you have enough information to write an excellent ${framework} prompt. If confidence > 80, respond with READY_TO_GENERATE instead of a question.`;

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
