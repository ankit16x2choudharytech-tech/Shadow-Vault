"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;
      return (
        <div className="rounded-xl border border-[var(--neon-pink)]/30 bg-[var(--neon-pink)]/5 p-4 text-sm">
          <div className="font-semibold text-[var(--neon-pink)] mb-1">
            Render error
          </div>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
            {this.state.error?.message ?? "Unknown error"}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
