import fs from "fs";
import path from "path";
import { IntentConfig, RootConfig } from "@/shared/type";
import { logDebug, logError } from "../utils/logger";
import { classifyIntentLLM } from "./llmIntentService";
// Import chrono-node(#issue 8)
import * as chrono from "chrono-node";

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


// (#issue 8) Hàm dịch ngày tháng tiếng Việt sang Anh
function mapVietnameseDateToEnglish(text: string): string {
    let t = text.toLowerCase();
    
    // 1. Handling format date DD/MM
    t = t.replace(/ngày\s+(\d{1,2})[\/\-](\d{1,2})/g, "$2/$1"); 

    // 2.Time keyword map 
    const mapObj: Record<string, string> = {
        "hôm nay": "today",
        "ngày mai": "tomorrow",
        "ngày kia": "day after tomorrow",
        "mốt": "day after tomorrow",
        "tuần sau": "next week",
        "tuần tới": "next week",
        "chủ nhật": "sunday",
        "thứ 2": "monday", "thứ hai": "monday",
        "thứ 3": "tuesday", "thứ ba": "tuesday",
        "thứ 4": "wednesday", "thứ tư": "wednesday",
        "thứ 5": "thursday", "thứ năm": "thursday",
        "thứ 6": "friday", "thứ sáu": "friday",
        "thứ 7": "saturday", "thứ bảy": "saturday",
        //Single words should be placed at the end or handled with care.
        "mai": "tomorrow" 
    };

    // Replace long keywords first
    // Bug fix: use new RegExp with \b to capture exactly the word "mai" (not "khuyen dai")
    for (const key in mapObj) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // \b matches word boundaries. For example, \bmai\b will match "mai" but not "pho cheese"
        const reg = new RegExp(`\\b${escapedKey}\\b`, "gi"); 
        t = t.replace(reg, mapObj[key]);
    }
    
    // 3. Hour handling: "9h", "9 giờ", "9 h" -> "9:00"
    t = t.replace(/lúc/g, "at");
    
    // Case 1: 9h30 -> 9:30
    t = t.replace(/(\d+)\s*(?:h|giờ)\s*(\d+)/g, "$1:$2");
    // Case 2: 9h -> 9:00 
    t = t.replace(/(\d+)\s*(?:h|giờ)/g, "$1:00");
    
    // 4. Session handling
    t = t.replace(/\bchiều\b/g, "pm").replace(/\bsáng\b/g, "am").replace(/\btối\b/g, "pm");
    
    return t;
}
// #issue 8
export interface ExtractedEntities {
    datetime?: Date;
    title?: string;
    course?: string; //issue #23
    reminderOffset?: number;
    type?: 'exam' | 'lecture' | 'other' | 'assignment';
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

const LLM_CONFIDENCE_THRESHOLD = 0.7;

export const NLPService = {
    async detectIntent(rawText: string): Promise<string>{
        try{
            if (!rawText || rawText.trim() === "") return intentConfig.defaultIntent;

            //Call LLM
            const llmResult = await classifyIntentLLM(rawText);
            if (llmResult.intent && 
                llmResult.intent !== intentConfig.defaultIntent && 
                llmResult.confidence >= LLM_CONFIDENCE_THRESHOLD) {
                    return llmResult.intent;
                }
            // If confidence < LLM_CONFIDENCE_THRESHOLD or unknown -> fallback rule-based
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
    },
    // (#issue 8) Function to extract entities from text
    extractEntities(text: string): ExtractedEntities {
        const entities: ExtractedEntities = {
            datetime: undefined,
            reminderOffset: 0,
            title: "",
            type: "other",
            course: undefined //(issue #23)
        };

        try {
            const translatedText = mapVietnameseDateToEnglish(text);
            logDebug("[NLPService] Translated Text:", translatedText);

            const parsedDates = chrono.parse(translatedText); 
            
            let cleanText = text; 

            if (parsedDates.length > 0) {
                const dateResult = parsedDates[0];
                //(issue #8)fix timezone to GMT+7
                let rawDate = dateResult.start.date();
                
                const GMT7_OFFSET = 7 * 60 * 60 * 1000;
                const fixedDate = new Date(rawDate.getTime() + GMT7_OFFSET);

                entities.datetime = fixedDate;
                //1. Remove specific time clusters (9am, 9:30am, 10am) using Regex first
                cleanText = cleanText.replace(/\b\d{1,2}\s*(?:h|giờ|:)\s*(?:\d{2})?\b/gi, "");
                cleanText = cleanText.replace(/\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g, "");

                // 2. Remove time keywords using Boundary (\b)
                const timeKeywords = [
                    "hôm nay", "ngày mai", "ngày kia", "mốt", "tuần sau", 
                    "thứ 2", "thứ 3", "thứ 4", "thứ 5", "thứ 6", "thứ 7", "chủ nhật", 
                    "thứ hai", "thứ ba", "thứ tư", "thứ năm", "thứ sáu", "thứ bảy",
                    "lúc", "sáng", "chiều", "tối", "ngày", "tháng", 
                    "mai" // thêm mai vào đây để xóa khỏi title
                ];

                timeKeywords.forEach(k => {
                    // Only delete if it is a separate word
                    const reg = new RegExp(`\\b${k}\\b`, "gi");
                    cleanText = cleanText.replace(reg, " ");
                });
            }

            // Bước 2: Handling Reminders
            const reminderRegex = /nhắc (?:trước|lại) (\d+) (phút|giờ|tiếng|ngày)/i;
            const reminderMatch = text.match(reminderRegex);
            
            if (reminderMatch) {
                const amount = parseInt(reminderMatch[1]);
                const unit = reminderMatch[2].toLowerCase();
                let seconds = 0;
                if (unit.includes('phút')) seconds = amount * 60;
                else if (unit.includes('giờ') || unit.includes('tiếng')) seconds = amount * 3600;
                else if (unit.includes('ngày')) seconds = amount * 86400;
                
                entities.reminderOffset = -seconds; 
                cleanText = cleanText.replace(reminderMatch[0], "");
            }

            // 3. Xử lý Môn học(issue #23) 
            const courseRegex = /(?:môn|lớp|học phần)\s+([a-zA-ZđĐáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ\d\s]+?)(?=\s*(?:vào|lúc|ngày|mai|thứ|sáng|chiều|tối|$))/i;
            const courseMatch = text.match(courseRegex);
            
            if (courseMatch && courseMatch[1]) {
                entities.course = courseMatch[1].trim(); 
            }

            // 3. Event Type (Extract Type) 
            const lowerText = text.toLowerCase();

            if (/(thi|kỳ thi|kiểm tra|test|exam|midterm|final)/.test(lowerText)) {
                entities.type = "exam";
            } else if (/(bài tập|deadline|đồ án|assignment|nộp|homework|project)/.test(lowerText)) {
                entities.type = "assignment";
            } else if (/(học nhóm|họp|meeting|sinh hoạt|clb)/.test(lowerText)) {
                entities.type = "other"; 
            } else if (/(học|tiết|lecture|class|lớp|môn)/.test(lowerText)) {
                entities.type = "lecture";
            }

            // 4: Header Processing
            const actionKeywords = ["thêm", "tạo", "đặt lịch", "nhắc tôi", "có", "lịch", "bài tập", "thi", "deadline", "vào", "họp", "cuộc họp", "sự kiện", "lên lịch"];
            
            // Remove extra spaces left by replace
            cleanText = cleanText.replace(/\s+/g, " ").trim();
            
            let foundKeyword = true;
            while(foundKeyword) {
                foundKeyword = false;
                for (const kw of actionKeywords) {
                    // Use startsWith in combination with regex to make sure it's the first word of the sentence
                    if (new RegExp(`^${kw}\\b`, 'i').test(cleanText)) {
                        cleanText = cleanText.replace(new RegExp(`^${kw}\\b`, 'i'), "").trim();
                        foundKeyword = true;
                    }
                }
            }
            
            cleanText = cleanText.replace(/[.,!?;:]/g, "").trim();
            
            if (cleanText.length > 0) {
                entities.title = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
            } else {
                entities.title = "Sự kiện mới";
            }

            logDebug("[NLPService] Extracted Entities:", entities);
            return entities;

        } catch (error) {
            logError("[NLPService] Error extracting entities:", error);
            return entities; 
        }
    }
}
