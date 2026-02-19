
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    const models = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];

    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello!");
            const response = await result.response;
            console.log(`✅ Success with ${modelName}:`, response.text().substring(0, 50) + "...");
        } catch (error: any) {
            console.error(`❌ Error with ${modelName}:`, error.message.split('\n')[0]);
        }
    }
}

run();
