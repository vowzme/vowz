import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Printer, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getPlatformVisitorId, trackPlatformEvent } from "@/lib/platform-analytics";
import { DEFAULT_RITUAL_SETS, getRitual, type RitualFaith } from "@/lib/rituals";

type Q = {
  id: string;
  question: string;
  help?: string;
  type: "single" | "multi" | "number" | "text" | "date";
  options?: string[];
  placeholder?: string;
};

const QUESTIONS: Q[] = [
  { id: "date", question: "When is the wedding?", type: "date", help: "An approximate date is fine." },
  { id: "city", question: "Which city or town?", type: "text", placeholder: "Udaipur" },
  { id: "tradition", question: "What kind of wedding is it?", type: "single", options: ["Hindu", "Muslim · Nikah", "Sikh · Anand Karaj", "Christian", "Inter-faith / fusion", "Civil / registry"] },
  { id: "guests", question: "Roughly how many guests?", type: "number", placeholder: "300" },
  { id: "budget", question: "What is your total budget in ₹?", type: "number", placeholder: "1500000", help: "A rough figure is enough — we only use it to size the split." },
  { id: "functions", question: "Which functions are you planning?", type: "multi", options: ["Roka / Engagement", "Haldi", "Mehendi", "Sangeet", "Wedding ceremony", "Reception", "Walima", "Next-day brunch"] },
  { id: "booked", question: "What have you already booked?", type: "multi", options: ["Venue", "Caterer", "Photographer", "Decorator", "Makeup artist", "DJ / Band", "Priest / officiant", "Outfits", "Nothing yet"] },
  
  { id: "worry", question: "What worries you most right now?", type: "multi", options: ["Going over budget", "Guest list & RSVPs", "Finding good vendors", "Family expectations", "Outstation guests", "Running out of time", "Nothing — we're calm"] },
];

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

