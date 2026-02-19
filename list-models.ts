
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function list() {
    try {
        // This is not directly exposed in the high-level SDK easily, 
        // but let's try a direct fetch if the SDK doesn't have listModels on the main client.
        // Actually, let's try to use the model "gemini-1.0-pro" instead, maybe the alias is the issue.
        // Or try a simple fetch to the list endpoint.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log("Available Models:", JSON.stringify(data, null, 2));

    } catch (error: any) {
        console.error("Error listing models:", error.message);
    }
}

list();
