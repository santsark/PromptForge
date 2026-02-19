import { z } from "zod";

/**
 * Prompt injection detection.
 * Rejects inputs containing known injection phrases.
 */
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /ignore\s+(all\s+)?prior\s+instructions/i,
    /disregard\s+(all\s+)?previous/i,
    /system\s+prompt/i,
    /you\s+are\s+now/i,
    /act\s+as\s+if\s+you/i,
    /pretend\s+you\s+are/i,
    /override\s+(your|the)\s+(instructions|rules)/i,
    /reveal\s+(your|the)\s+(system|initial)\s+prompt/i,
    /what\s+(is|are)\s+your\s+(system|initial)\s+(prompt|instructions)/i,
];

export function containsInjection(text: string): boolean {
    return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

function noInjection(fieldName: string) {
    return z.string().refine((val) => !containsInjection(val), {
        message: `${fieldName} contains disallowed content.`,
    });
}

// ---- Schemas ----

export const clarifySchema = z.object({
    framework: z.string().min(1, "Framework is required").max(50),
    userQuestion: z
        .string()
        .min(1, "Question is required")
        .max(2000, "Question must be under 2000 characters")
        .pipe(noInjection("Question")),
    previousQA: z
        .array(
            z.object({
                question: z.string().max(2000),
                answer: z
                    .string()
                    .max(1000, "Answer must be under 1000 characters")
                    .pipe(noInjection("Answer")),
            })
        )
        .optional()
        .default([]),
});

export const generateSchema = z.object({
    framework: z.string().min(1, "Framework is required").max(50),
    userQuestion: z
        .string()
        .min(1, "Question is required")
        .max(2000, "Question must be under 2000 characters")
        .pipe(noInjection("Question")),
    qaHistory: z
        .array(
            z.object({
                question: z.string().max(2000),
                answer: z.string().max(1000).pipe(noInjection("Answer")),
            })
        )
        .optional()
        .default([]),
});

export const rankSchema = z.object({
    framework: z.string().min(1).max(50),
    userQuestion: z.string().min(1).max(2000),
    prompts: z.object({
        gemini: z.object({ prompt: z.string(), cost: z.number(), tokens: z.any() }),
        claude: z.object({ prompt: z.string(), cost: z.number(), tokens: z.any() }),
        deepseek: z.object({ prompt: z.string(), cost: z.number(), tokens: z.any() }),
    }),
});

export const saveTransactionSchema = z.object({
    framework: z.string().min(1).max(50),
    userQuestion: z.string().min(1).max(2000),
    qaHistory: z.array(z.any()).optional().default([]),
    prompts: z.object({
        gemini: z.object({ prompt: z.string(), cost: z.number() }).passthrough(),
        claude: z.object({ prompt: z.string(), cost: z.number() }).passthrough(),
        deepseek: z.object({ prompt: z.string(), cost: z.number() }).passthrough(),
    }),
    ranking: z.any(),
    costs: z.object({
        gemini: z.number(),
        claude: z.number(),
        deepseek: z.number(),
        ranking: z.number(),
        clarify: z.number(),
    }),
});

/**
 * Helper to format Zod validation errors into a readable string.
 */
export function formatZodErrors(error: z.ZodError): string {
    return error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
}
