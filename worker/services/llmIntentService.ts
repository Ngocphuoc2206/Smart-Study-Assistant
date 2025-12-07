/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";
import path from "path";
import fs from "fs";
import { RootConfig } from "@/shared/type";
import { logDebug, logError } from "../utils/logger";

// Load list intent from json cofig
const intentConfig: RootConfig = (() => {
    const configPath = path.join(__dirname, "..", "config", "intent-config.json");
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
    })();

//List intent LLM allow choose
const ALLOWED_INTENTS = intentConfig.intents.map((i: any) => ({
    name: i.name,
    description: i.description ?? "",
}));

//Init client OpentAI
const client = new OpenAI({
    baseURL: 'https://ai.megallm.io/v1',
    apiKey: process.env.MEGALLM_API_KEY,
});

// Return data BE
export interface LLMIntentResult {
    intent: string;
    confidence: number;
    resoning: string;
}

// Call LLM
export async function classifyIntentLLM(userText:string): Promise<LLMIntentResult> {
    if (!userText || userText.trim() === ""){
        return {
            intent: intentConfig.defaultIntent,
            confidence: 0,
            resoning: "Empty Input"
        }
    }
    const intentListStr = ALLOWED_INTENTS.map((i, idx) => `${idx + 1}. ${i.name} - ${i.description}`).join("\n");
    const systemPrompt = `
        Bạn là bộ phân loại intent cho trợ lý học tập tiếng Việt.

        Hãy trả lời DUY NHẤT trong block JSON dưới đây:

        <json>
        {
        "intent": "<intent>",
        "confidence": <0.0 - 1.0>,
        "reasoning": "<ngắn gọn>"
        }
        </json>

        Không được trả bất kỳ chữ nào bên ngoài <json>...</json>.
        Intent hợp lệ bao gồm:

        ${intentListStr}
    `.trim();
    try{
        // ===== Gọi MegaLLM =====
        const completion = await client.chat.completions.create({
            model: "openai-gpt-oss-20b",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userText },
            ],
            temperature: 0.5,
            max_tokens: 150,
        });
        const rawOutput = completion.choices?.[0]?.message?.content?.trim() || "";
        logDebug("[LLMINTENT] raw response", rawOutput);
        if (!rawOutput) {
            logError("[LLMINTENT] Empty response from model");
            return {
                intent: intentConfig.defaultIntent,
                confidence: 0,
                resoning: "Empty LLM response"
            };
        }

        let extractedJson = rawOutput;
        const match = rawOutput.match(/<json>([\s\S]*?)<\/json>/);
        if (match) {
            extractedJson = match[1].trim();
        }

        let parsed: any;
        try{
            parsed = JSON.parse(extractedJson);
        }
        catch(error){
            logError("[LLMINTENT] Error parsing JSON", error);
            return {
                intent: intentConfig.defaultIntent,
                confidence: 0,
                resoning: "LLM returned invalid JSON"
            }
        }
        const intent = String(parsed.intent);
        const confidence = Number(parsed.confidence);
        const resoning = String(parsed.reasoning || "");
        logDebug("[LLMINTENT] parsed response", { intent, confidence, resoning });
        return {
            intent,
            confidence: isNaN(confidence) ? 0 : confidence,
            resoning,
        };
    }catch(error){
        logError("[LLMINTENT] OpenAI API error", error);
        return {
            intent: intentConfig.defaultIntent,
            confidence: 0,
            resoning: "OpenAI API error"
        }
    }
}