function buildReport(a: Record<string, any>) {
  const guests = Number(a.guests) || 250;
  const budget = Number(a.budget) || 1200000;
  const booked: string[] = Array.isArray(a.booked) ? a.booked : [];
  const functions: string[] = Array.isArray(a.functions) ? a.functions : [];
  const worries: string[] = Array.isArray(a.worry) ? a.worry : [];
  const date = a.date ? new Date(a.date) : null;
  const daysLeft = date ? Math.max(0, Math.round((date.getTime() - Date.now()) / 864e5)) : null;

  // ── Readiness score ────────────────────────────────────────────────
  let score = 30;
  const realBooked = booked.filter((b) => b !== "Nothing yet");
  score += Math.min(35, realBooked.length * 6);
  if (a.date) score += 8;
  if (a.city) score += 4;
  if (a.invites === "A wedding website") score += 8;
  else if (a.invites === "Not decided yet") score -= 5;
  if (daysLeft !== null) {
    if (daysLeft > 180) score += 10;
    else if (daysLeft > 90) score += 5;
    else if (daysLeft < 30 && realBooked.length < 4) score -= 12;
  }
  score = Math.max(12, Math.min(97, score));

  // ── Budget split ───────────────────────────────────────────────────
  const perGuestHeavy = guests > 400;
  const split: [string, number][] = [
    ["Venue & stay", perGuestHeavy ? 0.18 : 0.2],
    ["Catering", perGuestHeavy ? 0.32 : 0.28],
    ["Decor & flowers", 0.13],
    ["Photography & video", 0.11],
    ["Outfits & jewellery", 0.1],
    ["Music & entertainment", 0.05],
    ["Makeup & grooming", 0.04],
    ["Invitations & wedding website", 0.02],
    ["Transport & logistics", 0.03],
    ["Buffer — do not touch", 0.04],
  ];
  const perGuest = budget / Math.max(1, guests);

  // ── Timeline ───────────────────────────────────────────────────────
  const timeline: { when: string; tasks: string[] }[] = [];
  const add = (when: string, tasks: string[]) => timeline.push({ when, tasks });
  if (daysLeft === null || daysLeft > 240) {
    add("8+ months out", ["Fix the date with the priest or officiant", "Lock the budget and who is contributing", "Shortlist and visit venues", "Draft the guest list — it decides everything else"]);
  }
  if (daysLeft === null || daysLeft > 150) {
    add("6 months out", ["Book venue, caterer and photographer — the three that sell out first", "Book outstation hotel rooms", "Start outfit shopping and first fittings", "Put up your wedding website and start collecting RSVPs"]);
  }
  if (daysLeft === null || daysLeft > 90) {
    add("3–4 months out", ["Book decorator, makeup artist and DJ", "Send save-the-dates", "Menu tasting with the caterer", "Plan the sangeet performances"]);
  }
  if (daysLeft === null || daysLeft > 45) {
    add("6–8 weeks out", ["Send formal invitations with your website link", "Confirm the guest count band with the caterer", "Makeup and outfit trials", "Book guest transport"]);
  }
  add("3 weeks out", ["Chase RSVPs — expect only 60% to respond without a reminder", "Final headcount to the caterer", "Print schedules and vendor contact lists", "Withdraw tip money in labelled envelopes"]);
  add("Final week", ["Re-confirm every vendor's arrival time in writing", "Full sangeet run-through with the DJ's final audio file", "Pack a bag per function", "Sleep — genuinely the highest-return task on this list"]);

  // ── Gaps ───────────────────────────────────────────────────────────
  const gaps: string[] = [];
  const critical = ["Venue", "Caterer", "Photographer"];
  critical.forEach((c) => {
    if (!booked.includes(c)) {
      gaps.push(
        daysLeft !== null && daysLeft < 120
          ? `${c} is not booked and you have about ${daysLeft} days. This is urgent — good ones are gone 4–6 months ahead.`
          : `${c} is not booked yet. Book this before anything decorative.`,
      );
    }
  });
  if (!booked.includes("Makeup artist") && (functions.includes("Mehendi") || functions.includes("Sangeet"))) {
    gaps.push("You have multiple functions but no makeup artist booked — a good artist is booked for all days at once, not per function.");
  }
  if (a.invites !== "A wedding website") {
    gaps.push("You have no single link for your guests. Timings change, and without one link every change becomes hundreds of WhatsApp messages.");
  }
  if (guests > 400 && budget / guests < 3000) {
    gaps.push(`At ${guests} guests your budget works out to ${inr(perGuest)} per guest, which is tight for a full-service wedding. Either trim the list or plan a simpler menu.`);
  }
  if (worries.includes("Going over budget")) {
    gaps.push("Add roughly 15–20% for GST, overtime, extra plates and tips — none of it appears in vendor quotes.");
  }
  if (!gaps.length) gaps.push("Nothing critical is missing. Focus now on RSVPs, the final-week plan, and keeping 5% of the budget untouched.");

  // ── Venue ideas ────────────────────────────────────────────────────
  const venueIdeas =
    guests > 500
      ? ["Convention centre or banquet hall with two serving lines", "Large farmhouse or resort lawn with a covered backup", "Community hall attached to a temple, gurdwara or church", "Hotel ballroom with an adjoining lawn for the baraat"]
      : guests > 200
        ? ["Boutique resort with rooms for outstation guests", "Heritage haveli or palace courtyard", "Farmhouse lawn with a marquee", "Four-star hotel banquet with valet parking"]
        : ["Intimate heritage homestay", "Beach or backwater resort for a destination wedding", "Rooftop venue with a city view", "Garden restaurant taken over for the evening"];

  // ── Rituals your guests will need explained ────────────────────────
  const faithMap: Record<string, RitualFaith> = {
    "Hindu": "hindu",
    "Muslim · Nikah": "muslim",
    "Sikh · Anand Karaj": "sikh",
    "Christian": "christian",
  };
  const faith: RitualFaith = faithMap[a.tradition as string] || "common";
  const ritualIds = DEFAULT_RITUAL_SETS[faith] || DEFAULT_RITUAL_SETS.common;
  const rituals = ritualIds
    .map((id) => getRitual(id))
    .filter(Boolean)
    .slice(0, 6) as NonNullable<ReturnType<typeof getRitual>>[];

  return { score, split, perGuest, budget, guests, timeline, gaps, venueIdeas, daysLeft, rituals, faith };
}

