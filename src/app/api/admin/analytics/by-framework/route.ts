import { auth } from "@/auth";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const data = await db
            .select({
                framework: transactions.frameworkUsed,
                runs: count(),
            })
            .from(transactions)
            .groupBy(transactions.frameworkUsed)
            .orderBy(sql`count(*) DESC`);

        return NextResponse.json(data);
    } catch (error) {
        console.error("Analytics By Framework Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
