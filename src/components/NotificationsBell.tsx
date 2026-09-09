import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { subscribeWithLogging } from "@/lib/realtime-logger";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  milestone: string | null;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (active) setItems((data as Notification[]) || []);
    })();

    const suffix = Math.random().toString(36).slice(2, 10);
    const channelName = `notifications:${user.id}:${suffix}`;
    const channel = subscribeWithLogging(
      supabase.channel(channelName).on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => [payload.new as Notification, ...prev].slice(0, 30));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => prev.map((it) => (it.id === n.id ? n : it)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setItems((prev) => prev.filter((it) => it.id !== (payload.old as Notification).id));
        },
      ),
      { channel: channelName, callback: "notifications:*", userId: user.id },
    );

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  const unread = items.filter((n) => !n.read_at).length;

  const markAll = async () => {
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (!ids.length) return;
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
  };

  const markOne = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-accent/40 transition-colors"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-gold text-navy text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-semibold text-sm">Notifications</div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAll} className="h-7 text-xs">
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            items.map((n) => {
              const content = (
                <div
                  className={`px-4 py-3 border-b border-border/60 last:border-0 hover:bg-accent/30 cursor-pointer ${
                    n.read_at ? "opacity-60" : ""
                  }`}
                  onClick={() => {
                    if (!n.read_at) markOne(n.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm text-foreground line-clamp-2">{n.title}</div>
                    {!n.read_at && <span className="mt-1 w-2 h-2 rounded-full bg-gold flex-shrink-0" />}
                  </div>
                  {n.body && (
                    <div className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">
                      {n.body}
                    </div>
                  )}
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} to={n.link}>
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })
          )}
        </div>
        <div className="px-4 py-2 border-t border-border text-center">
          <Link
            to="/dashboard/reminders"
            onClick={() => setOpen(false)}
            className="text-xs text-primary hover:underline"
          >
            Reminder preferences
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}