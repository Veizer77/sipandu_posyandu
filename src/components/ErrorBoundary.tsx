import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">Terjadi Kesalahan</h1>
              <p className="text-slate-500 text-sm">
                Aplikasi mengalami masalah yang tidak terduga. Jangan khawatir, data Anda aman.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 p-4 rounded-xl text-left overflow-auto max-h-32 border border-slate-200">
                <code className="text-xs text-rose-600 font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
