import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import CardReveal from "@/components/CardReveal";
import {
  CARD_THEMES,
  InvitationCardArtwork,
  revealForSlug,
  type CardTheme,
  type RevealType,
} from "@/lib/card-templates";

interface SharedCard {
  id: string;
  name: string;
  template_slug: string;
  data: any;
  theme_overrides: any;
  pages: any;
  photo_url: string | null;
  reveal: RevealType | null;
  site_slug: string | null;
}

/** Public guest view of a shared invitation card, opening with its reveal. */
export default function SharedCardPage() {
  const { token } = useParams<{ token: string }>();
  const [card, setCard] = useState<SharedCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      const { data } = await (supabase as any).rpc("get_shared_card", { _token: token });
      if (cancelled) return;
      setCard(Array.isArray(data) && data.length ? (data[0] as SharedCard) : null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Heart className="w-8 h-8 text-gold" />
        <h1 className="font-display text-2xl font-bold">This invitation link isn’t active</h1>
        <p className="font-body text-muted-foreground max-w-sm">
          The couple may have turned sharing off. Please ask them for a fresh link.
        </p>
        <Button variant="outline" asChild><Link to="/">Go to Vowz</Link></Button>
      </div>
    );
  }

  const baseTheme: CardTheme = CARD_THEMES[card.template_slug] ?? CARD_THEMES["modern-typographic"];
  const theme: CardTheme = { ...baseTheme, ...(card.theme_overrides || {}) };
  const d = card.data || {};
  const cardData = {
    partner1: d.partner1 || "Partner One",
    partner2: d.partner2 || "Partner Two",
    date: d.date || "Date to be announced",
    time: d.time,
    venue: d.venue || "",
    message: d.message,
    invitationLine: d.invitationLine,
    photo: card.photo_url || d.photo || undefined,
  };
  const reveal = (card.reveal as RevealType | null) || revealForSlug(card.template_slug);
  const names = `${cardData.partner1} & ${cardData.partner2}`;
  const rsvpSlug = card.site_slug || d.siteSlug || d.slug;

  const artwork = (
    <InvitationCardArtwork data={cardData} theme={theme} width={340} qrPosition="hidden" />
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4" style={{ background: theme.bg }}>
      <Helmet>
        <title>{`${names} — Wedding Invitation`}</title>
        <meta name="description" content={`You are invited to the wedding of ${names}.`} />
        <meta property="og:title" content={`${names} — Wedding Invitation`} />
        <meta property="og:description" content={`You are invited to the wedding of ${names}.`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="robots" content="noindex" />
      </Helmet>

      {reveal ? (
        <CardReveal
          reveal={reveal}
          bg={theme.bg}
          panel={theme.panel}
          ink={theme.ink}
          accent={theme.accent}
          coupleNames={names}
          className="rounded-lg w-full max-w-[360px]"
        >
          {artwork}
        </CardReveal>
      ) : (
        artwork
      )}

      {rsvpSlug && (
        <div className="mt-8 flex w-full max-w-[360px] flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="gold" size="lg" className="w-full sm:w-auto" asChild>
            <a href={`/site/${rsvpSlug}?rsvp=yes#rsvp`}>Yes, I'll be there</a>
          </Button>
          <Button variant="outline" size="lg" className="w-full bg-transparent sm:w-auto" style={{ color: theme.ink, borderColor: theme.accent }} asChild>
            <a href={`/site/${rsvpSlug}?rsvp=no#rsvp`}>Can't make it</a>
          </Button>
        </div>
      )}
      {rsvpSlug && (
        <a href={`/site/${rsvpSlug}`} className="mt-4 font-body text-sm underline opacity-80 hover:opacity-100" style={{ color: theme.ink }}>
          View the full wedding site
        </a>
      )}

      <a
        href="https://vowz.me"
        className="mt-8 text-[11px] font-body opacity-70 hover:opacity-100"
        style={{ color: theme.ink }}
      >
        Made with Vowz
      </a>
    </div>
  );
}
