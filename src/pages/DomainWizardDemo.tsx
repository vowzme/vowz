import { useState, useEffect } from "react";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe, Search, Crown, ShieldCheck, Settings, Check, X, Copy,
  ExternalLink, ExternalLink as ExternalLinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import VowzLogo from "@/components/VowzLogo";

// ─── Constants (same as Dashboard) ────────────────────────────────────
const DOMAIN_REGISTRARS = [
  { name: "GoDaddy India", url: "https://www.godaddy.com/en-in/domains", payment: "UPI, Cards, Net Banking, Wallets", logo: "🌐" },
  { name: "BigRock", url: "https://www.bigrock.in/domain-registration", payment: "UPI, Cards, Net Banking, Paytm", logo: "🪨" },
  { name: "Hostinger India", url: "https://www.hostinger.in/domain-name-search", payment: "UPI, Cards, Net Banking, PayPal", logo: "⚡" },
  { name: "Namecheap", url: "https://www.namecheap.com/domains/", payment: "Cards, PayPal, Bitcoin", logo: "💰" },
];

const WEDDING_TLDS = [
  { ext: ".com", label: "Global", emoji: "🌍", desc: "Universal & trusted" },
  { ext: ".in", label: "India", emoji: "🇮🇳", desc: "Perfect for Indian weddings" },
  { ext: ".love", label: "Romance", emoji: "💕", desc: "Made for love stories" },
  { ext: ".wedding", label: "Wedding", emoji: "💒", desc: "Dedicated wedding TLD" },
  { ext: ".co", label: "Modern", emoji: "✨", desc: "Short & trendy" },
  { ext: ".me", label: "Personal", emoji: "💑", desc: "Personal touch" },
];

const WIZARD_STEPS = [
  { id: 1, title: "Find Domain", icon: Search, desc: "Search or enter your domain" },
  { id: 2, title: "Purchase", icon: ExternalLinkIcon, desc: "Buy from a registrar" },
  { id: 3, title: "Configure DNS", icon: Settings, desc: "Point domain to your site" },
  { id: 4, title: "Verify & Go Live", icon: ShieldCheck, desc: "Confirm connection" },
];

const DNS_RECORDS = [
  { type: "A", name: "@", value: "185.158.133.1", desc: "Root domain" },
  { type: "A", name: "www", value: "185.158.133.1", desc: "WWW subdomain" },
];

function generateDomainSuggestions(partner1: string, partner2: string, tlds: string[]): string[] {
  const p1 = partner1.toLowerCase().replace(/[^a-z]/g, "");
  const p2 = partner2.toLowerCase().replace(/[^a-z]/g, "");
  if (!p1 || !p2) return [];
  const combos = [`${p1}and${p2}`, `${p1}weds${p2}`, `${p1}loves${p2}`, `${p1}${p2}`, `${p2}and${p1}`, `${p1}${p2}wedding`];
  const domains: string[] = [];
  combos.forEach((c) => { tlds.forEach((tld) => domains.push(`${c}${tld}`)); });
  return [...new Set(domains)];
}

