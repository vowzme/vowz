import { Check, X } from "lucide-react";

const rows: [string, string, string][] = [
  ["Cost", "₹80–₹350 per printed card, plus courier", "One plan for unlimited guests"],
  ["Delivery", "2–4 weeks to design, print and post", "Reaches guests on WhatsApp in seconds"],
  ["Changes", "Date or venue change means reprinting", "Edit wording, photos and venue anytime"],
  ["RSVPs", "Phone calls and lost reply cards", "Live RSVP list with meal choices, CSV export"],
  ["Directions", "Printed address only", "One-tap Google Maps directions"],
  ["Extras", "Text and a photo", "Countdown, music, gallery, photo wall, blessings"],
  ["Environment", "Paper and transport waste", "100% paperless"],
];

const PaperVsDigitalSection = () => (
  <section className="py-16 sm:py-24 px-4 bg-muted/30" id="paper-vs-digital">
    <div className="max-w-4xl mx-auto">
      <h2 className="font-display font-bold text-3xl sm:text-4xl text-center text-foreground mb-3">
        Paper invitations vs a Vowz wedding website
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
        Why couples are switching to digital wedding invitations they can share on WhatsApp.
      </p>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_1.2fr_1.2fr] text-xs sm:text-sm font-semibold bg-muted/60 text-foreground">
          <div className="p-3 sm:p-4" />
          <div className="p-3 sm:p-4">Paper cards</div>
          <div className="p-3 sm:p-4 text-primary">Vowz</div>
        </div>
        {rows.map(([label, paper, vowz]) => (
          <div key={label} className="grid grid-cols-[1fr_1.2fr_1.2fr] text-xs sm:text-sm border-t border-border">
            <div className="p-3 sm:p-4 font-medium text-foreground">{label}</div>
            <div className="p-3 sm:p-4 text-muted-foreground flex gap-2">
              <X className="w-4 h-4 shrink-0 mt-0.5 text-destructive" aria-hidden />
              <span>{paper}</span>
            </div>
            <div className="p-3 sm:p-4 text-foreground flex gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-primary" aria-hidden />
              <span>{vowz}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PaperVsDigitalSection;
