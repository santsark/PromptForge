
import { auth } from "@/auth";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { NextResponse } from "next/server";
import { saveTransactionSchema, formatZodErrors } from "@/lib/validation";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = saveTransactionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: `Validation error: ${formatZodErrors(parsed.error)}` },
                { status: 400 }
            );
        }

        const { framework, userQuestion, qaHistory, prompts, ranking, costs } = parsed.data;

        // Calculate Total Cost
        const totalCost =
            (costs.gemini || 0) +
            (costs.claude || 0) +
            (costs.deepseek || 0) +
            (costs.ranking || 0) +
            (costs.clarify || 0);

        // Save to DB
        await db.insert(transactions).values({
            userId: session.user.id,
            frameworkUsed: framework,
            userQuestion: userQuestion,
            clarifyingQa: JSON.stringify(qaHistory),

            geminiPrompt: prompts.gemini.prompt,
            geminiCost: prompts.gemini.cost.toString(),

            claudePrompt: prompts.claude.prompt,
            claudeCost: prompts.claude.cost.toString(),

            deepseekPrompt: prompts.deepseek.prompt,
            deepseekCost: prompts.deepseek.cost.toString(),

            openaiCost: costs.ranking.toString(),
            totalCost: totalCost.toString(),

            rankingResult: JSON.stringify(ranking),
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Transaction Save Error:", error);
        return NextResponse.json(
            { error: "Failed to save transaction." },
            { status: 500 }
        );
    }
}
