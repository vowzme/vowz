import SEOHead from "@/components/SEOHead";
import InstallAppPanel from "@/components/InstallAppPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Bell, Smartphone } from "lucide-react";

export default function InstallApp() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
      <SEOHead title="Install the Vowz App | Vowz" description="Add Vowz to your phone's home screen for one-tap access to your wedding website, guest list and RSVPs." />
      <h1 className="text-3xl md:text-4xl font-display font-bold text-center">Install the Vowz app</h1>
      <p className="text-center text-muted-foreground mt-3">One tap from your home screen to your wedding site, guests and RSVPs. Free, and takes a few seconds.</p>
      <Card className="mt-8"><CardContent className="p-6 flex justify-center"><InstallAppPanel /></CardContent></Card>
      <div className="grid sm:grid-cols-3 gap-4 mt-8">
        {[{ i: Zap, t: "Opens instantly", d: "Full screen, no browser bars." }, { i: Smartphone, t: "Like a real app", d: "Sits with your other apps." }, { i: Bell, t: "Always up to date", d: "Updates on its own." }].map((f) => (
          <div key={f.t} className="text-center"><f.i className="h-6 w-6 mx-auto text-accent" /><div className="font-semibold mt-2">{f.t}</div><div className="text-sm text-muted-foreground">{f.d}</div></div>
        ))}
      </div>
    </div>
  );
}
