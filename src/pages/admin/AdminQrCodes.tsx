import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import jsQR from "jsqr";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Printer, ScanLine, UserPlus, Unlink, Store, User, Camera, CameraOff } from "lucide-react";
import { QR_DESIGNS, getDesign, newQrCode, parseScanned, printQrCodes, qrUrl } from "@/lib/qr-posters";

type Qr = {
  id: string; code: string; design: string; batch_label: string | null; affiliate_id: string | null;
  assigned_at: string | null; scan_count: number; signup_count: number; site_count: number; last_scanned_at: string | null; created_at: string;
};
type Aff = {
  id: string; full_name: string; email: string; phone: string | null; referral_code: string;
  partner_type: string; shop_name: string | null; is_active: boolean; total_referrals: number; successful_referrals: number;
};

const affLabel = (a?: Aff) => (a ? (a.shop_name ? `${a.shop_name} (${a.full_name})` : a.full_name) : "");

export default function AdminQrCodes() {
  const [qrs, setQrs] = useState<Qr[]>([]);
  const [affs, setAffs] = useState<Aff[]>([]);
  const [count, setCount] = useState(12);
  const [design, setDesign] = useState("qr-only");
  const [batch, setBatch] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignOpen, setAssignOpen] = useState<string[] | null>(null);
  const [assignTo, setAssignTo] = useState("");
  const [affSearch, setAffSearch] = useState("");
  const [scanned, setScanned] = useState<Qr | null | "unknown">(null);

  const load = useCallback(async () => {
    const [q, a] = await Promise.all([
      supabase.from("affiliate_qr_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("affiliates").select("id,full_name,email,phone,referral_code,partner_type,shop_name,is_active,total_referrals,successful_referrals").order("full_name"),
    ]);
    if (q.error) toast({ title: "Couldn't load QR codes", description: q.error.message, variant: "destructive" });
    setQrs((q.data as Qr[]) ?? []);
    setAffs((a.data as Aff[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const affById = useMemo(() => new Map(affs.map((a) => [a.id, a])), [affs]);
  const stock = qrs.filter((q) => !q.affiliate_id);
  const assignedGroups = useMemo(() => {
    const m = new Map<string, Qr[]>();
    qrs.filter((q) => q.affiliate_id).forEach((q) => m.set(q.affiliate_id!, [...(m.get(q.affiliate_id!) ?? []), q]));
    return [...m.entries()];
  }, [qrs]);

  const generate = async () => {
    const n = Math.min(Math.max(1, count), 200);
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const rows = Array.from({ length: n }, () => ({ code: newQrCode(), design, batch_label: batch || null, created_by: u.user?.id }));
    const { error } = await supabase.from("affiliate_qr_codes").insert(rows);
    setBusy(false);
    if (error) return toast({ title: "Couldn't generate", description: error.message, variant: "destructive" });
    toast({ title: `${n} QR codes generated` });
    await load();
    if (!printQrCodes(rows.map((r) => ({ code: r.code, design })))) toast({ title: "Allow pop-ups to print" });
  };

  const doPrint = (list: Qr[]) => {
    if (!list.length) return;
    if (!printQrCodes(list.map((q) => ({ code: q.code, design: q.design, shop: affById.get(q.affiliate_id ?? "")?.shop_name ?? undefined }))))
      toast({ title: "Allow pop-ups to print" });
  };

  const assign = async () => {
    if (!assignOpen || !assignTo) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("affiliate_qr_codes")
      .update({ affiliate_id: assignTo, assigned_at: new Date().toISOString(), assigned_by: u.user?.id })
      .in("id", assignOpen);
    if (error) return toast({ title: "Couldn't assign", description: error.message, variant: "destructive" });
    toast({ title: `Assigned ${assignOpen.length} QR to ${affLabel(affById.get(assignTo))}` });
    setAssignOpen(null); setAssignTo(""); setSelected(new Set()); setScanned(null);
    load();
  };

  const unassign = async (id: string) => {
    const { error } = await supabase.from("affiliate_qr_codes").update({ affiliate_id: null, assigned_at: null, assigned_by: null }).eq("id", id);
    if (error) return toast({ title: "Couldn't unassign", description: error.message, variant: "destructive" });
    load();
  };

  const onScan = useCallback(async (text: string) => {
    const code = parseScanned(text);
    if (!code) return setScanned("unknown");
    const { data } = await supabase.from("affiliate_qr_codes").select("*").eq("code", code).maybeSingle();
    setScanned((data as Qr) ?? "unknown");
  }, []);

  const filteredAffs = affs.filter((a) => `${a.full_name} ${a.shop_name ?? ""} ${a.email} ${a.referral_code}`.toLowerCase().includes(affSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2"><QrCode className="h-6 w-6 text-primary" /> Affiliate QR codes</h1>
        <p className="text-sm text-muted-foreground">Pre-print QR codes or posters, then assign them to shops and individuals when you onboard them.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[["Total", qrs.length], ["In stock", stock.length], ["Assigned", qrs.length - stock.length], ["Total scans", qrs.reduce((s, q) => s + q.scan_count, 0)], ["Sign-ups", qrs.reduce((s, q) => s + (q.signup_count ?? 0), 0)], ["Sites created", qrs.reduce((s, q) => s + (q.site_count ?? 0), 0)]].map(([l, v]) => (
          <Card key={l as string}><CardContent className="p-4"><div className="text-xs text-muted-foreground">{l}</div><div className="text-2xl font-bold">{v}</div></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="generate">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="stock">Unassigned ({stock.length})</TabsTrigger>
          <TabsTrigger value="assigned">By merchant ({assignedGroups.length})</TabsTrigger>
          <TabsTrigger value="scan">Scan</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader><CardTitle className="text-lg">Generate new QR codes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <label className="text-sm space-y-1"><span>How many</span><Input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
                <label className="text-sm space-y-1 sm:col-span-2"><span>Batch label (optional)</span><Input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g. Kochi card shops – Oct" /></label>
              </div>
              <div>
                <div className="text-sm mb-2">Style</div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {QR_DESIGNS.map((d) => (
                    <button key={d.id} type="button" onClick={() => setDesign(d.id)}
                      className={`rounded-lg border-2 p-2 text-left transition ${design === d.id ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                      <DesignThumb id={d.id} />
                      <div className="text-xs font-medium mt-2">{d.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={generate} disabled={busy}><Printer className="h-4 w-4 mr-2" />Generate & print</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(selected.size === stock.length ? new Set() : new Set(stock.map((q) => q.id)))}>
                  {selected.size === stock.length && stock.length ? "Clear" : "Select all"}
                </Button>
                <Button size="sm" variant="outline" disabled={!selected.size} onClick={() => doPrint(stock.filter((q) => selected.has(q.id)))}><Printer className="h-4 w-4 mr-1" />Print ({selected.size})</Button>
                <Button size="sm" disabled={!selected.size} onClick={() => setAssignOpen([...selected])}><UserPlus className="h-4 w-4 mr-1" />Assign ({selected.size})</Button>
              </div>
              {!stock.length && <p className="text-sm text-muted-foreground py-6 text-center">No unassigned QR codes. Generate some first.</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {stock.map((q) => (
                  <div key={q.id} className={`rounded-lg border p-3 space-y-2 ${selected.has(q.id) ? "border-primary bg-primary/5" : ""}`}>
                    <label className="flex items-center gap-2 text-xs font-mono">
                      <Checkbox checked={selected.has(q.id)} onCheckedChange={(v) => { const s = new Set(selected); v ? s.add(q.id) : s.delete(q.id); setSelected(s); }} />
                      {q.code}
                    </label>
                    <div className="bg-card p-2 rounded flex justify-center"><QRCodeSVG value={qrUrl(q.code)} size={96} /></div>
                    <div className="flex flex-wrap gap-1"><Badge variant="secondary" className="text-[10px]">{getDesign(q.design).name}</Badge>{q.batch_label && <Badge variant="outline" className="text-[10px]">{q.batch_label}</Badge>}</div>
                    <Button size="sm" variant="ghost" className="w-full h-7" onClick={() => setAssignOpen([q.id])}>Assign</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned" className="space-y-3">
          {!assignedGroups.length && <p className="text-sm text-muted-foreground py-6 text-center">No QR codes assigned yet.</p>}
          {assignedGroups.map(([affId, list]) => {
            const a = affById.get(affId);
            return (
              <Card key={affId}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <MerchantInfo a={a} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => doPrint(list)}><Printer className="h-4 w-4 mr-1" />Print all</Button>
                      <Button size="sm" variant="outline" onClick={() => { setAssignTo(affId); setAssignOpen([]); }}><UserPlus className="h-4 w-4 mr-1" />Add QR</Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {list.map((q) => (
                      <div key={q.id} className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
                        <span className="font-mono">{q.code}</span><span className="text-muted-foreground">{q.scan_count} scans · {q.signup_count ?? 0} sign-ups · {q.site_count ?? 0} sites</span>
                        <button aria-label={`Unassign ${q.code}`} onClick={() => unassign(q.id)} className="text-muted-foreground hover:text-destructive"><Unlink className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="scan">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ScanLine className="h-5 w-5" />Scan a printed QR</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Scanner onResult={onScan} />
              <ManualEntry onSubmit={onScan} />
              {scanned === "unknown" && <p className="text-sm text-destructive">This isn't a Vowz affiliate QR code.</p>}
              {scanned && scanned !== "unknown" && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2"><span className="font-mono font-semibold">{scanned.code}</span><Badge variant={scanned.affiliate_id ? "default" : "secondary"}>{scanned.affiliate_id ? "Assigned" : "Not assigned"}</Badge><span className="text-xs text-muted-foreground">{scanned.scan_count} scans · {scanned.signup_count ?? 0} sign-ups · {scanned.site_count ?? 0} sites</span></div>
                  {scanned.affiliate_id ? (
                    <>
                      <MerchantInfo a={affById.get(scanned.affiliate_id)} full />
                      <div className="text-xs text-muted-foreground">Assigned {scanned.assigned_at ? new Date(scanned.assigned_at).toLocaleDateString() : ""} · Also holds {qrs.filter((q) => q.affiliate_id === scanned.affiliate_id).length} QR in total</div>
                    </>
                  ) : (
                    <Button onClick={() => setAssignOpen([scanned.id])}><UserPlus className="h-4 w-4 mr-2" />Assign to a merchant</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!assignOpen} onOpenChange={(o) => !o && setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign QR code{assignOpen && assignOpen.length !== 1 ? "s" : ""}</DialogTitle></DialogHeader>
          {assignOpen && assignOpen.length === 0 && (
            <div className="space-y-2">
              <div className="text-sm">Pick QR codes from stock:</div>
              <div className="max-h-40 overflow-auto flex flex-wrap gap-2">
                {stock.map((q) => (
                  <button key={q.id} onClick={() => setAssignOpen([q.id])} className="font-mono text-xs border rounded px-2 py-1 hover:border-primary">{q.code}</button>
                ))}
                {!stock.length && <span className="text-sm text-muted-foreground">No stock — generate first, or scan a printed one.</span>}
              </div>
            </div>
          )}
          {assignOpen && assignOpen.length > 0 && (
            <div className="space-y-3">
              <Input placeholder="Search merchant, email, code…" value={affSearch} onChange={(e) => setAffSearch(e.target.value)} />
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger><SelectValue placeholder="Choose merchant / individual" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {filteredAffs.map((a) => <SelectItem key={a.id} value={a.id}>{affLabel(a)} · {a.referral_code}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Merchant not listed? Ask them to sign up at vowz.me/affiliate/signup first, then refresh this page.</p>
              <Button className="w-full" disabled={!assignTo} onClick={assign}>Assign {assignOpen.length} QR</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MerchantInfo({ a, full }: { a?: Aff; full?: boolean }) {
  if (!a) return <span className="text-sm text-muted-foreground">Unknown merchant</span>;
  const Icon = a.partner_type === "shop" ? Store : User;
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
      <div className="text-sm">
        <div className="font-semibold">{affLabel(a)} {!a.is_active && <Badge variant="destructive" className="ml-1">Inactive</Badge>}</div>
        <div className="text-muted-foreground text-xs">{a.email}{a.phone ? ` · ${a.phone}` : ""} · code {a.referral_code}</div>
        {full && <div className="text-xs mt-1">{a.total_referrals} referrals · {a.successful_referrals} paid</div>}
      </div>
    </div>
  );
}

function DesignThumb({ id }: { id: string }) {
  const d = getDesign(id);
  if (id === "qr-only") return <div className="aspect-[3/4] rounded bg-card border flex items-center justify-center"><QrCode className="h-10 w-10" /></div>;
  return (
    <div className="aspect-[3/4] rounded flex flex-col items-center justify-center gap-1 p-1 border-2" style={{ background: d.bg, borderColor: d.accent }}>
      <div className="text-[7px] tracking-widest" style={{ color: d.accent }}>VOWZ.ME</div>
      <div className="bg-card p-1 rounded"><QrCode className="h-8 w-8" style={{ color: d.fg }} /></div>
    </div>
  );
}

function ManualEntry({ onSubmit }: { onSubmit: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (v) onSubmit(v); }}>
      <Input placeholder="Or type the code printed under the QR (e.g. VZ4K7P2Q)" value={v} onChange={(e) => setV(e.target.value)} />
      <Button type="submit" variant="outline">Look up</Button>
    </form>
  );
}

function Scanner({ onResult }: { onResult: (t: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!on) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let last = "";
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        const tick = () => {
          if (v.readyState === v.HAVE_ENOUGH_DATA && ctx) {
            canvas.width = v.videoWidth; canvas.height = v.videoHeight;
            ctx.drawImage(v, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const r = jsQR(img.data, img.width, img.height);
            if (r?.data && r.data !== last) { last = r.data; onResult(r.data); }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setErr("Camera not available. Allow camera access, or type the code below.");
        setOn(false);
      }
    })();
    return () => { cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [on, onResult]);

  return (
    <div className="space-y-2">
      <Button variant={on ? "outline" : "default"} onClick={() => { setErr(""); setOn(!on); }}>
        {on ? <><CameraOff className="h-4 w-4 mr-2" />Stop camera</> : <><Camera className="h-4 w-4 mr-2" />Start camera</>}
      </Button>
      {on && <video ref={videoRef} className="w-full max-w-sm rounded-lg border bg-muted" playsInline muted />}
      {err && <p className="text-sm text-destructive">{err}</p>}
    </div>
  );
}
