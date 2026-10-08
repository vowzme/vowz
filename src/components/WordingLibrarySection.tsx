import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LIBRARY: Record<string, string[]> = {
  Invitation: [
    "With the blessings of our families, we joyfully invite you to celebrate the wedding of [Bride] and [Groom] on [Date] at [Venue]. Your presence will make our day complete.",
    "Two hearts, one journey. Please join us as [Bride] & [Groom] begin forever together on [Date].",
    "Save the date! [Bride] and [Groom] are getting married on [Date] in [City]. Formal invitation to follow.",
  ],
  "Family welcome": [
    "Mr. & Mrs. [Parents' names] request the honour of your presence at the marriage of their beloved daughter [Bride] with [Groom].",
    "Our families, our friends, our joy. The [Family name] family warmly welcomes you to the celebrations.",
  ],
  "Love story": [
    "It started with a hello at [Place] and became a lifetime of laughter. Years later, here we are, ready to say 'I do'.",
    "Friends first, partners always. We can't wait to celebrate this next chapter with the people we love most.",
  ],
  "WhatsApp message": [
    "Namaste! 🙏 We'd love for you to celebrate our wedding with us. All the details, venue map and RSVP are here: [Link]",
    "Hi [Name]! Our wedding invitation is ready 💛 Please tap to view and let us know if you can join: [Link]",
  ],
  "Thank you": [
    "Thank you for showering us with love and blessings. Your presence made our wedding truly special. With love, [Bride] & [Groom].",
  ],
};

const WordingLibrarySection = () => {
  const tabs = Object.keys(LIBRARY);
  const [tab, setTab] = useState(tabs[0]);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      toast.success("Wording copied");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Couldn't copy — please select the text instead");
    }
  };

  return (
    <section className="py-16 sm:py-24 px-4" id="wording">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-heading text-3xl sm:text-4xl text-center text-foreground mb-3">
          Wedding invitation wording ideas
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Stuck on what to write? Copy a ready-made message and replace the words in brackets.
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 sm:justify-center" role="tablist">
          {tabs.map((t) => (
            <Button
              key={t}
              role="tab"
              aria-selected={tab === t}
              variant={tab === t ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => setTab(t)}
            >
              {t}
            </Button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {LIBRARY[tab].map((text) => (
            <div key={text} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <p className="text-sm leading-relaxed text-foreground flex-1">{text}</p>
              <Button variant="outline" size="sm" className="self-start" onClick={() => copy(text)}>
                {copied === text ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied === text ? "Copied" : "Copy"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WordingLibrarySection;
