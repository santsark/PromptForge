
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();

    if (session?.user.role !== "admin") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { name, email, password, role } = await req.json();

        if (!name || !email || !password) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        const passwordHash = await hash(password, 10);

        const match = await db.insert(users).values({
            name,
            email,
            passwordHash,
            role: role || "user",
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Create User Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
