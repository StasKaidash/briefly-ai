import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { env } from "@/lib/env";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
const TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT = `You turn long articles into concise briefs.

Reply by calling the \`emit_brief\` tool exactly once. Do not produce prose.

Rules for the brief:
- tldr: exactly three sentences in plain language, no marketing tone.
- key_points: exactly five bullets, each <=15 words, factual not editorial.
- tags: 3 to 5 lowercase single-word or hyphenated tags (e.g. "react", "ai-agents").
- reading_time_min: integer minutes to read the ORIGINAL article at ~230 words/minute.

If the article body is too thin to honor these rules, still emit your best effort —
never refuse the tool call.`;

const TOOL = {
  name: "emit_brief",
  description: "Emit a structured brief of the article supplied by the user.",
  input_schema: {
    type: "object" as const,
    required: ["tldr", "key_points", "tags", "reading_time_min"],
    additionalProperties: false,
    properties: {
      tldr: { type: "string" },
      key_points: {
        type: "array",
        minItems: 5,
        maxItems: 5,
        items: { type: "string" },
      },
      tags: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: { type: "string" },
      },
      reading_time_min: { type: "integer", minimum: 1 },
    },
  },
};

const briefSummarySchema = z.object({
  tldr: z.string().min(1),
  key_points: z.array(z.string().min(1)).length(5),
  tags: z.array(z.string().min(1)).min(3).max(5),
  reading_time_min: z.number().int().min(1),
});

export type BriefSummary = z.infer<typeof briefSummarySchema>;

export class SummarizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SummarizeError";
  }
}

// Lazy so we don't crank up the SDK during build-time evaluation.
let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return _client;
}

/**
 * Calls Claude with the article and returns a validated structured brief.
 * The system prompt carries `cache_control: ephemeral` so repeated calls within
 * the 5-minute TTL pay 10% of input tokens for the system block.
 */
export async function summarize({
  title,
  content,
}: {
  title: string;
  content: string;
}): Promise<BriefSummary> {
  const response = await client()
    .messages.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "tool", name: TOOL.name },
        messages: [
          {
            role: "user",
            content: `Title: ${title}\n\nArticle:\n${content}`,
          },
        ],
      },
      { timeout: TIMEOUT_MS },
    )
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      throw new SummarizeError(`Claude request failed: ${message}`);
    });

  const toolUse = response.content.find(
    (block): block is Extract<typeof block, { type: "tool_use" }> =>
      block.type === "tool_use" && block.name === TOOL.name,
  );

  if (!toolUse) {
    throw new SummarizeError("Claude did not call the emit_brief tool");
  }

  const parsed = briefSummarySchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new SummarizeError(
      `emit_brief returned invalid payload: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}
