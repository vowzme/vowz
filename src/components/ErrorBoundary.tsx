import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, WifiOff } from "lucide-react";

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error; retryKey: number }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryKey: 0 };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryKey: 0 };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private softRetry = () => {
    // Reset boundary — child tree remounts. Works for transient Realtime /
    // network failures without dropping the user's auth session.
    this.setState((s) => ({ hasError: false, error: undefined, retryKey: s.retryKey + 1 }));
  };

  private isRealtimeError(msg: string): boolean {
    const m = msg.toLowerCase();
    return (
      m.includes("postgres_changes") ||
      m.includes("realtime:") ||
      m.includes("channel") ||
      m.includes("websocket") ||
      m.includes("subscribe")
    );
  }

  render() {
    if (!this.state.hasError) {
      // key forces a fresh subtree on soft retry so subscriptions re-init.
      return <div key={this.state.retryKey}>{this.props.children}</div>;
    }

    const message = this.state.error?.message ?? "";
    const realtime = this.isRealtimeError(message);

    const steps = realtime
      ? [
          "Check your internet connection — Realtime updates need an active WebSocket.",
          "Disable browser extensions that block WebSockets (ad blockers, privacy tools).",
          "If you're on a corporate or public Wi-Fi, try a different network or mobile data.",
          "Click Retry — most subscription errors clear on a fresh connection.",
        ]
      : [
          "Reload the page — most errors clear after a fresh load.",
          "Sign out and sign back in if the issue persists.",
          "Clear this site's cache and cookies, then try again.",
          "Contact support if the same error keeps appearing.",
        ];

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
        <div className="max-w-lg w-full space-y-5">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${realtime ? "bg-amber-500/10" : "bg-destructive/10"}`}>
              {realtime ? (
                <WifiOff className="w-7 h-7 text-amber-600" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-7 h-7 text-destructive" aria-hidden="true" />
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {realtime ? "Live updates disconnected" : "Something went wrong"}
            </h1>
            <p className="font-body text-muted-foreground text-sm">
              {realtime
                ? "We couldn't keep live updates running. Your data is safe — try reconnecting below."
                : "An unexpected error occurred. Try the steps below to get back on track."}
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <p className="font-display text-sm font-semibold text-foreground mb-2">
              Troubleshooting
            </p>
            <ol className="font-body text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
              {steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>

          {message && (
            <details className="text-xs">
              <summary className="font-body text-muted-foreground cursor-pointer select-none">
                Show technical details
              </summary>
              <pre className="mt-2 text-left bg-muted p-3 rounded overflow-auto max-h-40 font-mono">
                {message}
              </pre>
            </details>
          )}

          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={this.softRetry} variant="gold" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Hard reload
            </Button>
            <Button onClick={() => (window.location.href = "/")} variant="ghost" className="gap-2">
              <Home className="w-4 h-4" />
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;