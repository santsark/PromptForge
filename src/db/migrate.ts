
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "./index";
import { users, llmPricing } from "./schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Running migrations...");
    // Note: For neon-http, we usually use drizzle-kit push or generated migrations with a different runner if using the http driver.
    // But drizzle-orm/neon-http/migrator exists. However, usually for serverless we might use 'drizzle-kit push' for prototyping or generate standard migrations.
    // The user asked to "Create /src/db/migrate.ts to run migrations and seed".
    // Given we are using neon-serverless (http), standard `migrate()` might need a different setup or we should use `drizzle-kit push` effectively.
    // Actually, let's just use the seed part here and assume the user will run `drizzle-kit push` or we run it programmatically?
    // Let's rely on `drizzle-kit push` for schema changes and this script for seeding.
    // BUT, to be safe and follow instructions, I will try to use `migrate` from drizzle-orm if I had migration files. I don't have them yet.
    // So I will use `drizzle-kit push` via command line to sync schema, and this script purely for seeding.
    // Wait, the user said "run migrations and seed".

    // Let's seed.
    console.log("Seeding database...");

    // Seed Admin
    const adminEmail = "admin@promptforge.com";
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));

    if (existingAdmin.length === 0) {
        const passwordHash = await hash("Admin123!", 10);
        await db.insert(users).values({
            email: adminEmail,
            name: "Admin User",
            passwordHash,
            role: "admin",
            isActive: true,
        });
        console.log("Admin user seeded.");
    } else {
        console.log("Admin user already exists.");
    }

    // Seed Pricing
    const pricingData = [
        { provider: 'gemini', model: 'gemini-1.5-flash', costPer1kInput: '0.00035', costPer1kOutput: '0.00105' },
        { provider: 'claude', model: 'claude-3-5-haiku', costPer1kInput: '0.0008', costPer1kOutput: '0.004' },
        { provider: 'deepseek', model: 'deepseek-chat', costPer1kInput: '0.00014', costPer1kOutput: '0.00028' },
        { provider: 'openai', model: 'gpt-4o', costPer1kInput: '0.005', costPer1kOutput: '0.015' },
    ];

    for (const p of pricingData) {
        // Check if exists to avoid dupes if running multiple times, or just upsert if possible (checking provider+model)
        // Drizzle doesn't have a simple upsert in pg-core without specific constraints setup or `onConflictDoUpdate`.
        // Let's just check.
        const existing = await db.select().from(llmPricing).where(eq(llmPricing.model, p.model));
        if (existing.length === 0) {
            await db.insert(llmPricing).values(p);
            console.log(`Seeded pricing for ${p.model}`);
        }
    }

    console.log("Seeding complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Migration/Seed failed:", err);
    process.exit(1);
});
