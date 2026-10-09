import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Home-page link to the ready-to-send WhatsApp invitation page. */
export default function WhatsAppInviteBanner() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto rounded-2xl border bg-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
        <MessageCircle className="h-10 w-10 text-accent shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-display font-bold">Send your wedding invitation on WhatsApp</h2>
          <p className="text-sm text-muted-foreground mt-1">Get a ready-to-send message with your invitation link, venue map and one-tap RSVP.</p>
        </div>
        <Button asChild size="lg"><Link to="/whatsapp-wedding-invitation">See the WhatsApp invitation</Link></Button>
      </div>
    </section>
  );
}
