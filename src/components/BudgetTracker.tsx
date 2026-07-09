import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee, Plus, Trash2, Check, X, Edit3,
  TrendingUp, TrendingDown, Wallet, PiggyBank, AlertCircle,
  ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWeddingBudget, EXPENSE_CATEGORIES, Expense } from "@/hooks/use-wedding-budget";
import { format } from "date-fns";

interface BudgetTrackerProps {
  siteId: string;
}

const BudgetTracker = ({ siteId }: BudgetTrackerProps) => {
  const {
    budget, expenses, loading,
    loadBudget, setBudgetAmount, addExpense, updateExpense, deleteExpense,
    totalSpent, totalPaid, totalPending, remaining,
  } = useWeddingBudget();

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    title: "", amount: "", category: "venue", vendor_name: "", notes: "", due_date: "",
  });

  useEffect(() => {
    loadBudget(siteId);
  }, [siteId, loadBudget]);

  const handleSetBudget = () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) return;
    setBudgetAmount(siteId, amount);
    setEditingBudget(false);
  };

  const handleAddExpense = async () => {
    if (!newExpense.title.trim() || !newExpense.amount) return;
    const { error } = await addExpense(siteId, {
      title: newExpense.title.trim(),
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      vendor_name: newExpense.vendor_name.trim() || null,
      notes: newExpense.notes.trim() || null,
      due_date: newExpense.due_date || null,
    });
    if (!error) {
      setNewExpense({ title: "", amount: "", category: "venue", vendor_name: "", notes: "", due_date: "" });
      setShowAddForm(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const spentPercentage = budget?.total_budget ? Math.min((totalSpent / budget.total_budget) * 100, 100) : 0;
  const isOverBudget = remaining < 0;

  // Group expenses by category
  const groupedExpenses = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    expenses: expenses.filter(e => e.category === cat.value),
    total: expenses.filter(e => e.category === cat.value).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(g => g.expenses.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Budget Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Budget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-xl p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4 text-gold" />
            <span className="font-body text-xs text-muted-foreground">Total Budget</span>
          </div>
          {editingBudget ? (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g. 1500000"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                className="h-8 text-sm font-body"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleSetBudget()}
                aria-label="Total wedding budget"
              />
              <Button size="sm" variant="ghost" onClick={handleSetBudget} className="h-8 w-8 p-0" aria-label="Save budget">
                <Check className="w-4 h-4 text-green-500" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingBudget(false)} className="h-8 w-8 p-0" aria-label="Cancel budget edit">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="font-display text-xl sm:text-2xl font-bold text-foreground cursor-pointer hover:text-gold transition-colors text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              onClick={() => {
                setBudgetInput(String(budget?.total_budget || ""));
                setEditingBudget(true);
              }}
              aria-label={budget ? `Edit total budget, currently ${formatCurrency(budget.total_budget)}` : "Set total budget"}
            >
              {budget ? formatCurrency(budget.total_budget) : (
                <span className="text-sm text-gold font-body font-normal">
                  + Set Budget
                </span>
              )}
            </button>
          )}
        </motion.div>

        {/* Spent */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border/50 rounded-xl p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-destructive" />
            <span className="font-body text-xs text-muted-foreground">Total Spent</span>
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{formatCurrency(totalSpent)}</p>
        </motion.div>

        {/* Paid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border/50 rounded-xl p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-green-500" />
            <span className="font-body text-xs text-muted-foreground">Paid</span>
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-green-500">{formatCurrency(totalPaid)}</p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Pending: {formatCurrency(totalPending)}
          </p>
        </motion.div>

        {/* Remaining */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={`bg-card border rounded-xl p-4 sm:p-5 ${isOverBudget ? "border-destructive/50" : "border-border/50"}`}
        >
          <div className="flex items-center gap-2 mb-2">
            {isOverBudget ? <AlertCircle className="w-4 h-4 text-destructive" /> : <TrendingDown className="w-4 h-4 text-gold" />}
            <span className="font-body text-xs text-muted-foreground">Remaining</span>
          </div>
          <p className={`font-display text-xl sm:text-2xl font-bold ${isOverBudget ? "text-destructive" : "text-foreground"}`}>
            {formatCurrency(Math.abs(remaining))}
          </p>
          {isOverBudget && <p className="font-body text-xs text-destructive mt-1">Over budget!</p>}
        </motion.div>
      </div>

      {/* Progress Bar */}
      {budget && budget.total_budget > 0 && (
        <div className="bg-card border border-border/50 rounded-xl p-4 sm:p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="font-body text-sm text-muted-foreground">Budget Used</span>
            <span className="font-body text-sm font-semibold text-foreground">{spentPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spentPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${isOverBudget ? "bg-destructive" : spentPercentage > 80 ? "bg-amber-500" : "bg-gold"}`}
            />
          </div>
        </div>
      )}

      {/* Add Expense Button & Form */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-foreground">Expenses</h3>
        <Button
          variant={showAddForm ? "outline" : "gold"}
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {showAddForm ? "Cancel" : "Add Expense"}
        </Button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border/50 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bt-expense-title" className="font-body text-xs font-medium text-muted-foreground mb-1 block">Expense Title *</label>
                  <Input
                    id="bt-expense-title"
                    placeholder="e.g. Venue booking advance"
                    value={newExpense.title}
                    onChange={e => setNewExpense(p => ({ ...p, title: e.target.value }))}
                    className="font-body"
                  />
                </div>
                <div>
                  <label htmlFor="bt-expense-amount" className="font-body text-xs font-medium text-muted-foreground mb-1 block">Amount (₹) *</label>
                  <Input
                    id="bt-expense-amount"
                    type="number"
                    placeholder="e.g. 50000"
                    value={newExpense.amount}
                    onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))}
                    className="font-body"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="bt-expense-category" className="font-body text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                  <select
                    id="bt-expense-category"
                    value={newExpense.category}
                    onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm font-body"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="bt-expense-vendor" className="font-body text-xs font-medium text-muted-foreground mb-1 block">Vendor</label>
                  <Input
                    id="bt-expense-vendor"
                    placeholder="e.g. Taj Palace"
                    value={newExpense.vendor_name}
                    onChange={e => setNewExpense(p => ({ ...p, vendor_name: e.target.value }))}
                    className="font-body"
                  />
                </div>
                <div>
                  <label htmlFor="bt-expense-due" className="font-body text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
                  <Input
                    id="bt-expense-due"
                    type="date"
                    value={newExpense.due_date}
                    onChange={e => setNewExpense(p => ({ ...p, due_date: e.target.value }))}
                    className="font-body"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bt-expense-notes" className="font-body text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <Textarea
                  id="bt-expense-notes"
                  placeholder="Any additional details..."
                  value={newExpense.notes}
                  onChange={e => setNewExpense(p => ({ ...p, notes: e.target.value }))}
                  className="font-body min-h-[60px]"
                />
              </div>
              <Button variant="gold" onClick={handleAddExpense} disabled={!newExpense.title.trim() || !newExpense.amount}>
                <Plus className="w-4 h-4 mr-1" /> Add Expense
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense List by Category */}
      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border/50 rounded-xl">
          <IndianRupee className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-body text-muted-foreground">No expenses yet</p>
          <p className="font-body text-xs text-muted-foreground mt-1">Start tracking your wedding expenses</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedExpenses.map(group => (
            <div key={group.value} className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedCategory(expandedCategory === group.value ? null : group.value)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{group.icon}</span>
                  <div className="text-left">
                    <p className="font-body text-sm font-semibold text-foreground">{group.label}</p>
                    <p className="font-body text-xs text-muted-foreground">{group.expenses.length} item{group.expenses.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-bold text-foreground">{formatCurrency(group.total)}</span>
                  {expandedCategory === group.value ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              <AnimatePresence>
                {expandedCategory === group.value && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/30 divide-y divide-border/20">
                      {group.expenses.map(expense => (
                        <ExpenseRow
                          key={expense.id}
                          expense={expense}
                          formatCurrency={formatCurrency}
                          onTogglePaid={() => updateExpense(expense.id, { paid: !expense.paid })}
                          onDelete={() => deleteExpense(expense.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function ExpenseRow({ expense, formatCurrency, onTogglePaid, onDelete }: {
  expense: Expense;
  formatCurrency: (n: number) => string;
  onTogglePaid: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
      <button
        onClick={onTogglePaid}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          expense.paid ? "bg-green-500 border-green-500 text-white" : "border-border hover:border-gold"
        }`}
        aria-label={expense.paid ? `Mark ${expense.title} as unpaid` : `Mark ${expense.title} as paid`}
        aria-pressed={expense.paid}
      >
        {expense.paid && <Check className="w-3.5 h-3.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-body text-sm ${expense.paid ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {expense.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {expense.vendor_name && (
            <span className="font-body text-xs text-muted-foreground">{expense.vendor_name}</span>
          )}
          {expense.due_date && (
            <span className="font-body text-xs text-muted-foreground">
              Due: {format(new Date(expense.due_date), "dd MMM yyyy")}
            </span>
          )}
        </div>
      </div>
      <span className={`font-display text-sm font-bold flex-shrink-0 ${expense.paid ? "text-green-500" : "text-foreground"}`}>
        {formatCurrency(Number(expense.amount))}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
        aria-label={`Delete expense ${expense.title}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default BudgetTracker;