const WeddingReport = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [coupleName, setCoupleName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = QUESTIONS.length;
  const q = QUESTIONS[step];
  const report = useMemo(() => (done ? buildReport(answers) : null), [done, answers]);

  const set = (v: any) => setAnswers((p) => ({ ...p, [q.id]: v }));
  const toggle = (v: string) =>
    setAnswers((p) => {
      const cur: string[] = Array.isArray(p[q.id]) ? p[q.id] : [];
      return { ...p, [q.id]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else {
      setDone(true);
      trackPlatformEvent("cta_click", { path: "/wedding-report", meta: { action: "report_generated" } });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const saveLead = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: lead, error } = await supabase.from("wedding_report_leads").insert({
        user_id: userData?.user?.id ?? null,
        visitor_id: getPlatformVisitorId(),
        couple_name: coupleName || null,
        email: email.trim().toLowerCase(),
        wedding_date: answers.date || null,
        city: answers.city || null,
        guest_count: Number(answers.guests) || null,
        budget: Number(answers.budget) || null,
        currency: "INR",
        answers,
        report: report as any,
        score: report?.score ?? null,
        weekly_optin: weeklyOptin,
      }).select("id").single();
      if (error) throw error;
      setSaved(true);

      const { data: sendResult, error: sendError } = await supabase.functions.invoke("send-wedding-report", {
        body: { leadId: lead.id },
      });
      if (sendError || (sendResult && sendResult.sent === false)) {
        toast.success("Report ready below — we couldn't email it just now.");
      } else {
        toast.success(`Sent. Your report is on its way to ${email.trim()}.`);
      }

    } catch {
      toast.error("Could not save right now — you can still print the report below.");
    } finally {
      setSaving(false);
    }
  };

  const answered = (() => {
    const v = answers[q?.id];
    return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "";
  })();

  return (
    <>
      <SEOHead
        title="Free Wedding Report — Budget Split, Timeline & Readiness Score | Vowz"
        description="Answer 10 short questions and get a free personalised wedding report: your budget split, month-by-month timeline, readiness score, venue ideas and the gaps to fix. No sign-up needed."
        canonical="https://vowz.me/wedding-report"
        ogUrl="https://vowz.me/wedding-report"
        ogTitle="Free Wedding Report — know your wedding before it begins"
        ogDescription="Budget split, timeline, readiness score and venue ideas in under 8 minutes. Free, no sign-up."
      />

      <div className="min-h-screen bg-background">
        <div className="print:hidden">
          <Navbar />
        </div>

        {!done ? (
          <div className="mx-auto max-w-2xl px-4 pt-24 pb-14 sm:pt-28">
            <div className="text-center mb-8">
              <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-2">Free · No sign-up</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
                Know your wedding <span className="text-gradient-gold italic">before it begins</span>
              </h1>
              <p className="font-body text-muted-foreground">
                Ten short questions. You'll walk away with your budget split, a timeline, a readiness score and the gaps worth fixing this week.
              </p>
            </div>

            <div className="mb-6">
              <Progress value={((step + 1) / total) * 100} className="h-2" />
              <p className="mt-2 font-body text-xs text-muted-foreground">Question {step + 1} of {total}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-card"
              >
                <h2 className="font-display text-xl font-semibold text-foreground mb-1">{q.question}</h2>
                {q.help && <p className="font-body text-sm text-muted-foreground mb-4">{q.help}</p>}

                <div className="mt-4">
                  {q.type === "single" && (
                    <div className="grid gap-2">
                      {q.options!.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => { set(o); setTimeout(next, 180); }}
                          className={`rounded-xl border px-4 py-3 text-left font-body text-sm transition-colors ${
                            answers[q.id] === o ? "border-accent bg-accent/10 text-foreground" : "border-border/60 hover:border-accent/60"
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.type === "multi" && (
                    <div className="flex flex-wrap gap-2">
                      {q.options!.map((o) => {
                        const active = Array.isArray(answers[q.id]) && answers[q.id].includes(o);
                        return (
                          <button
                            key={o}
                            type="button"
                            onClick={() => toggle(o)}
                            aria-pressed={active}
                            className={`rounded-full border px-3.5 py-2 font-body text-sm transition-colors ${
                              active ? "border-accent bg-accent text-accent-foreground" : "border-border/60 text-muted-foreground hover:border-accent/60"
                            }`}
                          >
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {(q.type === "number" || q.type === "text" || q.type === "date") && (
                    <Input
                      type={q.type}
                      autoFocus
                      placeholder={q.placeholder}
                      value={answers[q.id] ?? ""}
                      onChange={(e) => set(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && answered) next(); }}
                    />
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                  </Button>
                  <Button className="rounded-full" onClick={next} disabled={!answered}>
                    {step === total - 1 ? "See my report" : "Next"} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>

            <p className="mt-6 text-center font-body text-xs text-muted-foreground">
              Nothing is saved unless you choose to email yourself the report at the end.
            </p>
          </div>
        ) : (
          report && (
            <div className="mx-auto max-w-3xl px-4 pt-24 pb-14 sm:pt-28">
              <div className="print:hidden mb-6 flex items-center justify-between">
                <button onClick={() => { setDone(false); setStep(0); }} className="inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Change my answers
                </button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
                </Button>
              </div>

              {/* Score */}
              <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-card text-center">
                <p className="font-body text-sm text-muted-foreground uppercase tracking-wider">Your wedding readiness score</p>
                <p className="font-display text-6xl font-bold text-gradient-gold my-2">{report.score}</p>
                <p className="font-body text-muted-foreground">
                  {report.score >= 75
                    ? "You are in great shape. Focus on RSVPs and the final week."
                    : report.score >= 50
                      ? "Solid progress. A few important bookings still decide the rest."
                      : "Early days — the next three decisions matter more than everything after them."}
                  {report.daysLeft !== null && ` About ${report.daysLeft} days to go.`}
                </p>
              </div>

              {/* Gaps */}
              <section className="mt-8 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                <h2 className="font-display text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-accent" /> What needs your attention
                </h2>
                <ul className="space-y-2">
                  {report.gaps.map((g, i) => (
                    <li key={i} className="font-body text-sm text-foreground/90 flex gap-2">
                      <span className="text-accent" aria-hidden="true">•</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Budget */}
              <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                <h2 className="font-display text-xl font-bold text-foreground mb-1">Your budget split</h2>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  {inr(report.budget)} across {report.guests} guests — about {inr(report.perGuest)} per guest.
                </p>
                <div className="space-y-2">
                  {report.split.map(([label, pct]) => (
                    <div key={label}>
                      <div className="flex justify-between font-body text-sm">
                        <span className="text-foreground/90">{label}</span>
                        <span className="text-muted-foreground">{inr(report.budget * pct)} · {Math.round(pct * 100)}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-accent" style={{ width: `${pct * 100 * 3}%`, maxWidth: "100%" }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-lg bg-muted px-3 py-2 font-body text-xs text-muted-foreground">
                  Add 15–20% on top for GST, overtime, extra plates and tips. Our{" "}
                  <Link to="/tools/hidden-wedding-cost-check" className="text-accent underline">hidden cost check</Link> works out your exact figure.
                </p>
              </section>

              {/* Timeline */}
              <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                <h2 className="font-display text-xl font-bold text-foreground mb-4">Your timeline</h2>
                <div className="space-y-5">
                  {report.timeline.map((t) => (
                    <div key={t.when} className="border-l-2 border-accent/40 pl-4">
                      <p className="font-display text-sm font-semibold text-foreground">{t.when}</p>
                      <ul className="mt-1.5 space-y-1">
                        {t.tasks.map((task, i) => (
                          <li key={i} className="font-body text-sm text-muted-foreground">{task}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* Venues */}
              <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                <h2 className="font-display text-xl font-bold text-foreground mb-3">Venue types that fit your size</h2>
                <ul className="space-y-2">
                  {report.venueIdeas.map((v, i) => (
                    <li key={i} className="font-body text-sm text-foreground/90 flex gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-accent mt-0.5" /> <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Rituals */}
              {report.rituals.length > 0 && (
                <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
                  <h2 className="font-display text-xl font-bold text-foreground mb-1">Ceremonies your guests will ask about</h2>
                  <p className="font-body text-sm text-muted-foreground mb-3">
                    Put a short explanation of each on your wedding website so outstation and first-time guests know what happens and what to wear.
                  </p>
                  <ul className="space-y-2">
                    {report.rituals.map((r) => (
                      <li key={r.id} className="font-body text-sm text-foreground/90">
                        <strong>{r.emoji} {r.name}</strong> — {r.short} <span className="text-muted-foreground">({r.dress})</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Email capture */}
              <section className="print:hidden mt-8 rounded-2xl border border-accent/40 bg-accent/5 p-6">
                {saved ? (
                  <p className="font-body text-center text-sm text-foreground">
                    Saved. Your report is on its way to <strong>{email}</strong>.
                  </p>
                ) : (
                  <>
                    <h2 className="font-display text-lg font-bold text-foreground mb-1">Email this report to yourself</h2>
                    <p className="font-body text-sm text-muted-foreground mb-4">
                      So you can share it with family instead of re-answering the questions later.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label className="font-body text-xs">Couple's names</Label>
                        <Input className="mt-1" placeholder="Aarav & Priya" value={coupleName} onChange={(e) => setCoupleName(e.target.value)} />
                      </div>
                      <div>
                        <Label className="font-body text-xs">Email</Label>
                        <Input className="mt-1" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>
                    <Button className="mt-4 rounded-full" onClick={saveLead} disabled={saving}>
                      {saving ? "Saving…" : "Email me my report"}
                    </Button>
                  </>
                )}
              </section>

              <div className="print:hidden mt-8 rounded-2xl border border-border/60 bg-card p-6 text-center shadow-card">
                <Sparkles className="mx-auto mb-3 h-6 w-6 text-accent" />
                <h2 className="font-display text-xl font-bold text-foreground mb-2">Ready for the next step?</h2>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  Turn this plan into a wedding website your guests will actually use — events, RSVP, ceremonies explained, photo album, all on one link.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button asChild className="rounded-full"><Link to="/templates">See the templates</Link></Button>
                  <Button asChild variant="outline" className="rounded-full"><Link to="/tools">More free tools</Link></Button>
                </div>
              </div>
            </div>
          )
        )}

        <div className="print:hidden">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default WeddingReport;
