import React, { Component } from "react";
import { AlertTriangle, RefreshCw, Download } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * App-level error boundary. Keeps a crashed render from wiping the whole app
 * to a white screen; offers session backup export + reload as recovery.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch() {
    // ponytail: console only — send to observability when it matters
  }

  /** Dump every volt_* session key so a crash can't destroy work. */
  exportBackup = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) data[key] = localStorage.getItem(key);
    }
    const blob = new Blob(
      [JSON.stringify({ source: "volt-crash-recovery", data }, null, 2)],
      {
        type: "application/json",
      },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `volt-crash-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
        <div className="max-w-md w-full rounded-xl border border-[#FF5F00]/40 bg-black p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-[#FF5F00] mx-auto mb-4" />
          <h1 className="text-white font-bold text-lg mb-2">
            VOLT AI CORE: RENDER FAULT CONTAINED
          </h1>
          <p className="text-white/60 text-xs mb-1">
            The interface hit an unexpected error. Your sessions are still
            stored locally.
          </p>
          <p className="text-red-400/80 text-[10px] font-mono mb-6 break-all">
            {this.state.message}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5F00] text-black text-xs font-bold cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              RELOAD SESSION
            </button>
            <button
              onClick={this.exportBackup}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black border border-[#FF5F00]/60 text-[#FF5F00] text-xs font-bold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              BACKUP
            </button>
          </div>
        </div>
      </div>
    );
  }
}
