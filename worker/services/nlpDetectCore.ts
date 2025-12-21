/* eslint-disable @typescript-eslint/no-explicit-any */
import { logDebug } from "../../shared/logger";
import {
  DetectedIntent,
  mapIntentName,
  toVNEntities,
  VNEntities,
  VNIntentName,
} from "../../shared/type";
import { NLPService } from "./nlpService";

type FollowUp = {
  question: string;
  field: string;
  option?: Array<"Email" | "In-app">;
};

function stablePick(text: string, options: string[]) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return options[h % options.length];
}

function missingRequiredFields(intent: VNIntentName, entities: VNEntities) {
  const required =
    intent === "create_task"
      ? ["title", "date"]
      : ["title", "date", "timeStart"];
  return required.filter((k) => !(entities as any)?.[k]);
}

function friendlyMissingText(fields: string[]) {
  const map: Record<string, string> = {
    title: "tên",
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

  // Sorry / apology
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

export type DetectCoreResult =
  | {
      kind: "follow_up";
      intent: VNIntentName;
      entities: VNEntities;
      responseText: string;
      followUp: FollowUp;
      pendingIntent: VNIntentName;
      pendingEntities: VNEntities;
    }
  | {
      kind: "execute";
      intent: VNIntentName;
      entities: VNEntities;
      responseText: string;
      directly?: boolean;
    };

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
  //Reply chatbot natural
  const smallTalk = detectSmallTalk(text);
  if (smallTalk) {
    return {
      kind: "execute",
      intent: "unknown",
      entities: userId ? ({ userId } as VNEntities) : ({} as VNEntities),
      responseText: smallTalk,
      directly: true,
    };
  }
  //Follow up
  if (
    (pendingIntent === "create_task" || pendingIntent === "add_event") &&
    pendingEntities &&
    (selectedChannel === "Email" || selectedChannel === "In-app")
  ) {
    const merged = {
      ...pendingEntities,
      remindChannel: selectedChannel,
    };
    return {
      kind: "execute",
      intent: pendingIntent as VNIntentName,
      entities: merged as VNEntities,
      responseText: `Ok, mình sẽ nhắc bạn qua **${selectedChannel}**.`,
    };
  }

  const intentRaw = await NLPService.detectIntent(text);
  const intentStr =
    typeof intentRaw === "string"
      ? intentRaw
      : typeof intentRaw === "object" &&
        intentRaw !== null &&
        "intent" in intentRaw
      ? String((intentRaw as { intent?: unknown }).intent || "")
      : "";

  const extracted = NLPService.extractEntities(text);
  const entities = toVNEntities(extracted);

  if (userId) entities.userId = userId;
  const name = mapIntentName(intentStr);
  const detected: DetectedIntent = {
    name,
    entities,
  };

  logDebug("[NLP] Detected Intent: ", detected);
  //If missing field reply from chatbot
  if (detected.name === "create_task" || detected.name === "add_event") {
    const missing = missingRequiredFields(detected.name, detected.entities);
    if (missing.length) {
      const missingText = friendlyMissingText(missing);
      const example =
        detected.name === "create_task"
          ? 'Ví dụ: "Tạo task nộp bài Toán 25/12"'
          : 'Ví dụ: "Thêm lịch học Toán 25/12 09:00"';

      return {
        kind: "follow_up",
        intent: detected.name,
        entities: detected.entities,
        responseText: `Mình hiểu ý bạn rồi 👍 Bạn bổ sung giúp mình **${missingText}** nhé. ${example}`,
        followUp: {
          question: `Bạn bổ sung giúp mình ${missingText} nhé.`,
          field: missing[0],
        },
        pendingIntent: detected.name,
        pendingEntities: detected.entities,
      };
    }
  }

  const needChannel =
    Array.isArray(detected.entities?.reminder) &&
    detected.entities.reminder.length > 0 &&
    !detected.entities.remindChannel;

  if (
    needChannel &&
    (detected.name === "create_task" || detected.name === "add_event")
  ) {
    const responseText =
      "Bạn muốn tôi nhắc nhở ở đâu? **Email** hoặc **In-app**";
    return {
      kind: "follow_up",
      intent: detected.name,
      entities: detected.entities,
      responseText,
      followUp: {
        question: "Bạn muốn tôi nhắc nhở ở đâu?",
        field: "remindChannel",
        option: ["Email", "In-app"],
      },
      pendingIntent: detected.name,
      pendingEntities: detected.entities,
    };
  }
  return {
    kind: "execute",
    intent: detected.name,
    entities: detected.entities,
    responseText: NLPService.generateResponse(detected),
  };
}