function sanitizeDomainBase(value: string) {
  return value.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function buildPreferredDomainSuggestions(value: string, tlds: string[]) {
  const normalized = sanitizeDomainBase(value);
  if (!normalized) return [];

  if (normalized.includes(".")) {
    return [normalized];
  }

  const slug = normalized.replace(/[^a-z0-9]/g, "");
  if (!slug) return [];

  return tlds.map((tld) => `${slug}${tld}`);
}

type DomainResult = { domain: string; available: boolean | null; checking?: boolean };

const getBuyUrl = (domain: string, registrar: typeof DOMAIN_REGISTRARS[0]) => {
  if (registrar.name === "GoDaddy India") return `https://www.godaddy.com/en-in/domainsearch/find?domainToCheck=${domain}`;
  if (registrar.name === "BigRock") return `https://www.bigrock.in/domain-registration/index.php?domainname=${domain}`;
  if (registrar.name === "Hostinger India") return `https://www.hostinger.in/domain-name-search?query=${domain}`;
  return `https://www.namecheap.com/domains/registration/results/?domain=${domain}`;
};

const DomainWizardDemo = () => {
  const partner1 = "Arjun";
  const partner2 = "Meera";

  const [wizardStep, setWizardStep] = useState(1);
  const [customDomain, setCustomDomain] = useState("");
  const [preferredDomainInput, setPreferredDomainInput] = useState("");
  const [domainResults, setDomainResults] = useState<DomainResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [selectedTlds, setSelectedTlds] = useState<string[]>([".com", ".in", ".wedding"]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("none");
  const [savedDomain, setSavedDomain] = useState<string | null>(null);

  const toggleTld = (tld: string) => {
    setSelectedTlds((prev) => prev.includes(tld) ? prev.filter((t) => t !== tld) : [...prev, tld]);
  };

  const checkAvailability = async () => {
    const preferredSuggestions = buildPreferredDomainSuggestions(preferredDomainInput, selectedTlds);
    const generatedSuggestions = generateDomainSuggestions(partner1, partner2, selectedTlds);
    const suggestions = preferredSuggestions.length > 0 ? preferredSuggestions : generatedSuggestions;

    if (suggestions.length === 0) return;
    setChecking(true);
    setDomainResults(suggestions.map((d) => ({ domain: d, available: null, checking: true })));

    await new Promise((r) => setTimeout(r, 1500));
    setDomainResults(
      suggestions.map((d) => ({
        domain: d,
        available: Math.random() > 0.4,
        checking: false,
      }))
    );
    setChecking(false);
  };

  useEffect(() => {
    if (!customDomain.includes(".") || customDomain.length < 4) return;
    const timer = setTimeout(() => {
      toast({ title: "Domain check", description: "This preview uses simulated domain availability results." });
    }, 1000);
    return () => clearTimeout(timer);
  }, [customDomain]);

  const handleSelectDomain = (domain: string) => {
    setSelectedDomain(domain);
    setCustomDomain(domain);
    setWizardStep(2);
  };

  const handleSaveDomain = async (domain: string) => {
    setSavingDomain(true);
    await new Promise((r) => setTimeout(r, 1000));
    const d = domain.trim().toLowerCase();
    setCustomDomain(d);
    setSelectedDomain(d);
    setSavedDomain(d);
    setCurrentStatus("pending");
    setWizardStep(4);
    setSavingDomain(false);
    toast({ title: "Domain saved! 🔗", description: "In production, this calls the verify-domain edge function." });
  };

  const handleVerify = async () => {
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 2000));
    setCurrentStatus("verified");
    setWizardStep(5);
    setVerifying(false);
    toast({ title: "Domain verified! ✅", description: "In production, DNS is checked via Google DNS API." });
  };

  const handleDisconnect = () => {
    setCustomDomain("");
    setSelectedDomain("");
    setSavedDomain(null);
    setCurrentStatus("none");
    setWizardStep(1);
    toast({ title: "Domain disconnected" });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const hasSavedDomain = !!savedDomain && currentStatus !== "none";

  const sortedResults = [...domainResults].sort((a, b) => {
    const order = (v: boolean | null) => (v === true ? 0 : v === null ? 1 : 2);
    return order(a.available) - order(b.available);
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Custom Domain Check – Vowz" description="Check and connect a custom domain for your Vowz wedding website." robots="index, follow" />
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center">
            <VowzLogo iconSize="h-5" textSize="text-base" />
          </Link>
          <div className="flex-1" />
          <span className="bg-gold/10 text-gold text-xs font-body font-semibold px-3 py-1 rounded-full">
            Domain Check
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Custom Domain Check
          </h1>
          <p className="text-muted-foreground font-body text-sm max-w-lg mx-auto">
            Check preferred names or domains and preview the connection flow for <strong>Arjun & Meera</strong>.
          </p>
        </div>

        {/* The wizard card */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border/30 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                Custom Domain Wizard
                <span className="bg-gold/20 text-gold text-[10px] font-body font-semibold px-2 py-0.5 rounded-full">PREMIUM</span>
              </h2>
              <p className="text-sm text-muted-foreground font-body mt-0.5">
                {hasSavedDomain ? (
                  <>Connected: <strong className="text-foreground">{savedDomain}</strong></>
                ) : (
                  <>Follow the steps to get a memorable address like <strong>arjunandmeera.com</strong></>
                )}
              </p>
            </div>
            {hasSavedDomain && (
              <Button variant="outline" size="sm" className="font-body text-xs text-destructive hover:text-destructive shrink-0" onClick={handleDisconnect}>
                <X className="w-3.5 h-3.5 mr-1" /> Disconnect
              </Button>
            )}
          </div>

          {/* Wizard Progress Bar */}
          <div className="px-4 sm:px-6 pt-5 pb-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-border/50 z-0" />
              <div className="absolute top-4 left-0 h-0.5 bg-gold/70 z-0 transition-all duration-500" style={{ width: `${Math.min(100, ((Math.min(wizardStep, 4) - 1) / 3) * 100)}%` }} />
              {WIZARD_STEPS.map((step) => {
                const StepIcon = step.icon;
                const isComplete = wizardStep > step.id;
                const isCurrent = wizardStep === step.id;
                const isUpcoming = wizardStep < step.id;
                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10" style={{ width: "25%" }}>
                    <button
                      onClick={() => { if (isComplete || isCurrent) setWizardStep(step.id); }}
                      disabled={isUpcoming}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                        isComplete ? "bg-gold text-accent-foreground shadow-sm cursor-pointer" :
                        isCurrent ? "bg-gold/20 text-gold ring-2 ring-gold/40 cursor-default" :
                        "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      {isComplete ? <Check className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`text-[10px] font-body font-medium text-center leading-tight ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* ─── Step 1: Find Domain ─── */}
            {wizardStep === 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="bg-muted/30 border border-border/30 rounded-xl p-4">
                  <h3 className="font-display text-base font-semibold text-foreground mb-1">🔍 Find Your Perfect Domain</h3>
                  <p className="text-xs text-muted-foreground font-body">Enter a preferred name or a full domain, then check what’s available.</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2 max-w-md">
                    <p className="font-body text-sm font-medium text-foreground">Preferred name or domain</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. arjunmeera or arjunmeera.com"
                        value={preferredDomainInput}
                        onChange={(e) => setPreferredDomainInput(e.target.value)}
                        className="pl-10 font-body text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-body">
                      If you enter a name, we’ll check it across the selected extensions.
                    </p>
                  </div>

                  <p className="font-body text-sm font-medium text-foreground">Select domain extensions:</p>
                  <div className="flex flex-wrap gap-2">
                    {WEDDING_TLDS.map((tld) => (
                      <button key={tld.ext} onClick={() => toggleTld(tld.ext)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-body transition-all ${
                          selectedTlds.includes(tld.ext)
                            ? "border-gold/50 bg-gold/10 text-foreground shadow-sm"
                            : "border-border/40 bg-muted/20 text-muted-foreground hover:border-border"
                        }`}
                      >
                        <span>{tld.emoji}</span>
                        <span className="font-semibold">{tld.ext}</span>
                        <span className="hidden sm:inline text-muted-foreground">· {tld.desc}</span>
                        {selectedTlds.includes(tld.ext) && <Check className="w-3 h-3 text-gold ml-1" />}
                      </button>
                    ))}
                  </div>

                  <Button variant="gold" size="sm" className="font-body" onClick={checkAvailability} disabled={checking || selectedTlds.length === 0}>
                    {checking ? <><span className="animate-spin mr-2">⏳</span> Checking...</> : <><Search className="w-4 h-4 mr-1" /> Check Domains</>}
                  </Button>

                  {sortedResults.length > 0 && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 mt-2">
                      {sortedResults.map(({ domain, available, checking: itemChecking }) => (
                        <div key={domain} className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 transition-all ${
                          available === true ? "border-emerald-500/30 bg-emerald-500/5"
                            : available === false ? "border-border/30 bg-muted/30 opacity-50"
                            : "border-border/40 bg-muted/20"
                        }`}>
                          <div className="flex items-center gap-2 min-w-0">
                            {itemChecking ? <span className="w-4 h-4 animate-spin text-xs shrink-0">⏳</span>
                              : available === true ? <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              : available === false ? <X className="w-4 h-4 text-destructive shrink-0" />
                              : <Globe className="w-4 h-4 text-muted-foreground shrink-0" />}
                            <span className="font-body font-mono text-sm text-foreground truncate">{domain}</span>
                            {!itemChecking && available === true && (
                              <span className="text-[10px] font-body font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">Available</span>
                            )}
                          </div>
                          {!itemChecking && available !== false && (
                            <Button variant="gold" size="sm" className="text-[10px] h-7 px-3 font-body shrink-0" onClick={() => handleSelectDomain(domain)}>
                              Select →
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border/20 pt-4 space-y-3">
                  <p className="font-body text-sm font-medium text-foreground">Already have a domain?</p>
                  <div className="flex gap-2 max-w-md">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="e.g. arjunandmeera.com" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="pl-10 font-body font-mono text-sm" />
                    </div>
                    <Button variant="gold" size="sm" className="font-body shrink-0" onClick={() => { setSelectedDomain(customDomain); setWizardStep(3); }} disabled={!customDomain.includes(".") || customDomain.length < 4}>
                      Connect →
                    </Button>
                  </div>
                </div>
              </motion.div>
            )

            {/* ─── Step 2: Purchase ─── */}
            {wizardStep === 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="bg-gold/5 border border-gold/20 rounded-xl p-4">
                  <h3 className="font-display text-base font-semibold text-foreground mb-1">🛒 Purchase Your Domain</h3>
                  <p className="text-xs text-muted-foreground font-body">
                    Buy <strong className="text-foreground font-mono">{selectedDomain}</strong> from any registrar below.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm font-body">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-medium text-foreground">Click a registrar below to open their site</p>
                      <p className="text-xs text-muted-foreground">Your domain will be pre-filled in the search</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm font-body">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-medium text-foreground">Add the domain to your cart & complete checkout</p>
                      <p className="text-xs text-muted-foreground">Skip any add-ons — you only need the domain</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm font-body">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-medium text-foreground">Come back here & click "I've purchased it"</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DOMAIN_REGISTRARS.map((reg) => (
                    <a key={reg.name} href={getBuyUrl(selectedDomain, reg)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 border border-border/40 rounded-xl p-4 hover:border-gold/40 hover:bg-gold/5 transition-all group"
                    >
                      <span className="text-2xl">{reg.logo}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-semibold text-foreground group-hover:text-gold transition-colors">{reg.name}</p>
                        <p className="text-[10px] text-muted-foreground font-body">{reg.payment}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-gold shrink-0" />
                    </a>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="sm" className="font-body" onClick={() => setWizardStep(1)}>← Back</Button>
                  <Button variant="gold" size="sm" className="font-body" onClick={() => setWizardStep(3)}>✅ I've purchased it — Continue</Button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 3: Configure DNS ─── */}
            {wizardStep === 3 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                  <h3 className="font-display text-base font-semibold text-foreground mb-1">⚙️ Configure DNS Records</h3>
                  <p className="text-xs text-muted-foreground font-body">
                    Add these DNS records to point <strong className="text-foreground font-mono">{selectedDomain}</strong> to your wedding site.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 text-sm font-body">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <p className="font-medium text-foreground">Log in to your domain registrar</p>
                  </div>
                  <div className="flex items-start gap-3 text-sm font-body">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <p className="font-medium text-foreground">Navigate to DNS Management / DNS Settings</p>
                  </div>
                  <div className="flex items-start gap-3 text-sm font-body">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <p className="font-medium text-foreground">Add these records:</p>
                  </div>
                </div>

                <div className="border border-border/50 rounded-xl overflow-hidden ml-9">
                  <div className="grid grid-cols-[80px_1fr_1fr_60px] gap-2 px-4 py-2 bg-muted/40 text-[10px] font-body font-semibold uppercase text-muted-foreground">
                    <span>Type</span>
                    <span>Name / Host</span>
                    <span>Value / Points to</span>
                    <span>Copy</span>
                  </div>
                  {DNS_RECORDS.map((rec) => (
                    <div key={rec.name} className="grid grid-cols-[80px_1fr_1fr_60px] gap-2 px-4 py-3 border-t border-border/30 items-center">
                      <span className="font-mono text-sm font-bold text-foreground">{rec.type}</span>
                      <div>
                        <span className="font-mono text-sm text-foreground">{rec.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">({rec.desc})</span>
                      </div>
                      <span className="font-mono text-sm text-foreground">{rec.value}</span>
                      <button onClick={() => copyToClipboard(rec.value, rec.name)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {copiedField === rec.name ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 ml-9">
                  <p className="text-xs text-muted-foreground font-body">
                    <strong className="text-amber-600">⏱ Note:</strong> DNS changes typically take 15 min to 72 hours to propagate.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="sm" className="font-body" onClick={() => setWizardStep(hasSavedDomain ? 1 : 2)}>← Back</Button>
                  <Button variant="gold" size="sm" className="font-body" onClick={() => handleSaveDomain(selectedDomain)} disabled={savingDomain || !selectedDomain}>
                    {savingDomain ? <><span className="animate-spin mr-1">⏳</span> Saving...</> : <>Save & Verify →</>}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 4: Verify ─── */}
            {wizardStep === 4 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className={`border rounded-xl p-4 ${
                  currentStatus === "verified" ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
                }`}>
                  <h3 className="font-display text-base font-semibold text-foreground mb-1">
                    {currentStatus === "verified" ? "✅ Domain Verified!" : "🔍 Verify Your Domain"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-body">
                    {currentStatus === "verified"
                      ? `Your domain ${savedDomain} is verified! SSL will be provisioned automatically.`
                      : `Click below to check if DNS for ${savedDomain || selectedDomain} is configured.`}
                  </p>
                </div>

                {currentStatus === "pending" && (
                  <div className="bg-muted/30 border border-border/30 rounded-xl p-4 space-y-2">
                    <p className="font-body text-xs font-semibold text-foreground">Quick checklist:</p>
                    <div className="space-y-1.5 text-xs font-body text-muted-foreground">
                      <p className="flex items-center gap-2"><Check className="w-3 h-3 text-gold" /> A record for <code className="bg-muted px-1 rounded">@</code> → <code className="bg-muted px-1 rounded">185.158.133.1</code></p>
                      <p className="flex items-center gap-2"><Check className="w-3 h-3 text-gold" /> A record for <code className="bg-muted px-1 rounded">www</code> → <code className="bg-muted px-1 rounded">185.158.133.1</code></p>
                      <p className="flex items-center gap-2"><Check className="w-3 h-3 text-gold" /> Old/conflicting A records removed</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" size="sm" className="font-body" onClick={() => setWizardStep(3)}>← DNS Instructions</Button>
                  <Button variant="gold" size="sm" className="font-body" onClick={handleVerify} disabled={verifying}>
                    {verifying ? <><span className="animate-spin mr-1">⏳</span> Verifying...</> : <><ShieldCheck className="w-4 h-4 mr-1" /> Verify DNS Now</>}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 5: Completed ─── */}
            {wizardStep === 5 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">Your domain is live! 🎉</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    <strong className="text-foreground font-mono">{savedDomain}</strong> is connected to your wedding site.
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <Button variant="gold" size="sm" className="font-body" onClick={() => toast({ title: "Demo mode — no real domain connected" })}>
                    <ExternalLink className="w-4 h-4 mr-1" /> Visit {savedDomain}
                  </Button>
                  <Button variant="outline" size="sm" className="font-body text-xs text-destructive hover:text-destructive" onClick={handleDisconnect}>
                    Disconnect Domain
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <div className="border-t border-border/30 pt-4 mt-4">
              <p className="text-[10px] text-muted-foreground/70 font-body leading-relaxed">
                <strong className="text-muted-foreground">Demo Mode:</strong> This is a preview with simulated data. No real API calls or domain changes are made.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainWizardDemo;
