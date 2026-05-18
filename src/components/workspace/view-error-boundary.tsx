import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  tabId: string;
  title?: string;
  onClose?: (tabId: string) => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ViewErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[ViewErrorBoundary]", this.props.tabId, error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    const { error } = this.state;
    return (
      <div className="p-6">
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-destructive">
                Error al renderizar {this.props.title ?? "la pestaña"}
              </p>
              <p className="mt-1 text-sm text-foreground break-words">{error.message}</p>
              {error.stack && (
                <pre className="mt-3 max-h-64 overflow-auto rounded bg-muted p-2 text-[11px] leading-snug">
                  {error.stack}
                </pre>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={this.reset}>Reintentar</Button>
                {this.props.onClose && (
                  <Button size="sm" variant="ghost" onClick={() => this.props.onClose?.(this.props.tabId)}>
                    Cerrar pestaña
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}