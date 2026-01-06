import fs from "fs";
import path from "path";
import {
  DetectedIntent,
  IntentConfig,
  ReminderChannel,
  RootConfig,
} from "@/shared/type";
import { logDebug, logError } from "../../shared/logger";
import { classifyIntentLLM } from "./llmIntentService";
// Import chrono-node(#issue 8)
import * as chrono from "chrono-node";
import { unknown } from "zod";

let intentConfig: RootConfig;

//Load config.json when server start
function loadConfig() {
  try {
    const configPath = path.join(
      __dirname,
      "..",
      "config",
      "intent-config.json"
    );
    const raw = fs.readFileSync(configPath, "utf-8");
    intentConfig = JSON.parse(raw) as RootConfig;
    logDebug("[NLP Service] Loaded intent config from: ", configPath);
  } catch (error) {
    logError("[NLP Service] Error loading intent config: ", error);
    //fallback error
    intentConfig = {
      defaultIntent: "unknown",
      minScore: 1,
      intents: [],
    };
  }
}
loadConfig();

const VN_TZ = "Asia/Ho_Chi_Minh";

function getVietnamRefDate() {
  // tạo refDate theo giờ VN để chrono parse "next week" đúng theo VN
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 60 * 60000);
}

function formatDateVN(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: VN_TZ }); // YYYY-MM-DD
}

function formatTimeVN(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    timeZone: VN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }); // HH:mm
}

function formatTime(t?: string) {
  if (!t) return "";
  if (/^\d{1,2}h\d{0,2}$/.test(t)) {
    const replaced = t.replace("h", ":");
    return t.endsWith("h") ? replaced + "00" : replaced; // 9h -> 9:00
  }
  return t;
}

function formatDate(d?: string) {
  if (!d) return "";
  // YYYY-MM-DD -> DD/MM/YYYY
  const [year, month, day] = d.split("-");
  return `${day}/${month}/${year}`;
}

function buildTitleFromTypeAndCourse(args: {
  type?: "exam" | "lecture" | "other" | "assignment";
  course?: string | null;
  fallback?: string;
}) {
  const type = args.type || "other";
  const course = (args.course || "").trim();
  const fallback = (args.fallback || "").trim();

  const cap = (s: string) =>
    s
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");

  if (course) {
    const c = cap(course);
    if (type === "exam") return `Kỳ thi ${c}`;
    if (type === "assignment") return `Bài tập ${c}`;
    if (type === "lecture") return `Lịch học ${c}`;
    return `Sự kiện ${c}`;
  }

  // không có course => dùng fallback nếu có
  if (fallback) return cap(fallback);

  // fallback cuối cùng
  if (type === "exam") return "Kỳ thi";
  if (type === "assignment") return "Bài tập";
  if (type === "lecture") return "Lịch học";
  return "Sự kiện mới";
}

function remindersToText(rs?: number[]) {
  if (!rs || rs.length === 0) return "";
  const map: Record<number, string> = {
    [-60]: "1 phút",
    [-300]: "5 phút",
    [-900]: "15 phút",
    [-1800]: "30 phút",
    [-3600]: "1 giờ",
    [-7200]: "2 giờ",
    [-86400]: "1 ngày",
    [-172800]: "2 ngày",
    [-604800]: "1 tuần",
  };
  const parts = rs.map((r) => map[r] || `${Math.abs(r)} giây`).filter(Boolean);
  return parts.length ? ` (nhắc trước ${parts.join(", ")})` : "";
}

