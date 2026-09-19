// Normalizes caller-supplied chat turns before they reach the model.
// Only "user" and "assistant" turns survive — the system prompt is owned by the
// server, so a caller can never inject their own instructions or roles.

export type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 40;
const MAX_CHARS = 8000;

export function sanitizeChatMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const out: ChatMessage[] = [];
  for (const raw of input.slice(-MAX_MESSAGES)) {
    if (!raw || typeof raw !== "object") continue;
    const role = (raw as { role?: unknown }).role;
    const content = (raw as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const text = content.slice(0, MAX_CHARS).trim();
    if (!text) continue;
    out.push({ role, content: text });
  }
  return out;
}
