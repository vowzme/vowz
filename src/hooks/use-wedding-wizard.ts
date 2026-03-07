import { useState, useCallback } from "react";

type Message = { role: "user" | "assistant"; content: string };

export interface WeddingData {
  partner1: string;
  partner2: string;
  culturalBackground: string;
  howWeMet: string;
  functions: string[];
  theme: string;
  suggestedColors: string[];
  tagline: string;
  countdownLabel?: string;
  travelInfo?: {
    heading: string;
    description: string;
    hotels: { name: string; description: string; distance: string }[];
    directions: string;
  };
  welcomeMessage?: string;
}

export function useWeddingWizard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [wizardData, setWizardData] = useState<WeddingData | null>(null);

  const checkForCompletion = (text: string): WeddingData | null => {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.complete && parsed.data) return parsed.data;
      } catch { /* not valid json yet */ }
    }
    return null;
  };

  const streamResponse = async (allMessages: Message[], onComplete?: (assistantText: string) => void) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wedding-wizard`;
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || `Error ${resp.status}`);
    }
    if (!resp.body) throw new Error("No response stream");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantSoFar = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
              }
              return [...prev, { role: "assistant", content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    onComplete?.(assistantSoFar);
    return assistantSoFar;
  };

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: Message = { role: "user", content: input };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setIsLoading(true);

    try {
      const assistantText = await streamResponse(allMessages);
      const data = checkForCompletion(assistantText);
      if (data) {
        setWizardData(data);
        setMessages((prev) => {
          return prev.map((m, i) => {
            if (i === prev.length - 1 && m.role === "assistant") {
              const withoutJson = m.content.replace(/```json[\s\S]*?```/g, "").trim();
              return { ...m, content: withoutJson || "✨ Your wedding site is ready! Let me show you what I've created..." };
            }
            return m;
          });
        });
      }
    } catch (e) {
      console.error("Wizard error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${e instanceof Error ? e.message : "Unknown error"}. Please try again.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const startWizard = useCallback((customPrompt?: string) => {
    setMessages([]);
    setWizardData(null);
    setIsLoading(true);

    const initMessages: Message[] = [{ role: "user", content: customPrompt || "Hi! I'd like to create my wedding website." }];

    streamResponse(initMessages)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return { messages, isLoading, wizardData, sendMessage, startWizard };
}
