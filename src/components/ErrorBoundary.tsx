import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-3xl font-bold text-foreground">Something went wrong</h1>
          <p className="font-body text-muted-foreground text-sm">
            An unexpected error occurred. Try reloading the page, or head back home.
          </p>
          {this.state.error?.message && (
            <pre className="text-xs text-left bg-muted p-3 rounded overflow-auto max-h-40 font-mono">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="gold">Reload</Button>
            <Button onClick={() => (window.location.href = "/")} variant="outline">Go home</Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;