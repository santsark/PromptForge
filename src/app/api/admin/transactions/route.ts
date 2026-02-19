import { auth } from "@/auth";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const searchParams = req.nextUrl.searchParams;
        const userId = searchParams.get("userId");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = 10;
        const offset = (page - 1) * limit;

        const conditions = userId ? [eq(transactions.userId, userId)] : [];
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Total count
        const countQuery = db.select({ total: count() }).from(transactions);
        const [{ total }] = whereClause
            ? await countQuery.where(whereClause)
            : await countQuery;

        // Paginated results
        const query = db
            .select()
            .from(transactions)
            .orderBy(desc(transactions.createdAt))
            .limit(limit)
            .offset(offset);

        const results = whereClause
            ? await query.where(whereClause)
            : await query;

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
        console.error("Admin Transactions Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
