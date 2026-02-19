import { pgTable, text, timestamp, boolean, uuid, jsonb, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").default("user").notNull(), // 'admin' or 'user'
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: uuid("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const transactions = pgTable("transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .references(() => users.id),
    frameworkUsed: text("framework_used").notNull(),
    userQuestion: text("user_question").notNull(),
    clarifyingQa: jsonb("clarifying_qa"), // array of {question, answer}
    geminiPrompt: text("gemini_prompt"),
    claudePrompt: text("claude_prompt"),
    deepseekPrompt: text("deepseek_prompt"),
    rankingResult: jsonb("ranking_result"), // {rank: [1,2,3], explanation: string, winner: string}
    geminiCost: numeric("gemini_cost").default("0"),
    claudeCost: numeric("claude_cost").default("0"),
    deepseekCost: numeric("deepseek_cost").default("0"),
    openaiCost: numeric("openai_cost").default("0"),
    totalCost: numeric("total_cost").default("0"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const llmPricing = pgTable("llm_pricing", {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider"), // 'gemini', 'claude', 'deepseek', 'openai'
    model: text("model"),
    costPer1kInput: numeric("cost_per_1k_input"),
    costPer1kOutput: numeric("cost_per_1k_output"),
    updatedAt: timestamp("updated_at").defaultNow(),
});
