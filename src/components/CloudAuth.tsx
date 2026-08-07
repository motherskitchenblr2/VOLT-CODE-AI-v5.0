import React, { useCallback, useEffect, useState } from "react";
import {
  Mail,
  Folder,
  HardDrive,
  Loader2,
  LogOut,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface ProviderStatus {
  configured: boolean;
  connected: boolean;
  email: string;
  name: string;
  picture: string;
  expiresAt: string | null;
  services: string[];
}

interface CloudItem {
  id: string;
  name?: string;
  subject?: string;
  from?: { name?: string; address?: string } | string;
  date?: string;
  receivedAt?: string;
  modifiedAt?: string;
  snippet?: string;
  preview?: string;
  size?: unknown;
  link?: string;
  isFolder?: boolean;
}

interface CloudAuthProps {
  username: string;
}

export const CloudAuth: React.FC<CloudAuthProps> = ({ username }) => {
  const [status, setStatus] = useState<Record<string, ProviderStatus> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>("google");
  const [activeService, setActiveService] = useState<string>("drive");
  const [items, setItems] = useState<CloudItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");

  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(
    () => {
      const params = new URLSearchParams(window.location.search);
      if (!params.get("oauth")) return null;
      const ok = params.get("oauth") === "success";
      const provider = params.get("provider") || "";
      const reason = params.get("reason") || "";
      return ok
        ? { type: "success" as const, text: `Connected ${provider} successfully.` }
        : {
            type: "error" as const,
            text: `Connection failed${reason ? `: ${decodeURIComponent(reason)}` : ""}.`,
          };
    },
  );

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/auth?action=status&username=${encodeURIComponent(username)}`,
      );
      const data = (await res.json()) as { providers?: Record<string, ProviderStatus> };
      setStatus(data.providers || null);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    const timer = setTimeout(() => loadStatus(), 0);
    return () => clearTimeout(timer);
  }, [loadStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth")) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const timer = setTimeout(() => loadStatus(), 0);
      return () => clearTimeout(timer);
    }
  }, [loadStatus]);

  const startSignIn = (provider: string) => {
    const url = `/api/auth?action=start&provider=${provider}&username=${encodeURIComponent(username)}`;
    window.location.assign(url);
  };

  const disconnect = async (provider: string) => {
    setBusyProvider(provider);
    try {
      await fetch(`/api/auth?action=logout&username=${encodeURIComponent(username)}&provider=${provider}`, {
        method: "POST",
      });
      await loadStatus();
      setItems([]);
    } catch {
      setNotice({ type: "error", text: "Failed to disconnect." });
    } finally {
      setBusyProvider(null);
    }
  };

  const loadItems = async (provider: string, service: string) => {
    setItemsLoading(true);
    setItemsError("");
    setItems([]);
    try {
      const res = await fetch(
        `/api/cloud/list?username=${encodeURIComponent(username)}&provider=${provider}&service=${service}&max=10`,
      );
      const data = (await res.json()) as { items?: CloudItem[]; error?: string; details?: string };
      if (!res.ok) {
        setItemsError(data.details || data.error || "Failed to load items.");
      } else {
        setItems(data.items || []);
      }
    } catch {
      setItemsError("Failed to reach cloud service.");
    } finally {
      setItemsLoading(false);
    }
  };

  const switchService = (service: string) => {
    setActiveService(service);
    loadItems(activeProvider, service);
  };

  const providerMeta: Record<
    string,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    google: {
      label: "Google",
      icon: <Mail className="w-4 h-4" />,
      color: "text-[#4285F4]",
    },
    microsoft: {
      label: "Microsoft",
      icon: <Cloud className="w-4 h-4" />,
      color: "text-[#00A4EF]",
    },
  };

  const renderProviderCard = (provider: string) => {
    const meta = providerMeta[provider];
    const st = status?.[provider];
    const isBusy = busyProvider === provider;

    return (
      <div
        key={provider}
        className="border border-white/10 bg-black/40 rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${meta.color}`}>
              {meta.icon}
            </div>
            <div>
              <div className="font-extrabold text-sm">{meta.label}</div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">
                {st?.configured ? "Configured" : "Not configured"}
              </div>
            </div>
          </div>

          {st?.connected ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED
              </span>
              <button
                onClick={() => disconnect(provider)}
                disabled={isBusy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer"
              >
                {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                DISCONNECT
              </button>
            </div>
          ) : (
            <button
              onClick={() => startSignIn(provider)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black bg-[#FF5F00] text-black hover:opacity-90 transition-all cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5" />
              SIGN IN WITH {meta.label.toUpperCase()}
            </button>
          )}
        </div>

        {st?.connected && (
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2">
            {st.picture ? (
              <img src={st.picture} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#FF5F00]/20 text-[#FF5F00] flex items-center justify-center font-black text-sm">
                {(st.name || st.email || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">{st.name || st.email}</div>
              <div className="text-[10px] text-white/50 truncate">{st.email}</div>
            </div>
            {st.services.length > 0 && (
              <div className="ml-auto text-[9px] text-white/40 uppercase tracking-wider">
                {st.services.join(" + ")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderServiceBrowser = () => {
    const st = status?.[activeProvider];
    if (!st?.connected) return null;

    return (
      <div className="border border-[#FF5F00]/20 bg-black/40 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-sm text-[#FF5F00] uppercase tracking-wider">
            {providerMeta[activeProvider].label} Cloud Access
          </h3>
          <div className="flex gap-2">
            {Object.keys(providerMeta).filter((p) => status?.[p]?.connected).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setActiveProvider(p);
                  const svc = (status?.[p]?.services || [])[0] || "drive";
                  setActiveService(svc);
                  loadItems(p, svc);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeProvider === p
                    ? "bg-[#FF5F00] text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {providerMeta[p].label}
              </button>
            ))}
            {st.services.map((svc) => (
              <button
                key={svc}
                onClick={() => switchService(svc)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeService === svc
                    ? "bg-[#FF5F00] text-black"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {svc === "gmail" || svc === "mail" ? "Mail" : "Files"}
              </button>
            ))}
            <button
              onClick={() => loadItems(activeProvider, activeService)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 text-white/60 hover:bg-white/10 transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${itemsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {itemsLoading && (
          <div className="flex items-center justify-center py-10 text-white/40 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading {activeService}...
          </div>
        )}

        {!itemsLoading && itemsError && (
          <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {itemsError}
          </div>
        )}

        {!itemsLoading && !itemsError && items.length === 0 && (
          <div className="text-center py-10 text-white/40 text-xs">
            No {activeService} items found.
          </div>
        )}

        {!itemsLoading && !itemsError && items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3"
              >
                <div className="text-[#FF5F00]/70 shrink-0">
                  {(activeService === "gmail" || activeService === "mail") ? (
                    <Mail className="w-4 h-4" />
                  ) : item.isFolder ? (
                    <Folder className="w-4 h-4" />
                  ) : (
                    <HardDrive className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">
                    {activeService === "gmail" || activeService === "mail"
                      ? item.subject || "(no subject)"
                      : item.name}
                  </div>
                  {(activeService === "gmail" || activeService === "mail") && (
                    <div className="text-[10px] text-white/50 truncate">
                      {typeof item.from === "string"
                        ? item.from
                        : item.from
                          ? `${item.from.name || ""} ${item.from.address || ""}`.trim()
                          : ""}
                    </div>
                  )}
                  {(activeService === "gmail" || activeService === "mail") && item.snippet && (
                    <div className="text-[10px] text-white/40 truncate">{item.snippet}</div>
                  )}
                </div>
                <div className="text-[10px] text-white/40 shrink-0">
                  {activeService === "gmail" || activeService === "mail"
                    ? (item.date || item.receivedAt || "").slice(0, 10)
                    : (item.modifiedAt || "").slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {notice && (
        <div
          className={`flex items-start gap-2 text-xs rounded-xl px-4 py-3 border ${
            notice.type === "success"
              ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/20"
              : "text-red-400 bg-red-500/5 border-red-500/20"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            className="ml-auto text-white/40 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {!loading && (!status || status.google === undefined) && (
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl px-4 py-3 text-xs text-amber-400">
          OAuth status is unavailable right now. The server may not be reachable
          or MongoDB is not configured. Sign-in will still persist once the
          required credentials are added.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/40 text-xs gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking connections...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderProviderCard("google")}
          {renderProviderCard("microsoft")}
        </div>
      )}

      {renderServiceBrowser()}

      <div className="text-[10px] text-white/35 leading-relaxed">
        Google sign-in grants read access to Gmail and Google Drive. Microsoft
        sign-in grants access to OneDrive and Outlook Mail. Tokens are encrypted
        at rest and never stored as plaintext.
      </div>
    </div>
  );
};
