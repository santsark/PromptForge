
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { llmPricing } from "@/db/schema";
import { auth } from "@/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { generateSchema, formatZodErrors } from "@/lib/validation";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY! });

export const maxDuration = 60; // Allow 60s for generation

export async function POST(req: Request) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limit
        const rl = checkRateLimit(session.user.id, RATE_LIMITS.generate);
        if (!rl.success) {
            return NextResponse.json(
                { error: "Rate limit reached. Please wait before generating more prompts.", remaining: 0 },
                { status: 429 }
            );
        }

        // Validate input
        const body = await req.json();
        const parsed = generateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: `Validation error: ${formatZodErrors(parsed.error)}` },
                { status: 400 }
            );
        }

        const { framework, userQuestion, qaHistory } = parsed.data;

        // 1. Build Master Context
        let masterContext = `Framework: ${framework}\nOriginal Task: ${userQuestion}\n\nClarifying Q&A History:\n`;
        qaHistory.forEach((qa, i: number) => {
            masterContext += `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}\n`;
        });

        const systemPrompt = `You are an expert prompt engineer. Using the ${framework} framework, 
craft a single, complete, production-ready AI prompt based on the user's 
context below. Output ONLY the prompt itself — no explanation, no preamble, 
no markdown headers. The prompt should be ready to paste directly into an AI tool.`;

        // 2. Fetch Pricing
        const prices = await db.select().from(llmPricing);
        const getPrice = (model: string) => prices.find((p) => p.model === model) || { costPer1kInput: 0, costPer1kOutput: 0 };

        // 3. Parallel Generation
        const [geminiRes, claudeRes, deepseekRes] = await Promise.allSettled([
            // Gemini
            (async () => {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const result = await model.generateContent(`${systemPrompt}\n\n${masterContext}`);
                const response = await result.response;
                const text = response.text();
                const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
                return {
                    provider: "Gemini",
                    model: "gemini-2.0-flash",
                    prompt: text,
                    tokens: { input: usage.promptTokenCount, output: usage.candidatesTokenCount },
                };
            })(),

            // Claude
            (async () => {
                const msg = await anthropic.messages.create({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 1500,
                    system: systemPrompt,
                    messages: [{ role: "user", content: masterContext }],
                });
                return {
                    provider: "Claude",
                    model: "claude-3-haiku-20240307",
                    prompt: (msg.content[0] as any).text,
                    tokens: { input: msg.usage.input_tokens, output: msg.usage.output_tokens },
                };
            })(),

            // DeepSeek
            (async () => {
                const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: masterContext }
                        ]
                    })
                });
                const data = await res.json();
                return {
                    provider: "DeepSeek",
                    model: "deepseek-chat",
                    prompt: data.choices?.[0]?.message?.content || "Error generating prompt",
                    tokens: { input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0 },
                };
            })(),
        ]);

        // 4. Process Results & Calculate Costs
        const processResult = (res: any, pricingModel: string, providerName: string) => {
            if (res.status === "rejected") {
                console.error(`${providerName} generation failed:`, res.reason);
                return {
                    prompt: null,
                    error: `${providerName} generation failed`,
                    cost: 0,
                    tokens: { input: 0, output: 0 },
                };
            }
            const val = res.value;
            const price = getPrice(pricingModel) || getPrice("gemini-1.5-flash");
            const cost = (val.tokens.input / 1000) * Number(price.costPer1kInput || 0) +
                (val.tokens.output / 1000) * Number(price.costPer1kOutput || 0);
            return { ...val, cost, error: null };
        };

        return NextResponse.json({
            gemini: processResult(geminiRes, "gemini-2.0-flash", "Gemini"),
            claude: processResult(claudeRes, "claude-3-haiku-20240307", "Claude"),
            deepseek: processResult(deepseekRes, "deepseek-chat", "DeepSeek"),
        });

    } catch (error) {
        console.error("Generation API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error. Please try again." },
            { status: 500 }
        );
    }
}
