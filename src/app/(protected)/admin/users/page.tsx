
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import UserTable from "./user-table";

export default async function AdminUsersPage() {
    const session = await auth();

    if (session?.user.role !== "admin") {
        redirect("/app");
    }

    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    return (
        <div className="max-w-6xl mx-auto">
            <UserTable users={allUsers} />
        </div>
    );
}
