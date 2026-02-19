
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await auth();

    if (session?.user.role !== "admin") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { role, isActive } = await req.json();

        await db
            .update(users)
            .set({
                ...(role && { role }),
                ...(isActive !== undefined && { isActive }),
            })
            .where(eq(users.id, params.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update User Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