function polite(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

export function generateResponse(intent: DetectedIntent): string {
  const { name, entities } = intent || { name: unknown, entities: [] };
  switch (name) {
    case "add_event": {
      const t = entities?.type;
      const title =
        entities?.title ||
        (t === "exam"
          ? "kỳ thi"
          : t === "assignment"
          ? "bài tập"
          : "sự kiện mới");
      const date = formatDate(entities?.date);
      const time = formatTime(entities?.timeStart);
      const course = entities?.courseName
        ? ` cho môn **${entities.courseName}**`
        : "";
      const location = entities?.location
        ? ` tại **${entities.location}**`
        : "";
      const remind = remindersToText(entities?.reminder as number[]);

      const line1 = `Đã ghi nhận ${title}${course} vào **${date}${
        time ? " " + time : ""
      }**${location}${remind}.`;
      const line2 = `Bạn muốn mình **lưu** sự kiện này ngay không? (trả lời “Có” để tạo)`;
      return polite(`${line1} ${line2}`);
    }
    case "find_event": {
      const date = formatDate(entities?.date);
      const time = formatTime(entities?.timeStart);
      const t = entities?.type ? ` loại **${entities.type}**` : "";
      const title = entities?.title ? ` có tên **${entities.title}**` : "";
      const at = date ? ` vào **${date}${time ? " " + time : ""}**` : "";
      return polite(
        `Mình sẽ tìm các sự kiện${t}${title}${at}. Bạn muốn lọc thêm theo **môn học** hoặc **địa điểm** không?`
      );
    }
    case "unknown": {
      return polite(
        `Xin lỗi, mình chưa hiểu rõ yêu cầu. ` +
          `Bạn có thể nói: “Thêm kỳ thi Toán **12/12 09:00**, nhắc trước **1 ngày**” ` +
          `hoặc “Tìm **bài tập** vào **tuần sau Thứ 3**”.`
      );
    }
    case "error": {
      return polite(
        `Hiện có lỗi khi xử lý yêu cầu. Bạn thử lại giúp mình một chút nhé.`
      );
    }
    default:
      return polite(
        `Mình chưa hỗ trợ ý định này. Bạn mô tả lại theo mẫu “Thêm [loại] [tên] [ngày] [giờ]” nhé.`
      );
  }
}

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
  return str
    .toLowerCase()
    .split("")
    .map((char) => VN_CHAR_MAP[char] || char)
    .join("");
}

function normalizeText(raw: string): string {
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
    mốt: "day after tomorrow",
    "tuần sau": "next week",
    "tuần tới": "next week",
    "chủ nhật": "sunday",
    "thứ 2": "monday",
    "thứ hai": "monday",
    "thứ 3": "tuesday",
    "thứ ba": "tuesday",
    "thứ 4": "wednesday",
    "thứ tư": "wednesday",
    "thứ 5": "thursday",
    "thứ năm": "thursday",
    "thứ 6": "friday",
    "thứ sáu": "friday",
    "thứ 7": "saturday",
    "thứ bảy": "saturday",
    //Single words should be placed at the end or handled with care.
    mai: "tomorrow",
  };

  // Replace long keywords first
  // Bug fix: use new RegExp with \b to capture exactly the word "mai" (not "khuyen dai")
  for (const key in mapObj) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
  t = t
    .replace(/\bchiều\b/g, "pm")
    .replace(/\bsáng\b/g, "am")
    .replace(/\btối\b/g, "pm");

  return t;
}
// #issue 8
export interface ExtractedEntities {
  userId: string;
  datetime?: Date;
  title?: string;
  course?: string | null; //issue #23
  reminderOffset?: number;
  type?: "exam" | "lecture" | "other" | "assignment";
  reminderChannel?: ReminderChannel;
}

//Cal score for intent
function evaluateIntent(intent: IntentConfig, text: string): number {
  const keywords = intent.keywords_any || [];
  const required = intent.required || [];
  const excluded = intent.excluded || [];
  const priority = intent.priority ?? 0;
  let score = 0;
  // check if has keyword in excluded -> score = 0
  for (const ex of excluded) {
    const exNorm = normalizeText(ex);
    if (exNorm && text.includes(exNorm)) {
      return 0;
    }
  }
  //check if miss keyword in required key -> score = 0
  for (const req of required) {
    const reqNorm = normalizeText(req);
    if (reqNorm && text.includes(reqNorm)) {
      score = 0;
    }
  }

  //count keyword match
  let matchCount = 0;
  for (const keyword of keywords) {
    const keywordNorm = normalizeText(keyword);
    if (keywordNorm && text.includes(keywordNorm)) {
      matchCount++;
    }
  }
  if (matchCount === 0) return 0;
  return matchCount + priority;
}

const LLM_CONFIDENCE_THRESHOLD = 0.7;

