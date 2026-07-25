import { CreditCard, ShieldCheck, LayoutDashboard } from "lucide-react";

interface Props {
  /** 1 = choosing payment, 2 = on gateway, 3 = returning */
  current?: 1 | 2 | 3;
}

const STEPS = [
  { n: 1, label: "Choose", sub: "Pick method", Icon: CreditCard },
  { n: 2, label: "Confirm", sub: "On gateway", Icon: ShieldCheck },
  { n: 3, label: "Return", sub: "To dashboard", Icon: LayoutDashboard },
] as const;

const CheckoutSteps = ({ current = 1 }: Props) => {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground text-center mb-2">
        What happens next
      </p>
      <ol className="flex items-center justify-between gap-1">
        {STEPS.map((s, i) => {
          const active = s.n === current;
          const done = s.n < current;
          const Icon = s.Icon;
          return (
            <li key={s.n} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : done
                      ? "bg-primary/20 text-primary border-primary/40"
                      : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-center leading-tight">
                  <p
                    className={`text-[11px] font-medium ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground">{s.sub}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-full flex-1 mx-1 -mt-6 ${
                    done || active ? "bg-primary/40" : "bg-border"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default CheckoutSteps;