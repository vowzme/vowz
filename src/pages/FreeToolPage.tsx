import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Printer, RotateCcw, Copy, Check, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getFreeTool, FREE_TOOLS, type ToolResult } from "@/lib/free-tools";
import { RITUALS } from "@/lib/rituals";
import { trackPlatformEvent } from "@/lib/platform-analytics";

const FAITH_KEY: Record<string, string> = {
  Hindu: "hindu",
  "Muslim · Nikah": "muslim",
  "Sikh · Anand Karaj": "sikh",
  Christian: "christian",
};

const FreeToolPage = () => {
  const { slug = "" } = useParams();
  const tool = getFreeTool(slug);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<ToolResult | null>(null);
  const [copied, setCopied] = useState(false);

  const related = useMemo(() => FREE_TOOLS.filter((t) => t.slug !== slug).slice(0, 3), [slug]);

  if (!tool) return <Navigate to="/tools" replace />;

  const set = (id: string, value: any) => setAnswers((p) => ({ ...p, [id]: value }));
  const toggle = (id: string, value: string) =>
    setAnswers((p) => {
      const cur: string[] = Array.isArray(p[id]) ? p[id] : [];
      return { ...p, [id]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });

  // The ritual explainer's ceremony list depends on the tradition chosen above it.
  const optionsFor = (fieldId: string, fallback: string[] = []) => {
    if (tool.slug === "wedding-ritual-explainer" && fieldId === "rituals") {
      const key = FAITH_KEY[answers.faith] || "hindu";
      return RITUALS.filter((r) => r.faith === key || r.faith === "common").map((r) => r.name);
    }
    return fallback;
  };

  const missing = tool.fields.filter((f) => {
    if (!f.required) return false;
    const v = answers[f.id];
    return Array.isArray(v) ? v.length === 0 : !v;
  });

  const handleGenerate = () => {
    if (missing.length) {
      toast.error(`Please fill in: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    const r = tool.compute(answers);
    setResult(r);
    trackPlatformEvent("cta_click", { path: `/tools/${tool.slug}`, meta: { action: "tool_completed", tool: tool.slug } });
    setTimeout(() => document.getElementById("tool-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const asPlainText = (r: ToolResult) =>
    [
      r.headline,
      r.summary,
      "",
      ...r.blocks.flatMap((b) => [b.heading, b.text || "", ...(b.items || []).map((i) => "• " + i), b.note ? `Note: ${b.note}` : "", ""]),
      "Made with the free tools at vowz.me/tools",
    ]
      .filter((l) => l !== "")
      .join("\n");

  const copyAll = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(asPlainText(result));
      setCopied(true);
      toast.success("Copied — paste it into WhatsApp or an email");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Please select the text and copy manually.");
    }
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is the ${tool.name} free?`,
        acceptedAnswer: { "@type": "Answer", text: "Yes. It is completely free, needs no account and nothing you type is saved or sent anywhere." },
      },
      {
        "@type": "Question",
        name: "Can I print or share the result?",
        acceptedAnswer: { "@type": "Answer", text: "Yes. Every result has a print button and a copy button so you can print it, save it as a PDF, or paste it into WhatsApp." },
      },
    ],
  };

  return (
    <>
      <SEOHead
        title={tool.seoTitle}
        description={tool.seoDescription}
        canonical={`https://vowz.me/tools/${tool.slug}`}
        ogUrl={`https://vowz.me/tools/${tool.slug}`}
        ogTitle={tool.name}
        ogDescription={tool.tagline}
      >
        <meta name="keywords" content={tool.keywords.join(", ")} />
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </SEOHead>

      <div className="min-h-screen bg-background">
        <div className="print:hidden">
          <Navbar />
        </div>

        <div className="mx-auto max-w-3xl px-4 pt-24 pb-12 sm:pt-28">
          <Link to="/tools" className="print:hidden mb-6 inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All free tools
          </Link>

          <header className="mb-8">
            <div className="mb-3 text-4xl" aria-hidden="true">{tool.emoji}</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">{tool.name}</h1>
            <p className="font-body text-muted-foreground">{tool.description}</p>
            <p className="print:hidden mt-3 font-body text-xs text-muted-foreground">
              Free · no sign-up · about {tool.minutes} minutes · nothing is saved
            </p>
          </header>

          {/* Form */}
          <div className="print:hidden rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-card">
            <div className="space-y-6">
              {tool.fields.map((f) => {
                const opts = optionsFor(f.id, f.options || []);
                return (
                  <div key={f.id}>
                    <Label className="font-body text-sm font-semibold text-foreground">
                      {f.label} {f.required && <span className="text-accent">*</span>}
                    </Label>
                    {f.help && <p className="font-body text-xs text-muted-foreground mt-0.5">{f.help}</p>}

                    {(f.type === "text" || f.type === "number" || f.type === "date") && (
                      <Input
                        type={f.type}
                        className="mt-2"
                        placeholder={f.placeholder}
                        value={answers[f.id] ?? ""}
                        onChange={(e) => set(f.id, e.target.value)}
                      />
                    )}

                    {f.type === "select" && (
                      <Select value={answers[f.id] ?? ""} onValueChange={(v) => set(f.id, v)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Choose one" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {opts.map((o) => (
                            <SelectItem key={o} value={o}>{o}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {f.type === "multiselect" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {opts.length === 0 && <p className="font-body text-xs text-muted-foreground">Choose a tradition above first.</p>}
                        {opts.map((o) => {
                          const active = Array.isArray(answers[f.id]) && answers[f.id].includes(o);
                          return (
                            <button
                              key={o}
                              type="button"
                              onClick={() => toggle(f.id, o)}
                              aria-pressed={active}
                              className={`rounded-full border px-3 py-1.5 font-body text-sm transition-colors ${
                                active
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-border/60 bg-background text-muted-foreground hover:border-accent/60"
                              }`}
                            >
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full" onClick={handleGenerate}>
                Get my {tool.output.toLowerCase()}
              </Button>
              {result && (
                <Button variant="outline" size="lg" className="rounded-full" onClick={() => { setAnswers({}); setResult(null); }}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Start again
                </Button>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div id="tool-result" className="mt-10">
              <div className="print:hidden mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-bold text-foreground">Your result</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={copyAll}>
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />} Copy
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
                  </Button>
                </div>
              </div>

              <article className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-card print:border-0 print:shadow-none print:p-0">
                <h3 className="font-display text-2xl font-bold text-foreground">{result.headline}</h3>
                <p className="mt-2 font-body text-muted-foreground">{result.summary}</p>

                <div className="mt-6 space-y-6">
                  {result.blocks.map((b, i) => (
                    <section key={i} className="break-inside-avoid">
                      <h4 className="font-display text-lg font-semibold text-foreground border-b border-border/50 pb-1.5 mb-3">{b.heading}</h4>
                      {b.text && <p className="font-body text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{b.text}</p>}
                      {b.items && (
                        <ul className="mt-2 space-y-1.5">
                          {b.items.map((it, j) => (
                            <li key={j} className="font-body text-sm text-foreground/90 flex gap-2">
                              <span className="text-accent" aria-hidden="true">•</span>
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {b.note && <p className="mt-2 rounded-lg bg-muted px-3 py-2 font-body text-xs text-muted-foreground">{b.note}</p>}
                    </section>
                  ))}
                </div>

                <p className="mt-8 border-t border-border/50 pt-4 font-body text-xs text-muted-foreground">
                  Made with the free wedding tools at vowz.me/tools
                </p>
              </article>

              <div className="print:hidden mt-8 rounded-2xl border border-accent/40 bg-accent/5 p-6 text-center">
                <h3 className="font-display text-xl font-bold text-foreground mb-2">Put all of this on one link for your guests</h3>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  A wedding website with your events, ceremonies, menu notes, RSVP and photo album — live in about ten minutes.
                </p>
                <Button asChild className="rounded-full">
                  <Link to="/templates">
                    See the templates <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {/* Related */}
          <div className="print:hidden mt-14">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">More free tools</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((t) => (
                <Link
                  key={t.slug}
                  to={`/tools/${t.slug}`}
                  className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-accent/60"
                >
                  <div className="text-2xl mb-1.5" aria-hidden="true">{t.emoji}</div>
                  <p className="font-display text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="font-body text-xs text-muted-foreground mt-1">{t.output}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="print:hidden">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default FreeToolPage;
