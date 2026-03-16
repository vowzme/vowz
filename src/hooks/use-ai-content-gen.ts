import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ContentType = "story" | "tagline" | "event_description" | "welcome_message";

interface GenerateOptions {
  type: ContentType;
  context: Record<string, string>;
}

export function useAIContentGen() {
  const [loading, setLoading] = useState<string | null>(null);

  const generate = async ({ type, context }: GenerateOptions): Promise<string | null> => {
    setLoading(type);
    try {
      const { data, error } = await supabase.functions.invoke("wedding-content-gen", {
        body: { type, context },
      });

      if (error) {
        console.error("AI content gen error:", error);
        toast({
          title: "AI generation failed",
          description: error.message || "Please try again in a moment.",
          variant: "destructive",
        });
        return null;
      }

      if (data?.error) {
        toast({
          title: "AI generation failed",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }

      return data?.content || null;
    } catch (err) {
      console.error("AI content gen error:", err);
      toast({
        title: "AI generation failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(null);
    }
  };

  return { generate, loading };
}
