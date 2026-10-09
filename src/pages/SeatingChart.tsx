import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { csvCell, toCsv } from "@/lib/csv";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Users, Download, Loader2, X, Check } from "lucide-react";

type Shape = "round" | "long" | "sweetheart";

interface SeatTable {
  id: string;
  name: string;
  shape: Shape;
  seats: number;
  guests: string[];
}

interface ChartData {
  tables: SeatTable[];
}

const SHAPES: { id: Shape; label: string; seats: number }[] = [
  { id: "round", label: "Round table", seats: 8 },
  { id: "long", label: "Long table", seats: 12 },
  { id: "sweetheart", label: "Sweetheart", seats: 2 },
];

const newId = () => (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));

export default function SeatingChart() {
  const { siteId } = useParams<{ siteId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [tables, setTables] = useState<SeatTable[]>([]);
  const [allGuests, setAllGuests] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const firstLoad = useRef(true);

  useEffect(() => {
    if (!siteId) return;
    (async () => {
      const [{ data: chart }, { data: rsvps }] = await Promise.all([
        supabase.from("seating_charts" as any).select("data, is_public").eq("wedding_site_id", siteId).maybeSingle(),
        supabase.from("rsvps").select("guest_name, attending, guest_count").eq("wedding_site_id", siteId),
      ]);
      const parsed = ((chart as any)?.data as ChartData) || { tables: [] };
      setTables(Array.isArray(parsed.tables) ? parsed.tables : []);
      setIsPublic(Boolean((chart as any)?.is_public));
      const names: string[] = [];
      for (const r of (rsvps as any[]) || []) {
        if (r.attending === false) continue;
        const base = String(r.guest_name || "").trim();
        if (!base) continue;
        names.push(base);
        const extra = Math.max(0, Number(r.guest_count || 1) - 1);
        for (let i = 1; i <= extra; i++) names.push(`${base} +${i}`);
      }
      setAllGuests(Array.from(new Set(names)));
      setLoading(false);
    })();
  }, [siteId]);

  const seated = useMemo(() => new Set(tables.flatMap((t) => t.guests)), [tables]);
  const unseated = useMemo(
    () => allGuests.filter((g) => !seated.has(g) && g.toLowerCase().includes(search.toLowerCase())),
    [allGuests, seated, search],
  );

  const save = useCallback(
    async (nextTables: SeatTable[], nextPublic = isPublic) => {
      if (!siteId) return;
      setSaving(true);
      const { error } = await supabase
        .from("seating_charts" as any)
        .upsert({ wedding_site_id: siteId, data: { tables: nextTables } as any, is_public: nextPublic } as any, {
          onConflict: "wedding_site_id",
        });
      setSaving(false);
      if (error) toast({ title: "Could not save", description: error.message, variant: "destructive" });
    },
    [siteId, isPublic],
  );

  // Debounced autosave
  useEffect(() => {
    if (loading) return;
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    const t = setTimeout(() => void save(tables), 700);
    return () => clearTimeout(t);
  }, [tables, loading, save]);

  const addTable = (shape: Shape) => {
    const preset = SHAPES.find((s) => s.id === shape)!;
    setTables((prev) => [
      ...prev,
      { id: newId(), name: `Table ${prev.length + 1}`, shape, seats: preset.seats, guests: [] },
    ]);
  };

  const assign = (tableId: string, guest: string) => {
    setTables((prev) =>
      prev.map((t) => {
        const without = t.guests.filter((g) => g !== guest);
        if (t.id !== tableId) return { ...t, guests: without };
        if (without.length >= t.seats) {
          toast({ title: `${t.name} is full`, description: "Add more seats first." });
          return t;
        }
        return { ...t, guests: [...without, guest] };
      }),
    );
    setPicked(null);
  };

  const unassign = (guest: string) =>
    setTables((prev) => prev.map((t) => ({ ...t, guests: t.guests.filter((g) => g !== guest) })));

  const removeTable = (id: string) => setTables((prev) => prev.filter((t) => t.id !== id));
  const patchTable = (id: string, patch: Partial<SeatTable>) =>
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const exportCsv = () => {
    const rows = [["Table", "Shape", "Seat", "Guest"]];
    tables.forEach((t) => t.guests.forEach((g, i) => rows.push([t.name, t.shape, String(i + 1), g])));
    unseated.forEach((g) => rows.push(["Unseated", "", "", g]));
    const csv = toCsv(rows);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "seating-chart.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10">
            <Link to={`/dashboard`} aria-label="Back to dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-semibold truncate">Seating plan</h1>
            <p className="text-xs text-muted-foreground font-body">
              {seated.size} seated · {allGuests.length - seated.size} to place {saving ? "· saving…" : ""}
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-10" onClick={exportCsv}>
            <Download className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 space-y-6">
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <span className="font-body text-sm text-muted-foreground">Add:</span>
            {SHAPES.map((s) => (
              <Button key={s.id} size="sm" variant="outline" className="h-10" onClick={() => addTable(s.id)}>
                <Plus className="w-4 h-4 mr-1" /> {s.label}
              </Button>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <Switch
                checked={isPublic}
                onCheckedChange={(v) => { setIsPublic(v); void save(tables, v); }}
                aria-label="Let guests look up their seat"
              />
              <span className="font-body text-sm">Guests can find their seat</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[320px_1fr] gap-5">
          {/* Guest pool */}
          <Card className="lg:sticky lg:top-24 self-start">
            <CardContent className="p-4">
              <h2 className="font-display text-base font-semibold mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-gold" /> Guests to place
              </h2>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guests"
                className="h-11 mb-3"
              />
              {picked && (
                <p className="text-xs font-body text-gold mb-2">
                  “{picked}” selected — tap a table to seat them.
                </p>
              )}
              <div className="flex flex-wrap gap-2 max-h-[45vh] overflow-y-auto">
                {unseated.length === 0 && (
                  <p className="text-sm font-body text-muted-foreground">Everyone has a seat 🎉</p>
                )}
                {unseated.map((g) => (
                  <button
                    key={g}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", g)}
                    onClick={() => setPicked(picked === g ? null : g)}
                    className={`px-3 py-2 rounded-full border font-body text-sm min-h-10 transition-colors ${
                      picked === g ? "bg-gold text-background border-gold" : "bg-background border-border hover:border-gold/60"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tables */}
          <div className="grid sm:grid-cols-2 gap-4">
            {tables.length === 0 && (
              <Card className="sm:col-span-2">
                <CardContent className="p-8 text-center font-body text-muted-foreground">
                  No tables yet — add a round, long or sweetheart table to start.
                </CardContent>
              </Card>
            )}
            {tables.map((t) => (
              <Card
                key={t.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const g = e.dataTransfer.getData("text/plain"); if (g) assign(t.id, g); }}
                onClick={() => { if (picked) assign(t.id, picked); }}
                className={`transition-colors ${picked ? "border-gold/60 cursor-pointer" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {renaming === t.id ? (
                      <>
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-10"
                          autoFocus
                        />
                        <Button size="icon" className="h-10 w-10" onClick={(e) => { e.stopPropagation(); patchTable(t.id, { name: renameValue.slice(0, 40) || t.name }); setRenaming(null); }}>
                          <Check className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <button
                        className="font-display text-base font-semibold text-left flex-1 truncate"
                        onClick={(e) => { e.stopPropagation(); setRenaming(t.id); setRenameValue(t.name); }}
                      >
                        {t.name}
                      </button>
                    )}
                    <span className="font-body text-xs text-muted-foreground shrink-0">
                      {t.guests.length}/{t.seats}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeTable(t.id); }}
                      className="p-2 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${t.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-body text-xs text-muted-foreground">Seats</span>
                    <Button size="icon" variant="outline" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); patchTable(t.id, { seats: Math.max(t.guests.length, t.seats - 1) }); }}>−</Button>
                    <span className="font-body text-sm w-6 text-center">{t.seats}</span>
                    <Button size="icon" variant="outline" className="h-9 w-9" onClick={(e) => { e.stopPropagation(); patchTable(t.id, { seats: Math.min(30, t.seats + 1) }); }}>+</Button>
                  </div>

                  <div
                    className={`rounded-xl border border-dashed border-border/70 p-3 min-h-20 flex flex-wrap gap-2 ${
                      t.shape === "round" ? "rounded-full sm:rounded-3xl" : ""
                    }`}
                  >
                    {t.guests.length === 0 && (
                      <span className="font-body text-xs text-muted-foreground">Drop guests here (or tap a name then this table)</span>
                    )}
                    {t.guests.map((g) => (
                      <span key={g} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/30 font-body text-sm">
                        {g}
                        <button onClick={(e) => { e.stopPropagation(); unassign(g); }} aria-label={`Remove ${g}`} className="p-0.5">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
