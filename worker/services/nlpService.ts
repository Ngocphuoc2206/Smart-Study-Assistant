import fs from "fs";
import path from "path";
import { IntentConfig, RootConfig } from "@/shared/type";
import { logDebug, logError } from "../utils/logger";

let intentConfig: RootConfig;

//Load config.json when server start
function loadConfig(){
    try{
        const configPath = path.join(__dirname, "..", "config", "intent-config.json");
        const raw = fs.readFileSync(configPath, "utf-8");
        intentConfig = JSON.parse(raw) as RootConfig;
        logDebug("[NLP Service] Loaded intent config from: ", configPath);
    }catch(error){
        logError("[NLP Service] Error loading intent config: ", error);
        //fallback error
        intentConfig = {
            defaultIntent: "unknown",
            minScore: 1,
            intents: []
        }
    }
}
loadConfig();

//Validate
const VN_CHAR_MAP: Record<string, string> = {
    á: "a",
    à: "a",
    ả: "a",
    ã: "a",
    ạ: "a",
    ă: "a",
    ắ: "a",
    ằ: "a",
    ẳ: "a",
    ẵ: "a",
    ặ: "a",
    â: "a",
    ấ: "a",
    ầ: "a",
    ẩ: "a",
    ẫ: "a",
    ậ: "a",
    đ: "d",
    é: "e",
    è: "e",
    ẻ: "e",
    ẽ: "e",
    ẹ: "e",
    ê: "e",
    ế: "e",
    ề: "e",
    ể: "e",
    ễ: "e",
    ệ: "e",
    í: "i",
    ì: "i",
    ỉ: "i",
    ĩ: "i",
    ị: "i",
    ó: "o",
    ò: "o",
    ỏ: "o",
    õ: "o",
    ọ: "o",
    ô: "o",
    ố: "o",
    ồ: "o",
    ổ: "o",
    ỗ: "o",
    ộ: "o",
    ơ: "o",
    ớ: "o",
    ờ: "o",
    ở: "o",
    ỡ: "o",
    ợ: "o",
    ú: "u",
    ù: "u",
    ủ: "u",
    ũ: "u",
    ụ: "u",
    ư: "u",
    ứ: "u",
    ừ: "u",
    ử: "u",
    ữ: "u",
    ự: "u",
    ý: "y",
    ỳ: "y",
    ỷ: "y",
    ỹ: "y",
    ỵ: "y",
};

function removeVietnameseDiacritics(str: string): string {
    return str.toLowerCase().split("").map(char => VN_CHAR_MAP[char] || char).join("");
}

function normalizeText(raw: string): string{
    if (!raw) return "";
    let text = removeVietnameseDiacritics(raw.trim());
    text = text.replace(/[^a-z0-9\s]/g, " ");
    text = text.replace(/\s+/g, " ");
    return text.trim();
}

//Cal score for intent
function evaluateIntent(intent: IntentConfig, text: string): number{
    const keywords = intent.keywords_any || [];
    const required = intent.required || [];
    const excluded = intent.excluded || [];
    const priority = intent.priority ?? 0;
    let score = 0;
    // check if has keyword in excluded -> score = 0
    for (const ex of excluded){
        const exNorm = normalizeText(ex);
        if (exNorm && text.includes(exNorm)){
            return 0;
        }
    }
    //check if miss keyword in required key -> score = 0 
    for (const req of required){
        const reqNorm = normalizeText(req);
        if (reqNorm && text.includes(reqNorm)){
            score = 0;
        }
    }

    //count keyword match
    let matchCount = 0;
    for (const keyword of keywords){
        const keywordNorm = normalizeText(keyword);
        if (keywordNorm && text.includes(keywordNorm)){
            matchCount++;
        }
    }
    if (matchCount === 0) return 0;
    return matchCount + priority;
}

export const NLPService = {
    detectIntent(rawText: string): string{
        try{
            if (!rawText || rawText.trim() === "") return intentConfig.defaultIntent;
            const text = normalizeText(rawText);
            if (!text) return intentConfig.defaultIntent;
            let maxScore = 0;
            let maxIntent = intentConfig.defaultIntent;
            for (const intent of intentConfig.intents){
                const score = evaluateIntent(intent, text);
                if (score > maxScore){
                    maxScore = score;
                    maxIntent = intent.name;
                }
            }
            logDebug("[NLPService] detectIntent", { rawText, normalized: text, maxIntent, maxScore });
            return maxIntent;
        }catch(error){
            logError("[NLPService] Error detecting intent: ", error);
            return intentConfig.defaultIntent;
        }
    }
}
