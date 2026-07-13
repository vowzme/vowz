import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ChecklistItem {
  id: string;
  wedding_site_id: string;
  title: string;
  category: string;
  due_date: string | null;
  is_completed: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

const DEFAULT_TASKS: { title: string; category: string; sort_order: number }[] = [
  { title: "Set wedding date & budget", category: "Planning", sort_order: 0 },
  { title: "Book ceremony & reception venue", category: "Venue", sort_order: 1 },
  { title: "Hire a wedding planner / coordinator", category: "Planning", sort_order: 2 },
  { title: "Create guest list", category: "Guests", sort_order: 3 },
  { title: "Book photographer & videographer", category: "Vendors", sort_order: 4 },
  { title: "Select wedding attire (bride & groom)", category: "Attire", sort_order: 5 },
  { title: "Book catering / finalize menu", category: "Food", sort_order: 6 },
  { title: "Order wedding cake / desserts", category: "Food", sort_order: 7 },
  { title: "Book DJ / band / entertainment", category: "Entertainment", sort_order: 8 },
  { title: "Arrange flowers & decorations", category: "Decor", sort_order: 9 },
  { title: "Send wedding invitations", category: "Guests", sort_order: 10 },
  { title: "Plan honeymoon", category: "Planning", sort_order: 11 },
  { title: "Arrange transport for wedding day", category: "Logistics", sort_order: 12 },
  { title: "Book hotel rooms for guests", category: "Logistics", sort_order: 13 },
  { title: "Get marriage license", category: "Legal", sort_order: 14 },
  { title: "Plan rehearsal dinner", category: "Events", sort_order: 15 },
  { title: "Finalize seating arrangement", category: "Guests", sort_order: 16 },
  { title: "Confirm all vendor bookings", category: "Vendors", sort_order: 17 },
  { title: "Write vows", category: "Ceremony", sort_order: 18 },
  { title: "Final dress / suit fitting", category: "Attire", sort_order: 19 },
];

export function useWeddingChecklist(siteId: string | undefined) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChecklist = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("wedding_checklist" as any)
      .select("*")
      .eq("wedding_site_id", siteId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Load checklist error:", error);
      setError(error.message || "Failed to load checklist");
      setLoading(false);
      return;
    }

    const rows = (data || []) as any as ChecklistItem[];

    // Seed defaults if empty
    if (rows.length === 0) {
      const inserts = DEFAULT_TASKS.map((t) => ({
        wedding_site_id: siteId,
        title: t.title,
        category: t.category,
        sort_order: t.sort_order,
      }));
      const { data: seeded, error: seedErr } = await supabase
        .from("wedding_checklist" as any)
        .insert(inserts)
        .select();
      if (seedErr) {
        console.error("Seed checklist error:", seedErr);
        setError(seedErr.message || "Failed to create default checklist");
      } else if (seeded) {
        setItems(seeded as any as ChecklistItem[]);
      }
    } else {
      setItems(rows);
    }
    setLoading(false);
  }, [siteId]);

  const addItem = useCallback(
    async (title: string, category: string, due_date: string | null) => {
      if (!siteId) return;
      const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
      const { data, error } = await supabase
        .from("wedding_checklist" as any)
        .insert({
          wedding_site_id: siteId,
          title,
          category,
          due_date,
          sort_order: maxOrder,
        })
        .select()
        .single();
      if (error) {
        toast({ title: "Error adding task", description: error.message, variant: "destructive" });
        return;
      }
      setItems((prev) => [...prev, data as any as ChecklistItem]);
    },
    [siteId, items]
  );

  const toggleItem = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const { error } = await supabase
        .from("wedding_checklist" as any)
        .update({ is_completed: !item.is_completed } as any)
        .eq("id", id);
      if (!error) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, is_completed: !i.is_completed } : i))
        );
      }
    },
    [items]
  );

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("wedding_checklist" as any)
      .delete()
      .eq("id", id);
    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  }, []);

  const updateItem = useCallback(
    async (id: string, updates: { title?: string; due_date?: string | null; category?: string; notes?: string | null }) => {
      const { error } = await supabase
        .from("wedding_checklist" as any)
        .update(updates as any)
        .eq("id", id);
      if (!error) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
        );
      }
    },
    []
  );

  const completedCount = items.filter((i) => i.is_completed).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return { items, loading, error, loadChecklist, addItem, toggleItem, deleteItem, updateItem, completedCount, progress };
}
