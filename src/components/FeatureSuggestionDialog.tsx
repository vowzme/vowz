import { useState } from "react";
import { Lightbulb, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export default function FeatureSuggestionDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !title.trim() || !description.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("feature_requests" as any).insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
    } as any);

    if (!error) {
      toast({ title: "Thanks for your suggestion! 💡", description: "We'll review it soon." });
      setTitle("");
      setDescription("");
      setOpen(false);
    } else {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-body gap-2 border-[hsl(var(--gold))]/30 hover:border-[hsl(var(--gold))]/60 text-[hsl(var(--gold-dark))]">
          <Lightbulb className="w-4 h-4" />
          Suggest a Feature
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[hsl(var(--gold))]" />
            Suggest a Feature
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="font-body text-sm text-muted-foreground mb-1.5 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Add guest meal preferences filter"
              className="font-body"
              maxLength={100}
            />
          </div>
          <div>
            <label className="font-body text-sm text-muted-foreground mb-1.5 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you'd like to see and why it would be useful..."
              className="font-body"
              rows={4}
              maxLength={1000}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || submitting}
            className="w-full font-body"
            variant="gold"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Suggestion"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
