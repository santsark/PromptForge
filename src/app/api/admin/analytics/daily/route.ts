import { auth } from "@/auth";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { sql, gte } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyData = await db
            .select({
                date: sql<string>`DATE(${transactions.createdAt})`.as("date"),
                runs: sql<number>`COUNT(*)`.as("runs"),
                cost: sql<string>`COALESCE(SUM(CAST(${transactions.totalCost} AS DECIMAL)), 0)`.as("cost"),
            })
            .from(transactions)
            .where(gte(transactions.createdAt, thirtyDaysAgo))
            .groupBy(sql`DATE(${transactions.createdAt})`)
            .orderBy(sql`DATE(${transactions.createdAt}) ASC`);

        // Fill in missing days with zeros
        const filledData = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const found = dailyData.find((r) => r.date === dateStr);
            filledData.push({
                date: dateStr,
                runs: found ? Number(found.runs) : 0,
                cost: found ? parseFloat(String(found.cost)) : 0,
            });
        }

        return NextResponse.json(filledData);
    } catch (error) {
        console.error("Analytics Daily Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
