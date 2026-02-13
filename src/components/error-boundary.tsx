"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw, Terminal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDiagnosticError } from "@/lib/error-handler";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const diagnostic = getDiagnosticError('ERR_DB_SYNC_999', this.state.error);

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full glass-card border-red-500/20 bg-red-500/5 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black uppercase tracking-tight italic text-white">System Runtime Error</h2>
                    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-500 font-black uppercase tracking-widest text-[10px]">
                      {diagnostic.code}
                    </Badge>
                  </div>
                  <p className="text-foreground/60 text-sm font-medium mt-1">An unexpected error has occurred in the application layer.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">Error Message</p>
                  <p className="text-sm font-bold text-white font-mono break-all">{this.state.error?.message || 'Unknown runtime error'}</p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-3 w-3 text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Diagnostic Troubleshooting</p>
                  </div>
                  <p className="text-sm font-medium text-foreground/80 italic">
                    {diagnostic.troubleshooting || 'Reload the page and try again. If the issue persists, contact development support.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button 
                  onClick={() => window.location.reload()}
                  className="blue-gradient text-white border-none font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-primary/20"
                >
                  <RefreshCcw className="h-3 w-3 mr-2" />
                  Reload Application
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="border-white/10 hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] h-10 px-6"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
