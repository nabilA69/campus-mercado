import "server-only";
import { isValidCiFormat, ciPrefixFromDob } from "@/lib/ci";

/**
 * Automated Carné de Identidad reading.
 *
 * Provider-agnostic: talks the OpenAI-compatible /chat/completions shape, so it
 * works with Qwen-VL (Alibaba DashScope), OpenAI, or any compatible gateway —
 * switch with env vars, no code change:
 *
 *   AI_VISION_BASE_URL  e.g. https://dashscope-intl.aliyuncs.com/compatible-mode/v1
 *   AI_VISION_API_KEY   the provider key
 *   AI_VISION_MODEL     e.g. qwen-vl-max
 *
 * NOTE ON CUBA: this call is made by the SERVER (Vercel), never by the student's
 * device, so the provider only ever sees a request from the host — a Cuban IP is
 * never involved. Whichever provider is configured therefore works for Cuban users.
 */

export type CiVerifyReason =
  | "approved"
  | "not_carne"
  | "unreadable"
  | "ci_mismatch"
  | "typed_mismatch"
  | "not_configured"
  | "ai_error";

export type CiVerifyDecision = {
  approved: boolean;
  ciNumber: string | null;
  reason: CiVerifyReason;
  detail?: string;
};

export function aiVisionConfigured(): boolean {
  return Boolean(
    process.env.AI_VISION_BASE_URL &&
      process.env.AI_VISION_API_KEY &&
      process.env.AI_VISION_MODEL,
  );
}

const PROMPT = `You are verifying a Cuban identity document for a students-only marketplace.

The image should show the FRONT of a Cuban "Carné de Identidad" (it may be the "para Extranjeros / Residencia Temporal" variant for foreign residents).

Reply with ONLY a JSON object, no markdown fences, no commentary:
{"isCarne": boolean, "ciNumber": string, "confident": boolean, "note": string}

Rules:
- "isCarne": true ONLY if this is clearly a Cuban Carné de Identidad card (printed card title such as "CARNE DE IDENTIDAD" and/or "REPUBLICA DE CUBA" visible). Any other image, document, screenshot or blank paper => false.
- "ciNumber": the handwritten "No. CI" number on the card. Exactly 11 digits. Digits only, no spaces or punctuation. If you cannot read all 11 digits clearly, return "".
- "confident": true only if you are sure every one of the 11 digits is correct. NEVER guess a digit. If any digit is ambiguous, set false and return "" for ciNumber.
- "note": one short sentence describing what you see.`;

type AiOut = {
  isCarne?: boolean;
  ciNumber?: string;
  confident?: boolean;
  note?: string;
};

function extractJson(text: string): AiOut | null {
  // tolerate ```json fences or surrounding prose
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as AiOut;
  } catch {
    return null;
  }
}

export async function verifyCarneImage(opts: {
  base64: string;
  mediaType: string;
  dob: Date;
  typedCi?: string | null;
}): Promise<CiVerifyDecision> {
  if (!aiVisionConfigured()) {
    return { approved: false, ciNumber: null, reason: "not_configured" };
  }

  const base = process.env.AI_VISION_BASE_URL!.replace(/\/$/, "");
  const model = process.env.AI_VISION_MODEL!;

  let text: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.AI_VISION_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${opts.mediaType};base64,${opts.base64}`,
                },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        approved: false,
        ciNumber: null,
        reason: "ai_error",
        detail: `HTTP ${res.status} ${body.slice(0, 180)}`,
      };
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[];
    };
    const content = json.choices?.[0]?.message?.content;
    text =
      typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content
              .map((c) =>
                typeof c === "object" && c && "text" in c
                  ? String((c as { text?: unknown }).text ?? "")
                  : "",
              )
              .join("")
          : "";
  } catch (err) {
    return {
      approved: false,
      ciNumber: null,
      reason: "ai_error",
      detail: String(err).slice(0, 180),
    };
  }

  const out = extractJson(text);
  if (!out) {
    return {
      approved: false,
      ciNumber: null,
      reason: "ai_error",
      detail: `unparseable: ${text.slice(0, 160)}`,
    };
  }

  if (!out.isCarne) {
    return { approved: false, ciNumber: null, reason: "not_carne", detail: out.note };
  }

  const ci = String(out.ciNumber ?? "").replace(/\D/g, "");
  if (!out.confident || !isValidCiFormat(ci)) {
    return { approved: false, ciNumber: null, reason: "unreadable", detail: out.note };
  }

  // If the student also typed a number, it must match the card — blocks a
  // consistent-but-invented CI paired with someone else's card photo.
  const typed = (opts.typedCi ?? "").replace(/\D/g, "");
  if (typed && typed !== ci) {
    return { approved: false, ciNumber: ci, reason: "typed_mismatch", detail: out.note };
  }

  if (ci.slice(0, 6) !== ciPrefixFromDob(opts.dob)) {
    return { approved: false, ciNumber: ci, reason: "ci_mismatch", detail: out.note };
  }

  return { approved: true, ciNumber: ci, reason: "approved", detail: out.note };
}
