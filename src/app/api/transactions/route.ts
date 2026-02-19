import { auth } from "@/auth";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1", 10);
        const framework = searchParams.get("framework");
        const limit = 10;
        const offset = (page - 1) * limit;

        // Build conditions
        const conditions = [eq(transactions.userId, session.user.id)];
        if (framework) {
            conditions.push(eq(transactions.frameworkUsed, framework));
        }

        const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

        // Get total count
        const [{ total }] = await db
            .select({ total: count() })
            .from(transactions)
            .where(whereClause);

        // Get paginated results
        const results = await db
            .select()
            .from(transactions)
            .where(whereClause)
            .orderBy(desc(transactions.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            transactions: results,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Transactions Fetch Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
