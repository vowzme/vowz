import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { setRealtimeHealth } from "@/lib/realtime-health";

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error; retryKey: number }

const REALTIME_PATTERN =
  /realtime|websocket|web socket|socket closed|channel_error|subscribe|live update/i;

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryKey: 0 };
  private autoRecoveries = 0;

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryKey: 0 };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);

    // A dropped live-update stream is never fatal: mark it degraded so screens
    // switch to polling, and quietly remount instead of showing an error page.
    if (REALTIME_PATTERN.test(error?.message ?? "") && this.autoRecoveries < 3) {
      this.autoRecoveries += 1;
      setRealtimeHealth("degraded");
      this.softRetry();
    }
  }

  private softRetry = () => {
    // Reset boundary — child tree remounts. Works for transient Realtime /
    // network failures without dropping the user's auth session.
    this.setState((s) => ({ hasError: false, error: undefined, retryKey: s.retryKey + 1 }));
  };


  render() {
    if (!this.state.hasError) {
      // key forces a fresh subtree on soft retry so subscriptions re-init.
      return <div key={this.state.retryKey}>{this.props.children}</div>;
    }

    const message = this.state.error?.message ?? "";
    const steps = [
      "Try again — most temporary errors clear without signing out.",
      "Return to the home page if this section still cannot open.",
      "Reload the app only if the first two options do not work.",
      "Contact support if the same error keeps appearing.",
    ];

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
        <div className="max-w-lg w-full space-y-5">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-destructive/10">
              <AlertTriangle className="w-7 h-7 text-destructive" aria-hidden="true" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="font-body text-muted-foreground text-sm">
              An unexpected error occurred. Try the steps below to get back on track.
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