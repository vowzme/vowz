import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BudgetData {
  id: string;
  wedding_site_id: string;
  total_budget: number;
  currency: string;
}

export interface Expense {
  id: string;
  wedding_site_id: string;
  category: string;
  title: string;
  amount: number;
  paid: boolean;
  due_date: string | null;
  vendor_name: string | null;
  notes: string | null;
  created_at: string;
}

export const EXPENSE_CATEGORIES = [
  { value: "venue", label: "Venue", icon: "🏛️" },
  { value: "catering", label: "Catering", icon: "🍽️" },
  { value: "decor", label: "Decor & Flowers", icon: "💐" },
  { value: "photography", label: "Photo & Video", icon: "📸" },
  { value: "clothing", label: "Outfits & Jewelry", icon: "👗" },
  { value: "music", label: "Music & DJ", icon: "🎵" },
  { value: "invitations", label: "Invitations", icon: "💌" },
  { value: "transport", label: "Transport", icon: "🚗" },
  { value: "mehendi", label: "Mehendi", icon: "🖐️" },
  { value: "gifts", label: "Gifts & Favors", icon: "🎁" },
  { value: "makeup", label: "Makeup & Hair", icon: "💄" },
  { value: "pandit", label: "Pandit & Rituals", icon: "🙏" },
  { value: "other", label: "Other", icon: "📦" },
];

export function useWeddingBudget() {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBudget = useCallback(async (siteId: string) => {
    setLoading(true);
    const [{ data: budgetData }, { data: expenseData }] = await Promise.all([
      supabase.from("wedding_budget").select("*").eq("wedding_site_id", siteId).maybeSingle(),
      supabase.from("wedding_expenses").select("*").eq("wedding_site_id", siteId).order("created_at", { ascending: false }),
    ]);
    setBudget(budgetData as any);
    setExpenses((expenseData as any) || []);
    setLoading(false);
  }, []);

  const setBudgetAmount = useCallback(async (siteId: string, amount: number) => {
    const { data, error } = await supabase
      .from("wedding_budget")
      .upsert({ wedding_site_id: siteId, total_budget: amount } as any, { onConflict: "wedding_site_id" })
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setBudget(data as any);
      toast({ title: "Budget updated! 💰" });
    }
  }, []);

  const addExpense = useCallback(async (siteId: string, expense: Partial<Expense>) => {
    const { data, error } = await supabase
      .from("wedding_expenses")
      .insert({ wedding_site_id: siteId, ...expense } as any)
      .select()
      .single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setExpenses(prev => [data as any, ...prev]);
      toast({ title: "Expense added! ✅" });
    }
    return { data, error };
  }, []);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    const { error } = await supabase
      .from("wedding_expenses")
      .update(updates as any)
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("wedding_expenses")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast({ title: "Expense deleted" });
    }
  }, []);

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalPaid = expenses.filter(e => e.paid).reduce((sum, e) => sum + Number(e.amount), 0);
  const totalPending = totalSpent - totalPaid;
  const remaining = (budget?.total_budget || 0) - totalSpent;

  return {
    budget, expenses, loading,
    loadBudget, setBudgetAmount, addExpense, updateExpense, deleteExpense,
    totalSpent, totalPaid, totalPending, remaining,
  };
}