export const NLPService = {
  async detectIntent(rawText: string): Promise<string> {
    try {
      if (!rawText || rawText.trim() === "") return intentConfig.defaultIntent;

      //Call LLM
      const llmResult = await classifyIntentLLM(rawText);
      if (
        llmResult.intent &&
        llmResult.intent !== intentConfig.defaultIntent &&
        llmResult.confidence >= LLM_CONFIDENCE_THRESHOLD
      ) {
        return llmResult.intent;
      }
      // If confidence < LLM_CONFIDENCE_THRESHOLD or unknown -> fallback rule-based
      const text = normalizeText(rawText);
      if (!text) return intentConfig.defaultIntent;
      let maxScore = 0;
      let maxIntent = intentConfig.defaultIntent;
      for (const intent of intentConfig.intents) {
        const score = evaluateIntent(intent, text);
        if (score > maxScore) {
          maxScore = score;
          maxIntent = intent.name;
        }
      }
      logDebug("[NLPService] detectIntent", {
        rawText,
        normalized: text,
        maxIntent,
        maxScore,
      });
      return maxIntent;
    } catch (error) {
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
      course: null, //(issue #23)
      userId: "",
    };

    try {
      const translatedText = mapVietnameseDateToEnglish(text);
      logDebug("[NLPService] Translated Text:", translatedText);

      const refDate = getVietnamRefDate();
      const parsedDates = chrono.parse(translatedText, refDate);

      let cleanText = text;
      logDebug("[NLPService] Parsed Dates:", parsedDates);
      //Handling Reminders
      //Handling Reminders
      const reminderRegex =
        /\bnhắc(?:\s*nhở)?\b[^0-9]{0,40}?\b(?:trước|truoc)\b[^0-9]{0,20}?(\d+)\s*(phút|giờ|gio|tiếng|tieng|ngày|ngay)\b/iu;

      const reminderMatch = cleanText.match(reminderRegex);
      if (reminderMatch) {
        const amount = parseInt(reminderMatch[1], 10);
        const unit = reminderMatch[2].toLowerCase();
        let seconds = 0;

        if (unit.includes("phút")) seconds = amount * 60;
        else if (
          unit.includes("giờ") ||
          unit.includes("gio") ||
          unit.includes("tiếng") ||
          unit.includes("tieng")
        )
          seconds = amount * 3600;
        else seconds = amount * 86400;

        entities.reminderOffset = -seconds;

        // remove matched segment
        cleanText = cleanText.replace(reminderMatch[0], " ");
      }
      if (parsedDates.length > 0) {
        let datePart: Date | null = null;
        let timePart: Date | null = null;

        for (const r of parsedDates) {
          const d = r.start.date();
          const txt = (r.text || "").toLowerCase();

          if (
            txt.includes("next week") ||
            txt.includes("today") ||
            txt.includes("tomorrow") ||
            txt.includes("monday") ||
            txt.includes("tuesday") ||
            txt.includes("wednesday") ||
            txt.includes("thursday") ||
            txt.includes("friday") ||
            txt.includes("saturday") ||
            txt.includes("sunday")
          ) {
            datePart = d;
          }

          if (
            txt.includes("at ") ||
            txt.includes(":") ||
            txt.includes("am") ||
            txt.includes("pm")
          ) {
            timePart = d;
          }
        }

        const base = datePart ?? timePart ?? refDate;

        if (datePart && timePart) {
          base.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
        }

        entities.datetime = base;

        logDebug("[NLPService] Raw Date (merged):", base);

        //Remove specific time clusters (9am, 9:30am, 10am) using Regex first
        cleanText = cleanText.replace(
          /\b\d{1,2}\s*(?:h|giờ|:)\s*(?:\d{2})?\b/gi,
          ""
        );
        cleanText = cleanText.replace(
          /\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g,
          ""
        );

        //Remove time keywords using Boundary (\b)
        const timeKeywords = [
          "hôm nay",
          "ngày mai",
          "ngày kia",
          "mốt",
          "tuần sau",
          "thứ 2",
          "thứ 3",
          "thứ 4",
          "thứ 5",
          "thứ 6",
          "thứ 7",
          "chủ nhật",
          "thứ hai",
          "thứ ba",
          "thứ tư",
          "thứ năm",
          "thứ sáu",
          "thứ bảy",
          "lúc",
          "sáng",
          "chiều",
          "tối",
          "ngày",
          "tháng",
          "mai",
        ];

        timeKeywords.forEach((k) => {
          // Only delete if it is a separate word
          const reg = new RegExp(`\\b${k}\\b`, "gi");
          cleanText = cleanText.replace(reg, " ");
        });
      }
      const courseRegex =
        /(?:môn|lớp|học phần|nộp|bài tập|deadline)\s+([a-zA-ZđĐáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ\d\s]+?)(?=\s*(?:vào|lúc|ngày|mai|thứ|sáng|chiều|tối|$))/i;

      const courseMatch = text.match(courseRegex);
      if (courseMatch?.[1]) {
        entities.course = courseMatch[1].trim();
        if (entities.course) {
          entities.course = entities.course
            .replace(/\s+/g, " ")
            .replace(/[,.;:!?]+$/g, "")
            .trim();
        }
      }

      if (!entities.course) {
        const examCourseRegex =
          /(?:kỳ\s*thi|thi|kiểm\s*tra|test|exam)\s+([a-zA-ZđĐáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ\d\s]+?)(?=\s*(?:vào|lúc|ngày|mai|thứ|\d{1,2}[\/\-]\d{1,2}|sáng|chiều|tối|,|\.|$))/i;

        const m = text.match(examCourseRegex);
        if (m?.[1]) entities.course = m[1].trim();
      }

      if (!entities.course) {
        const assignmentCourseRegex =
          /(?:bài\s*tập|deadline|đồ\s*án|assignment)\s+([a-zA-ZđĐ0-9\s]+?)(?=\s*(?:chương|phần|nộp|vào|lúc|ngày|mai|thứ|\d{1,2}[\/\-]\d{1,2}|,|\.|$))/i;

        const m2 = text.match(assignmentCourseRegex);
        if (m2?.[1]) entities.course = m2[1].trim();
      }

      // 3. Event Type (Extract Type)
      const lowerText = text.toLowerCase();
      if (/(email|gmail|mail)/.test(lowerText))
        entities.reminderChannel = "Email";
      if (/(in[\s-]?app|ứng dụng|app)/.test(lowerText))
        entities.reminderChannel = "In-app";
      if (/(thi|kỳ thi|kiểm tra|test|exam|midterm|final)/.test(lowerText)) {
        entities.type = "exam";
      } else if (
        /(bài tập|deadline|đồ án|assignment|nộp|homework|project)/.test(
          lowerText
        )
      ) {
        entities.type = "assignment";
      } else if (/(học nhóm|họp|meeting|sinh hoạt|clb)/.test(lowerText)) {
        entities.type = "other";
      } else if (/(học|tiết|lecture|class|lớp|môn)/.test(lowerText)) {
        entities.type = "lecture";
      }

      // 4: Header Processing
      const actionKeywords = [
        "thêm",
        "tạo",
        "đặt lịch",
        "lên lịch",
        "nhắc tôi",
        "nhắc mình",
        "nhắc",
        "schedule",
        "add",
        "create",
        "set",
      ];

      cleanText = cleanText.replace(/\s+/g, " ").trim();

      // remove action keywords only at start
      let foundKeyword = true;
      while (foundKeyword) {
        foundKeyword = false;
        for (const kw of actionKeywords) {
          if (new RegExp(`^${kw}\\b`, "i").test(cleanText)) {
            cleanText = cleanText
              .replace(new RegExp(`^${kw}\\b`, "i"), " ")
              .trim();
            foundKeyword = true;
          }
        }
      }

      // remove reminder phrase tail
      cleanText = cleanText
        .replace(/\bnhắc\s*(?:trước|lai|lại)\b[\s\S]*$/i, " ")
        .replace(/\bnhac\s*(?:truoc|lai)\b[\s\S]*$/i, " ")
        .trim();

      // remove weekday phrases like "thứ 2 tuần sau"
      cleanText = cleanText.replace(
        /\b(thứ\s*[2-7]|chu\s*nhật|chủ\s*nhật)\b(\s+(tuần\s*(sau|tới)|tuần\s*này))?/gi,
        " "
      );

      // remove leftover time/date tokens
      cleanText = cleanText.replace(
        /\b(vào|vao|lúc|luc|ngày|ngay|tuần|sau|tới|sáng|chiều|tối|hôm nay|ngày mai|ngày kia|mốt)\b/gi,
        " "
      );

      // remove punctuation
      cleanText = cleanText.replace(/[.,!?;:]/g, " ");

      // remove stopwords
      const stopwords = [
        "tôi",
        "mình",
        "em",
        "anh",
        "chị",
        "bạn",
        "cần",
        "muốn",
        "nhờ",
        "giúp",
        "giup",
        "hãy",
        "với",
        "nhé",
        "nhe",
        "ạ",
        "a",
        "đi",
        "dùm",
        "dum",
      ];

      for (const s of stopwords) {
        const r = new RegExp(`\\b${s.replace(/\s+/g, "\\s+")}\\b`, "gi");
        cleanText = cleanText.replace(r, " ");
      }

      entities.title = buildTitleFromTypeAndCourse({
        type: entities.type,
        course: entities.course,
        fallback: cleanText,
      });

      logDebug("[NLPService] Extracted Entities:", entities);
      return entities;
    } catch (error) {
      logError("[NLPService] Error extracting entities:", error);
      return entities;
    }
  },
  generateResponse: generateResponse,
};
