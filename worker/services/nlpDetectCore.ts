/* eslint-disable @typescript-eslint/no-explicit-any */
import { logDebug } from "../../shared/logger";
import {
  DetectCoreResult,
  DetectedIntent,
  mapIntentName,
  toVNEntities,
  VNEntities,
  VNIntentName,
} from "../../shared/type";
import { NLPService } from "./nlpService";

function stablePick(text: string, options: string[]) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return options[h % options.length];
}

function toVNDate(date?: string, time?: string) {
  if (!date || !time) return null;

  const d = new Date(`${date}T${time}:00+07:00`);
  return isNaN(d.getTime()) ? null : d;
}

function isPastTimeVN(date?: string, time?: string) {
  const d = toVNDate(date, time);
  if (!d) return false;

  const now = new Date();
  const nowVN = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );
  return d.getTime() < nowVN.getTime();
}

// validate giờ HH:mm
function isValidHHmm(t?: string) {
  if (!t) return false;
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [hh, mm] = t.split(":").map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

// Detect input rác
function isNonsense(textRaw: string) {
  const t = (textRaw || "").trim();
  if (!t) return true;
  const hasAlphaNum = /[a-zA-Z0-9À-ỹ]/.test(t);
  if (!hasAlphaNum) return true;
  if (/^(.)\1{4,}$/.test(t)) return true; // aaaaa, !!!!!, ...
  return false;
}

// confirm
function isConfirm(textRaw: string) {
  const t = (textRaw || "").trim().toLowerCase();
  return [
    "có",
    "ok",
    "oke",
    "okay",
    "yes",
    "y",
    "đồng ý",
    "tạo",
    "lưu",
    "xác nhận",
    "confirm",
  ].includes(t);
}

// required fields per intent
function missingRequiredFields(intent: VNIntentName, entities: VNEntities) {
  // add_event / create_task đều cần date + timeStart
  const required: string[] =
    intent === "create_task" ? ["date", "timeStart"] : ["date", "timeStart"];

  // nếu có reminder thì phải có remindChannel
  const hasReminder =
    (Array.isArray((entities as any)?.reminder) &&
      (entities as any).reminder.length > 0) ||
    (typeof (entities as any)?.reminderOffset === "number" &&
      (entities as any).reminderOffset !== 0);

  if (hasReminder && !entities.remindChannel) {
    required.push("remindChannel");
  }

  return required.filter((k) => !(entities as any)?.[k]);
}

function friendlyMissingText(fields: string[]) {
  const map: Record<string, string> = {
    date: "ngày",
    timeStart: "giờ",
    remindChannel: "kênh nhắc",
  };
  return fields.map((f) => map[f] ?? f).join(", ");
}

function detectSmallTalk(textRaw: string): string | null {
  const text = (textRaw || "").trim().toLowerCase();
  if (!text) return null;

  // Greeting
  const greet = /(^|\s)(chào|xin chào|hi|hello|hey|alo|hí|hii|chao)(\s|$)/i;
  if (greet.test(text) || text === "bạn ơi" || text === "bot ơi") {
    return stablePick(text, [
      "Chào bạn 👋 Mình ở đây nè. Bạn muốn mình giúp gì hôm nay?",
      "Hi bạn! Bạn cần mình hỗ trợ gì nè—tạo nhắc nhở, thêm lịch, hay hỏi bài?",
      "Chào bạn 😊 Bạn cứ nói mục tiêu của bạn, mình sẽ gợi ý cách làm nhanh nhất.",
    ]);
  }

  // Thanks
  const thanks = /(cảm ơn|cam on|thanks|tks|thank you)/i;
  if (thanks.test(text)) {
    return stablePick(text, [
      "Không có gì đâu 😄 Bạn cần thêm gì cứ nhắn mình nhé.",
      "Okie nè! Nếu muốn mình hỗ trợ tiếp thì nói mình nghe nha 😊",
      "Rất vui được giúp bạn 👍 Còn muốn làm gì tiếp không?",
    ]);
  }

  // Bye
  const bye = /(tạm biệt|bye|goodbye|chào nhé|ngủ ngon|pp)/i;
  if (bye.test(text)) {
    return stablePick(text, [
      "Ok bạn 👋 Chúc bạn một ngày thật tốt lành nha!",
      "Tạm biệt bạn! Khi nào cần mình thì quay lại nhắn nha 😊",
      "Ngủ ngon nha 😴 Mai cần gì cứ gọi mình!",
    ]);
  }

  // Sorry
  const sorry = /(xin lỗi|sorry|sr)/i;
  if (sorry.test(text)) {
    return stablePick(text, [
      "Không sao đâu 😊 Bạn nói mình nghe bạn đang muốn làm gì nhé?",
      "Ổn mà bạn 👍 Mình giúp bạn tiếp nè—bạn cần hỗ trợ phần nào?",
    ]);
  }

  // Who are you
  const who = /(bạn là ai|mày là ai|ai vậy|bot là gì)/i;
  if (who.test(text)) {
    return "Mình là trợ lý học tập của bạn 😊 Mình có thể giúp bạn tạo nhắc nhở, thêm lịch học/thi, và hỗ trợ giải thích bài. Bạn muốn bắt đầu từ đâu nè?";
  }

  return null;
}

export async function detectIntentCore(args: {
  text: string;
  userId?: string;
  pendingIntent?: VNIntentName;
  pendingEntities?: VNEntities;
  selectedChannel?: "Email" | "In-app" | string;
}): Promise<DetectCoreResult> {
  const { text, userId, pendingIntent, pendingEntities, selectedChannel } =
    args;

  logDebug(
    `[NLP] detectIntentCore {text: ${text}}, {pendingIntent: ${pendingIntent}}, {pendingEntities: ${JSON.stringify(
      pendingEntities
    )}}, {selectedChannel: ${selectedChannel}}`
  );

  // small talk
  const smallTalk = detectSmallTalk(text);
  if (smallTalk) {
    return {
      kind: "execute",
      intent: "unknown",
      entities: userId ? ({ userId } as VNEntities) : ({} as VNEntities),
      responseText: smallTalk,
      directly: true,
      shouldExecuteAction: false,
    } as any;
  }

  // input dump
  if (isNonsense(text)) {
    return {
      kind: "execute",
      intent: "unknown",
      entities: userId ? ({ userId } as VNEntities) : ({} as VNEntities),
      responseText:
        'Mình chưa hiểu ý bạn 😥 Bạn thử nhập lại theo mẫu: "Thêm lịch thi Toán 25/12 14:00, nhắc trước 1 giờ qua Email".',
      directly: true,
      shouldExecuteAction: false,
    } as any;
  }

  if (
    (pendingIntent === "add_event" || pendingIntent === "create_task") &&
    pendingEntities &&
    isConfirm(text.toLocaleLowerCase())
  ) {
    // validate HH:mm nếu có
    if (
      pendingEntities.timeStart &&
      !isValidHHmm(String(pendingEntities.timeStart))
    ) {
      return {
        kind: "follow_up",
        intent: pendingIntent,
        entities: pendingEntities,
        responseText:
          "Giờ bạn nhập chưa đúng 😥 Bạn nhập lại theo dạng **HH:mm** nhé (ví dụ **14:00**, **09:30**).",
        followUp: {
          question: "Bạn nhập lại giờ theo dạng HH:mm nhé.",
          field: "timeStart",
        },
        pendingIntent,
        pendingEntities,
        shouldExecuteAction: false,
      } as any;
    }

    // missing field → follow_up
    const missing = missingRequiredFields(pendingIntent, pendingEntities);
    if (missing.length) {
      const missingText = friendlyMissingText(missing);
      return {
        kind: "follow_up",
        intent: pendingIntent,
        entities: pendingEntities,
        responseText: `Bạn bổ sung giúp mình **${missingText}** nhé.`,
        followUp: {
          question: `Bạn bổ sung giúp mình ${missingText} nhé.`,
          field: missing[0],
          option:
            missing[0] === "remindChannel" ? ["Email", "In-app"] : undefined,
        },
        pendingIntent,
        pendingEntities,
        shouldExecuteAction: false,
      } as any;
    }

    return {
      kind: "execute",
      intent: pendingIntent,
      entities: pendingEntities,
      responseText:
        pendingIntent === "add_event"
          ? "Ok 👍 Mình sẽ tạo lịch cho bạn ngay."
          : "Ok 👍 Mình sẽ tạo task cho bạn ngay.",
      shouldExecuteAction: true,
    } as any;
  }

  // FOLLOW UP channel (Email/In-app)
  if (
    (pendingIntent === "create_task" || pendingIntent === "add_event") &&
    pendingEntities &&
    (selectedChannel === "Email" || selectedChannel === "In-app")
  ) {
    const merged = {
      ...pendingEntities,
      remindChannel: selectedChannel,
    } as VNEntities;

    logDebug("[NLPDETECTCORE] Merged: ", merged);

    const missing = missingRequiredFields(pendingIntent, merged);

    if (missing.length) {
      const missingText = friendlyMissingText(missing);
      return {
        kind: "follow_up",
        intent: pendingIntent,
        entities: merged,
        responseText: `Bạn bổ sung giúp mình **${missingText}** nhé.`,
        followUp: {
          question: `Bạn bổ sung giúp mình ${missingText} nhé.`,
          field: missing[0],
          option:
            missing[0] === "remindChannel" ? ["Email", "In-app"] : undefined,
        },
        pendingIntent,
        pendingEntities: merged,
        shouldExecuteAction: false,
      } as any;
    }

    const detected: DetectedIntent = {
      name: pendingIntent,
      entities: merged,
    };

    return {
      kind: "follow_up",
      intent: pendingIntent,
      entities: merged,
      responseText: NLPService.generateResponse(detected),
      followUp: {
        question: "Bạn xác nhận tạo nhé? (trả lời “Có” để tạo)",
        field: "confirm",
      },
      pendingIntent,
      pendingEntities: merged,
      shouldExecuteAction: false,
    } as any;
  }

  // NORMAL FLOW: detect intent + extract entities
  const intentRaw = await NLPService.detectIntent(text);
  const intentStr =
    typeof intentRaw === "string"
      ? intentRaw
      : typeof intentRaw === "object" &&
        intentRaw !== null &&
        "intent" in intentRaw
      ? String((intentRaw as { intent?: unknown }).intent || "")
      : "";

  const extracted = await NLPService.extractEntities(text);
  const entities = toVNEntities(extracted);
  if (userId) entities.userId = userId;

  const name = mapIntentName(intentStr);
  const detected: DetectedIntent = {
    name,
    entities,
  };

  logDebug("[NLP] Detected Intent: ", detected);

  // validate & follow up cho add_event/create_task
  if (detected.name === "add_event" || detected.name === "create_task") {
    // timeStart sai format HH:mm
    if (
      detected.entities.timeStart &&
      !isValidHHmm(detected.entities.timeStart)
    ) {
      return {
        kind: "follow_up",
        intent: detected.name,
        entities: detected.entities,
        responseText:
          "Giờ bạn nhập chưa đúng 😥 Bạn nhập lại theo dạng **HH:mm** nhé (ví dụ **14:00**, **09:30**).",
        followUp: {
          question: "Bạn nhập lại giờ theo dạng HH:mm nhé.",
          field: "timeStart",
        },
        pendingIntent: detected.name,
        pendingEntities: detected.entities,
        shouldExecuteAction: false,
      } as any;
    }

    if (isPastTimeVN(detected.entities.date, detected.entities.timeStart)) {
      return {
        kind: "follow_up",
        intent: detected.name,
        entities: detected.entities,
        responseText:
          "Thời gian bạn nhập đang ở **quá khứ** 😥 Bạn vui lòng gửi yêu cầu lại đúng nhé!.",
        followUp: {
          question: "Bạn nhập lại ngày/giờ giúp mình nhé.",
          field: "date", // hoặc timeStart tùy bạn muốn hỏi cái nào trước
        },
        pendingIntent: detected.name,
        pendingEntities: detected.entities,
        shouldExecuteAction: false,
      };
    }

    const missing = missingRequiredFields(detected.name, detected.entities);

    if (missing.length) {
      const missingText = friendlyMissingText(missing);
      const example =
        detected.name === "create_task"
          ? 'Ví dụ: "Tạo task nộp bài Toán 25/12 23:59, nhắc trước 1 ngày qua Email"'
          : 'Ví dụ: "Thêm lịch thi Toán 25/12 14:00, nhắc trước 1 giờ qua Email"';

      return {
        kind: "follow_up",
        intent: detected.name,
        entities: detected.entities,
        responseText: `Mình hiểu ý bạn rồi 👍 Bạn bổ sung giúp mình **${missingText}** nhé. ${example}`,
        followUp: {
          question: `Bạn bổ sung giúp mình ${missingText} nhé.`,
          field: missing[0],
          option:
            missing[0] === "remindChannel" ? ["Email", "In-app"] : undefined,
        },
        pendingIntent: detected.name,
        pendingEntities: detected.entities,
        shouldExecuteAction: false,
      } as any;
    }

    return {
      kind: "follow_up",
      intent: detected.name,
      entities: detected.entities,
      responseText: NLPService.generateResponse(detected),
      followUp: {
        question: "Bạn xác nhận tạo nhé? (trả lời “Có” để tạo)",
        field: "confirm",
      },
      pendingIntent: detected.name,
      pendingEntities: detected.entities,
      shouldExecuteAction: false,
    } as any;
  }

  // other intents
  return {
    kind: "execute",
    intent: detected.name,
    entities: detected.entities,
    responseText: NLPService.generateResponse(detected),
    shouldExecuteAction: false,
  } as any;
}
