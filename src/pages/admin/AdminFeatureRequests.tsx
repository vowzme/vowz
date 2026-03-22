import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Lightbulb, MessageSquare, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FeatureRequest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  screenshot_url: string | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
}

const STATUS_OPTIONS = ["new", "reviewing", "planned", "implemented"] as const;

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  reviewing: "bg-amber-100 text-amber-700 border-amber-200",
  planned: "bg-purple-100 text-purple-700 border-purple-200",
  implemented: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function AdminFeatureRequests() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("feature_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      setRequests((data as any) ?? []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("feature_requests" as any)
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (!error) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast({ title: `Marked as ${status}` });
    }
  };

  const submitReply = async (id: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase
      .from("feature_requests" as any)
      .update({ admin_reply: replyText.trim(), updated_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (!error) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, admin_reply: replyText.trim() } : r));
      setReplyingId(null);
      setReplyText("");
      toast({ title: "Reply saved" });
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Feature Requests</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-12 text-center">
            <Lightbulb className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-body text-muted-foreground">No feature requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <CardTitle className="font-body text-base flex-1">{req.title}</CardTitle>
                  <Badge variant="outline" className={`font-body text-xs capitalize ${statusColors[req.status] || ""}`}>
                    {req.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-body">
                  {format(new Date(req.created_at), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-body text-sm text-foreground whitespace-pre-wrap">{req.description}</p>

                {req.screenshot_url && (
                  <img src={req.screenshot_url} alt="Screenshot" className="rounded-lg max-w-xs border border-border/50" />
                )}

                {/* Status actions */}
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <Button
                      key={s}
                      variant={req.status === s ? "default" : "outline"}
                      size="sm"
                      className="font-body text-xs capitalize"
                      onClick={() => updateStatus(req.id, s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>

                {/* Admin reply */}
                {req.admin_reply && (
                  <div className="bg-muted/50 rounded-lg p-3 border border-border/30">
                    <p className="text-xs font-body font-medium text-muted-foreground mb-1">Admin Reply:</p>
                    <p className="font-body text-sm">{req.admin_reply}</p>
                  </div>
                )}

                {replyingId === req.id ? (
                  <div className="flex gap-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="font-body text-sm flex-1"
                      rows={2}
                    />
                    <Button size="sm" onClick={() => submitReply(req.id)}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => { setReplyingId(req.id); setReplyText(req.admin_reply || ""); }}>
                    <MessageSquare className="w-4 h-4 mr-1" /> {req.admin_reply ? "Edit Reply" : "Reply"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
