import { auth } from "@/auth";
import { db } from "@/db";
import { transactions, users } from "@/db/schema";
import { count, sum, sql, gte, countDistinct } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Total runs
        const [{ totalRuns }] = await db
            .select({ totalRuns: count() })
            .from(transactions);

        // Total cost
        const [{ totalCost }] = await db
            .select({ totalCost: sum(transactions.totalCost) })
            .from(transactions);

        // Active users (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [{ activeUsers }] = await db
            .select({ activeUsers: countDistinct(transactions.userId) })
            .from(transactions)
            .where(gte(transactions.createdAt, thirtyDaysAgo));

        // Most popular framework
        const frameworks = await db
            .select({
                framework: transactions.frameworkUsed,
                runs: count(),
            })
            .from(transactions)
            .groupBy(transactions.frameworkUsed)
            .orderBy(sql`count(*) DESC`)
            .limit(1);

        const mostPopularFramework = frameworks[0]?.framework || "N/A";

        return NextResponse.json({
            totalRuns,
            totalCost: parseFloat(totalCost || "0").toFixed(2),
            activeUsers,
            mostPopularFramework,
        });
    } catch (error) {
        console.error("Analytics Summary Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
