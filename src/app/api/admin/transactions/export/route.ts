import { auth } from "@/auth";
import { db } from "@/db";
import { transactions, users } from "@/db/schema";
import { eq, gte, lte, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;

        // Default date range: last 30 days
        const defaultFrom = new Date();
        defaultFrom.setDate(defaultFrom.getDate() - 30);
        const fromDate = searchParams.get("from")
            ? new Date(searchParams.get("from")!)
            : defaultFrom;
        const toDate = searchParams.get("to")
            ? new Date(searchParams.get("to")!)
            : new Date();

        // Set toDate to end of day
        toDate.setHours(23, 59, 59, 999);

        const results = await db
            .select({
                userEmail: users.email,
                framework: transactions.frameworkUsed,
                question: transactions.userQuestion,
                rankingResult: transactions.rankingResult,
                totalCost: transactions.totalCost,
                createdAt: transactions.createdAt,
            })
            .from(transactions)
            .leftJoin(users, eq(transactions.userId, users.id))
            .where(
                and(
                    gte(transactions.createdAt, fromDate),
                    lte(transactions.createdAt, toDate)
                )
            )
            .orderBy(sql`${transactions.createdAt} DESC`);

        // Build CSV
        const headers = [
            "user_email",
            "framework",
            "question",
            "winner",
            "total_cost",
            "created_at",
        ];

        const rows = results.map((r) => {
            let winner = "N/A";
            try {
                const ranking =
                    typeof r.rankingResult === "string"
                        ? JSON.parse(r.rankingResult)
                        : r.rankingResult;
                winner = ranking?.winner || "N/A";
            } catch {
                // ignore
            }

            return [
                r.userEmail || "",
                r.framework,
                `"${(r.question || "").replace(/"/g, '""')}"`,
                winner,
                r.totalCost || "0",
                r.createdAt ? r.createdAt.toISOString() : "",
            ].join(",");
        });

        const csv = [headers.join(","), ...rows].join("\n");

        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="promptforge-export-${fromDate.toISOString().split("T")[0]}-to-${toDate.toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Export Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
