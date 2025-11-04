"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
    // Hook into telemetry here if needed
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 md:p-6">
          <div className="rounded-lg border p-4 md:p-6 bg-muted/40">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="rounded-full bg-destructive/10 p-2 md:p-3">
                <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-base md:text-lg mb-1">
                  {this.props.fallbackTitle || "Something went wrong in this section"}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {this.state.error?.message || "An unexpected error occurred."}
                </p>
                <Button onClick={this.handleReset} size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" /> Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
