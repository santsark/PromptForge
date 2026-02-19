import { auth } from "@/auth";
import { db } from "@/db";
import { transactions, users } from "@/db/schema";
import { eq, sql, desc, count, sum, max } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const data = await db
            .select({
                userId: users.id,
                name: users.name,
                email: users.email,
                isActive: users.isActive,
                totalRuns: count(transactions.id),
                totalCost: sum(transactions.totalCost),
                lastActive: max(transactions.createdAt),
            })
            .from(users)
            .leftJoin(transactions, eq(users.id, transactions.userId))
            .groupBy(users.id, users.name, users.email, users.isActive)
            .orderBy(desc(sql`COALESCE(SUM(CAST(${transactions.totalCost} AS DECIMAL)), 0)`));

        const formatted = data.map((u) => ({
            ...u,
            totalCost: parseFloat(String(u.totalCost || "0")).toFixed(4),
            lastActive: u.lastActive ? u.lastActive.toISOString() : null,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Analytics By User Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
