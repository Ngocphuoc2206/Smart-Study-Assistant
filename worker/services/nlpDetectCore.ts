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
  field: "remindChannel";
  option: Array<"Email" | "In-app">;
};

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
  logDebug("[NLP] detectIntentCore", text);

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
