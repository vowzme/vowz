import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Heart, Sparkles, Users, Camera, Mail, X, Wand2 } from "lucide-react";
import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import coupleHindu from "@/assets/showcase/couple-hindu.jpg";
import coupleChristian from "@/assets/showcase/couple-christian.jpg";
import coupleBeach from "@/assets/showcase/couple-beach.jpg";
import coupleModern from "@/assets/showcase/couple-modern.jpg";
import coupleMuslim from "@/assets/showcase/couple-muslim.jpg";
import venueGarden from "@/assets/showcase/venue-garden.jpg";

type Demo = {
  slug: string;
  category: string;
  style: string;
  bride: string;
  groom: string;
  date: string;
  city: string;
  story: string;
  hero: string;
  gallery: string[];
  events: { name: string; date: string; time: string; venue: string }[];
  palette: { bg: string; ink: string; accent: string; soft: string };
  font: { display: string; body: string };
};

const DEMOS: Demo[] = [
  {
    slug: "aarav-priya",
    category: "Hindu Traditional",
    style: "Traditional",
    bride: "Priya Menon",
    groom: "Aarav Sharma",
    date: "Saturday, 14 February 2026",
    city: "Udaipur, India",
    story:
      "From childhood neighbours running through marigold fields to two engineers building a life together — our story has always smelt of jasmine and warm chai.",
    hero: coupleHindu,
    gallery: [coupleHindu, venueGarden, coupleHindu],
    events: [
      { name: "Mehndi", date: "12 Feb 2026", time: "5:00 PM", venue: "Trident Palace Lawns" },
      { name: "Sangeet", date: "13 Feb 2026", time: "7:30 PM", venue: "Trident Palace Ballroom" },
      { name: "Wedding Ceremony", date: "14 Feb 2026", time: "10:00 AM", venue: "Jagmandir Island" },
      { name: "Reception", date: "14 Feb 2026", time: "8:00 PM", venue: "Leela Palace, Lake Pichola" },
    ],
    palette: { bg: "#FFF8EC", ink: "#3A0A0A", accent: "#B8860B", soft: "#F2D7A3" },
    font: { display: "'Playfair Display', serif", body: "'Inter', sans-serif" },
  },
  {
    slug: "ethan-sophia",
    category: "Christian Classic",
    style: "Classic",
    bride: "Sophia Bennett",
    groom: "Ethan Caldwell",
    date: "Saturday, 27 June 2026",
    city: "Cotswolds, UK",
    story:
      "We met at a friend's chapel choir rehearsal — Ethan was the tenor who couldn't read music, Sophia was the soprano who pretended not to notice. Three years later, here we are.",
    hero: coupleChristian,
    gallery: [coupleChristian, venueGarden, coupleChristian],
    events: [
      { name: "Rehearsal Dinner", date: "26 Jun 2026", time: "7:00 PM", venue: "The Wild Rabbit, Kingham" },
      { name: "Holy Matrimony", date: "27 Jun 2026", time: "11:30 AM", venue: "St. Mary's Church, Burford" },
      { name: "Reception & Dinner", date: "27 Jun 2026", time: "5:00 PM", venue: "Daylesford Estate" },
    ],
    palette: { bg: "#FBF7F2", ink: "#1F2937", accent: "#8C6A4A", soft: "#E8DDD0" },
    font: { display: "'Cormorant Garamond', serif", body: "'Lato', sans-serif" },
  },
  {
    slug: "leo-mia",
    category: "Beach Destination",
    style: "Destination",
    bride: "Mia Alvarez",
    groom: "Leo Hartmann",
    date: "Friday, 9 October 2026",
    city: "Tulum, Mexico",
    story:
      "A spontaneous backpacking trip turned into shared sunsets, shared coffee, and finally a shared forever. We're bringing everyone we love to the beach where it all began.",
    hero: coupleBeach,
    gallery: [coupleBeach, venueGarden, coupleBeach],
    events: [
      { name: "Welcome Bonfire", date: "8 Oct 2026", time: "8:00 PM", venue: "Papaya Playa Beach" },
      { name: "Beach Ceremony", date: "9 Oct 2026", time: "5:30 PM", venue: "Nest Tulum Shore" },
      { name: "Tropical Reception", date: "9 Oct 2026", time: "7:30 PM", venue: "Nest Tulum Garden" },
    ],
    palette: { bg: "#F5F2EB", ink: "#0F2A33", accent: "#E07B5A", soft: "#D9C7A7" },
    font: { display: "'Cormorant Garamond', serif", body: "'Inter', sans-serif" },
  },
  {
    slug: "noah-ava",
    category: "Modern Minimalist",
    style: "Modern",
    bride: "Ava Lindgren",
    groom: "Noah Park",
    date: "Saturday, 21 March 2026",
    city: "Brooklyn, NY",
    story:
      "An architect and a product designer who fell in love over identical pairs of running shoes. We believe in less, but better — including this wedding.",
    hero: coupleModern,
    gallery: [coupleModern, venueGarden, coupleModern],
    events: [
      { name: "Ceremony", date: "21 Mar 2026", time: "4:00 PM", venue: "The Green Building, Carroll Gardens" },
      { name: "Dinner & Dancing", date: "21 Mar 2026", time: "6:30 PM", venue: "The Green Building, Loft" },
    ],
    palette: { bg: "#F3F3F1", ink: "#111111", accent: "#2B2B2B", soft: "#D9D6CF" },
    font: { display: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif" },
  },
  {
    slug: "zayn-aisha",
    category: "Muslim Nikkah",
    style: "Traditional",
    bride: "Aisha Rahman",
    groom: "Zayn Khan",
    date: "Sunday, 16 August 2026",
    city: "Hyderabad, India",
    story:
      "Bismillah. Two families, one prayer answered. We invite you to share in our Nikkah and the celebrations that follow, Insha'Allah.",
    hero: coupleMuslim,
    gallery: [coupleMuslim, venueGarden, coupleMuslim],
    events: [
      { name: "Mangni", date: "14 Aug 2026", time: "6:30 PM", venue: "Falaknuma Garden" },
      { name: "Nikkah Ceremony", date: "16 Aug 2026", time: "11:00 AM", venue: "Mecca Masjid Hall" },
      { name: "Walima Reception", date: "16 Aug 2026", time: "7:30 PM", venue: "Taj Falaknuma Palace" },
    ],
    palette: { bg: "#F4EFE6", ink: "#2D2A26", accent: "#9C7B3F", soft: "#E3D2B0" },
    font: { display: "'Playfair Display', serif", body: "'Inter', sans-serif" },
  },
  {
    slug: "samuel-grace",
    category: "Garden Romantic",
    style: "Romantic",
    bride: "Grace Whitmore",
    groom: "Samuel Reed",
    date: "Saturday, 9 May 2026",
    city: "Napa Valley, California",
    story:
      "We planted basil on our first apartment balcony. Five summers later we're planting our forever — under the same string lights and white roses.",
    hero: venueGarden,
    gallery: [venueGarden, coupleChristian, venueGarden],
    events: [
      { name: "Welcome Brunch", date: "8 May 2026", time: "11:00 AM", venue: "Carneros Resort Patio" },
      { name: "Garden Ceremony", date: "9 May 2026", time: "4:30 PM", venue: "Beaulieu Garden" },
      { name: "Vineyard Reception", date: "9 May 2026", time: "6:30 PM", venue: "Beaulieu Garden Pavilion" },
    ],
    palette: { bg: "#FAF7F0", ink: "#23311E", accent: "#A56A5B", soft: "#E7DCC8" },
    font: { display: "'Cormorant Garamond', serif", body: "'Lato', sans-serif" },
  },
];

export default function Showcase() {
  const [params, setParams] = useSearchParams();
  const id = params.get("id");
  const demo = useMemo(() => DEMOS.find((d) => d.slug === id) ?? null, [id]);
  const category = params.get("category") ?? "all";
  const style = params.get("style") ?? "all";

  const categories = useMemo(
    () => Array.from(new Set(DEMOS.map((d) => d.category))).sort(),
    [],
  );
  const styles = useMemo(
    () => Array.from(new Set(DEMOS.map((d) => d.style))).sort(),
    [],
  );
  const filtered = useMemo(
    () =>
      DEMOS.filter(
        (d) =>
          (category === "all" || d.category === category) &&
          (style === "all" || d.style === style),
      ),
    [category, style],
  );
  const setFilter = (key: "category" | "style", value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("id");
    setParams(next, { replace: true });
  };
  const clearFilters = () => {
    const next = new URLSearchParams(params);
    next.delete("category");
    next.delete("style");
    setParams(next, { replace: true });
  };
  const hasFilters = category !== "all" || style !== "all";

  if (demo) {
    return (
      <Layout>
        <SEOHead
          title={`${demo.bride} & ${demo.groom} — Wedding Website Example | Vowz`}
          description={`Explore a ${demo.style.toLowerCase()} ${demo.category.toLowerCase()} wedding website example with RSVP, events, gallery and maps — built on Vowz.`}
          ogTitle={`${demo.bride} & ${demo.groom} — Wedding Website Example`}
          ogDescription={`A ${demo.style.toLowerCase()} sample wedding website with RSVP, schedule, gallery and directions.`}
          ogUrl={`https://vowz.me/showcase?demo=${demo.slug}`}
          ogType="website"
          twitterCard="summary_large_image"
          canonical="https://vowz.me/showcase"
        />

        <div className="bg-muted/30 border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParams({}, { replace: true })}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back to showcase
            </Button>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" /> Live demo · {demo.category}
              </Badge>
              <Link
                to={`/wizard?demo=${encodeURIComponent(demo.slug)}&category=${encodeURIComponent(demo.category)}&style=${encodeURIComponent(demo.style)}`}
              >
                <Button size="sm" className="gap-2">
                  <Wand2 className="h-4 w-4" /> Start with this demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <DemoSite demo={demo} />
        <div className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-10 text-center">
            <h3 className="font-display text-2xl font-semibold mb-2">
              Love this {demo.category.toLowerCase()} look?
            </h3>
            <p className="text-muted-foreground mb-4">
              Launch your own wedding site using the same template in minutes.
            </p>
            <Link
              to={`/wizard?demo=${encodeURIComponent(demo.slug)}&category=${encodeURIComponent(demo.category)}&style=${encodeURIComponent(demo.style)}`}
            >
              <Button size="lg" className="gap-2">
                <Wand2 className="h-4 w-4" /> Start with this demo
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Wedding Website Examples & Showcase — Vowz"
        description="Browse real-feel wedding website examples across Hindu, Christian, Muslim, beach and modern styles — with RSVP, events, gallery and maps."
        ogTitle="Wedding Website Examples & Showcase — Vowz"
        ogDescription="See fully designed sample wedding websites you can recreate in minutes with Vowz."
        ogUrl="https://vowz.me/showcase"
        ogType="website"
        twitterCard="summary_large_image"
        canonical="https://vowz.me/showcase"
      />

      <section className="bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-14 text-center max-w-3xl">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Sparkles className="h-3 w-3" /> Real-feel customer demos
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            See what your wedding website can look like
          </h1>
          <p className="text-muted-foreground text-lg">
            Six fully designed sample wedding websites — built with our different category
            templates and styled end-to-end so you can experience the platform exactly
            the way your guests will.
          </p>
          <p className="text-xs text-muted-foreground mt-3 italic">
            All couples, names and photos shown are AI-generated for demonstration only.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="mb-8 space-y-3">
          <FilterRow
            label="Category"
            options={categories}
            value={category}
            onChange={(v) => setFilter("category", v)}
          />
          <FilterRow
            label="Style"
            options={styles}
            value={style}
            onChange={(v) => setFilter("style", v)}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filtered.length} of {DEMOS.length} demo{DEMOS.length === 1 ? "" : "s"}
            </span>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d, i) => (
            <motion.div
              key={d.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow h-full"
                onClick={() => setParams({ id: d.slug }, { replace: false })}>
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  <img
                    src={d.hero}
                    alt={`${d.bride} and ${d.groom} — ${d.category} wedding demo`}
                    width={1024}
                    height={1280}
                    loading="lazy"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-2 text-xs">{d.category}</Badge>
                  <h3 className="font-display text-xl font-semibold">
                    {d.bride.split(" ")[0]} & {d.groom.split(" ")[0]}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {d.date}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {d.city}
                  </p>
                  <Button variant="link" className="px-0 mt-2">View live demo →</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="mb-4">No demos match these filters yet.</p>
            <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
          </div>
        )}

        <div className="text-center mt-14">
          <p className="text-muted-foreground mb-4">Like what you see? Build yours in minutes.</p>
          <Link to="/wizard">
            <Button size="lg" variant="default">Start my wedding website</Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">
        {label}
      </span>
      <FilterChip active={value === "all"} onClick={() => onChange("all")}>
        All
      </FilterChip>
      {options.map((opt) => (
        <FilterChip key={opt} active={value === opt} onClick={() => onChange(opt)}>
          {opt}
        </FilterChip>
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-muted border-border text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function DemoSite({ demo }: { demo: Demo }) {
  const { palette, font } = demo;
  return (
    <div
      style={{
        background: palette.bg,
        color: palette.ink,
        fontFamily: font.body,
      }}
    >
      {/* Hero */}
      <header className="relative">
        <div className="aspect-[16/10] sm:aspect-[16/8] w-full overflow-hidden">
          <img
            src={demo.hero}
            alt={`${demo.bride} and ${demo.groom}`}
            width={1920}
            height={1080}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 text-center text-white p-8">
          <p className="uppercase tracking-[0.4em] text-xs mb-3" style={{ color: palette.soft }}>
            We're getting married
          </p>
          <h1
            className="text-4xl md:text-6xl font-semibold"
            style={{ fontFamily: font.display }}
          >
            {demo.bride.split(" ")[0]} <span style={{ color: palette.soft }}>&</span>{" "}
            {demo.groom.split(" ")[0]}
          </h1>
          <p className="mt-4 text-sm md:text-base opacity-90">
            {demo.date} · {demo.city}
          </p>
        </div>
      </header>

      {/* Story */}
      <Section title="Our Story" icon={<Heart className="h-4 w-4" />} palette={palette} font={font}>
        <p className="max-w-2xl mx-auto text-center leading-relaxed text-base md:text-lg opacity-90">
          {demo.story}
        </p>
      </Section>

      {/* Events */}
      <Section title="Wedding Events" icon={<Calendar className="h-4 w-4" />} palette={palette} font={font}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {demo.events.map((e) => (
            <div
              key={e.name}
              className="rounded-lg p-5 text-center"
              style={{ background: palette.soft + "55", border: `1px solid ${palette.soft}` }}
            >
              <h3 className="text-xl mb-2" style={{ fontFamily: font.display, color: palette.accent }}>
                {e.name}
              </h3>
              <p className="text-sm opacity-80">{e.date}</p>
              <p className="text-sm opacity-80">{e.time}</p>
              <p className="text-sm mt-2">{e.venue}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Gallery */}
      <Section title="Moments" icon={<Camera className="h-4 w-4" />} palette={palette} font={font}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {demo.gallery.map((src, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-md">
              <img
                src={src}
                alt={`Memory ${i + 1}`}
                width={600}
                height={600}
                loading="lazy"
                className="size-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Wedding Party */}
      <Section title="Wedding Party" icon={<Users className="h-4 w-4" />} palette={palette} font={font}>
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-center">
          <div>
            <h3 className="text-xl mb-1" style={{ fontFamily: font.display, color: palette.accent }}>
              The Bride
            </h3>
            <p className="font-medium">{demo.bride}</p>
            <p className="text-sm opacity-75 mt-1">
              Daughter of Mr. & Mrs. {demo.bride.split(" ").slice(-1)[0]}
            </p>
          </div>
          <div>
            <h3 className="text-xl mb-1" style={{ fontFamily: font.display, color: palette.accent }}>
              The Groom
            </h3>
            <p className="font-medium">{demo.groom}</p>
            <p className="text-sm opacity-75 mt-1">
              Son of Mr. & Mrs. {demo.groom.split(" ").slice(-1)[0]}
            </p>
          </div>
        </div>
      </Section>

      {/* RSVP */}
      <Section title="RSVP" icon={<Mail className="h-4 w-4" />} palette={palette} font={font}>
        <form
          className="max-w-xl mx-auto grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            alert("This is a demo wedding website — RSVPs aren't sent.");
          }}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Full name</Label>
              <Input required placeholder="Your name" />
            </div>
            <div>
              <Label className="text-xs">Guests attending</Label>
              <Input type="number" min={1} defaultValue={1} />
            </div>
          </div>
          <div>
            <Label className="text-xs">A note for the couple</Label>
            <Textarea rows={3} placeholder="Wishes, dietary notes, anything…" />
          </div>
          <Button
            type="submit"
            className="mt-2"
            style={{ background: palette.accent, color: "#fff" }}
          >
            Send RSVP
          </Button>
        </form>
      </Section>

      {/* Footer */}
      <footer className="py-10 text-center text-xs opacity-70 border-t" style={{ borderColor: palette.soft }}>
        Made with love on Vowz · This is a sample wedding website for demonstration only.
      </footer>
    </div>
  );
}

function Section({
  title,
  icon,
  palette,
  font,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  palette: Demo["palette"];
  font: Demo["font"];
  children: React.ReactNode;
}) {
  return (
    <section className="py-14 px-4">
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 uppercase tracking-[0.3em] text-[10px] mb-2"
          style={{ color: palette.accent }}
        >
          {icon}
          <span>{title}</span>
        </div>
        <h2 className="text-3xl md:text-4xl" style={{ fontFamily: font.display }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}