/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";
import path from "path";
import fs from "fs";
import { RootConfig, VNEntities, VNIntentName } from "@/shared/type";
import { logDebug, logError } from "../../shared/logger";

const client = new OpenAI({
  baseURL: "https://ai.megallm.io/v1",
  apiKey: process.env.MEGALLM_API_KEY,
});

const intentConfig: RootConfig = (() => {
  const configPath = path.join(__dirname, "..", "config", "intent-config.json");
  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw);
})();

export type HistoryItem = { role: "user" | "assistant"; content: string };

export async function generateFallbackReply(args: {
  userText: string;
  detectedIntent?: VNIntentName;
  entities?: VNEntities;
  history?: HistoryItem[];
}): Promise<string> {
  const { userText, detectedIntent, entities, history } = args;

  try {
    const supported = intentConfig.intents
      .map((i: any) => `- ${i.name}: ${i.description ?? ""}`)
      .join("\n");

    const systemPrompt = `
Bạn là chatbot trợ lý học tập tiếng Việt, nói chuyện giống người thật.
- Xưng hô: "mình" - "bạn"
- Trả lời 2–5 câu, thân thiện, tự nhiên (emoji vừa phải)
- Không bịa ra việc đã tạo task/sự kiện hay đã lưu dữ liệu nếu hệ thống chưa xác nhận
- Nếu câu hỏi mơ hồ: hỏi 1 câu để làm rõ + gợi ý 1–2 lựa chọn
- Nếu người dùng muốn tạo task/sự kiện nhưng thiếu (tên/ngày/giờ): hỏi đúng phần thiếu, kèm 1 ví dụ ngắn

Các intent BE hiện có:
${supported}
`.trim();

    const messages: any[] = [{ role: "system", content: systemPrompt }];

    if (history?.length) {
      for (const h of history.slice(-8)) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    messages.push({
      role: "user",
      content: `Ngữ cảnh BE: ${JSON.stringify({
        detectedIntent: detectedIntent ?? "unknown",
        entities: entities ?? {},
      })}\n\nTin nhắn người dùng: ${userText}`,
    });

    const completion = await client.chat.completions.create({
      model: "openai-gpt-oss-20b",
      messages,
      temperature: 0.7,
      max_tokens: 220,
    });

    const out = completion.choices?.[0]?.message?.content?.trim() || "";
    logDebug("[LLMCHAT] response", out);
    return (
      out ||
      "Mình chưa hiểu rõ ý bạn. Bạn nói thêm giúp mình bạn muốn làm gì nhé?"
    );
  } catch (e) {
    logError("[LLMCHAT] error", e);
    return "Mình chưa hiểu rõ ý bạn. Bạn nói thêm giúp mình bạn muốn làm gì nhé?";
  }
}
