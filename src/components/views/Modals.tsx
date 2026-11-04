/**
 * Modals — all modal/drawer components extracted from App.tsx.
 * Each modal receives its required state/handlers as props.
 */
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Copy, Download, HelpCircle, X } from "lucide-react";
import { VisualDiff } from "../VisualDiff";

interface DiffModalProps {
  showDiff: boolean;
  setShowDiff: (v: boolean) => void;
  issues: Array<{
    id: number;
    type: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    description: string;
    original: string;
    fixed: string;
    explanation: string;
  }>;
  acceptedHunkIds: number[];
  onToggleHunk: (id: number) => void;
  fixedCode: string;
  copyToClipboard: (text: string) => void;
  applyAllFixes: () => void;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  showDiff,
  setShowDiff,
  issues,
  acceptedHunkIds,
  onToggleHunk,
  fixedCode,
  copyToClipboard,
  applyAllFixes,
}) => {
  return (
    <AnimatePresence>
      {showDiff && (
        <div className="fixed inset-0 vol-veil flex items-center justify-center z-[var(--ds-z-modal)] p-6 select-text">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 15 }}
            transition={{ ease: [0.21, 0.92, 0.3, 1] }}
            className="w-full max-w-6xl vol-elev border vol-ring-strong rounded-3xl overflow-hidden"
          >
            <div className="px-8 py-5 border-b vol-ring flex justify-between items-center select-none">
              <div className="font-bold text-2xl flex items-center gap-3">
                <AlertTriangle className="vol-accent" />
                SELECTIVE HUNK DIFF PREVIEW & QUALITY CONSENSUS
              </div>
              <button onClick={() => setShowDiff(false)} className="cursor-pointer">
                <X />
              </button>
            </div>
            <div className="p-8">
              <VisualDiff
                issues={issues}
                acceptedHunkIds={acceptedHunkIds}
                onToggleHunk={onToggleHunk}
              />
            </div>
            <div className="p-8 flex justify-between items-center vol-panel border-t vol-ring select-none">
              <button
                onClick={() => copyToClipboard(fixedCode)}
                className="px-6 py-3 rounded-xl border vol-ring-strong hover:vol-wash vol-accent font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                COPY FIXED CODE
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDiff(false)}
                  className="px-6 py-3 rounded-xl border vol-line text-xs font-semibold cursor-pointer"
                >
                  CLOSE
                </button>
                <button
                  onClick={applyAllFixes}
                  className="px-9 py-3 rounded-xl vol-acc-bg text-black font-extrabold text-xs cursor-pointer shadow-[0_0_15px_rgba(255,95,0,0.3)]"
                >
                  APPLY ACCEPTED PATCHES ({acceptedHunkIds.length})
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ReportDrawerProps {
  showReport: boolean;
  setShowReport: (v: boolean) => void;
  issues: Array<{
    id: number;
    type: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    description: string;
    original: string;
    fixed: string;
    explanation: string;
  }>;
  fixedCode: string;
  copyToClipboard: (text: string) => void;
  downloadCode: (text: string, filename: string) => void;
}

export const ReportDrawer: React.FC<ReportDrawerProps> = ({
  showReport,
  setShowReport,
  issues,
  fixedCode,
  copyToClipboard,
  downloadCode,
}) => {
  return (
    <AnimatePresence>
      {showReport && (
        <div
          className="fixed inset-0 vol-veil z-[var(--ds-z-popover)] flex justify-end select-text"
          onClick={() => setShowReport(false)}
        >
          <motion.div
            initial={{ x: 80 }}
            animate={{ x: 0 }}
            exit={{ x: 80 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="w-full max-w-lg vol-elev h-full border-l vol-ring-strong overflow-auto flex flex-col"
          >
            <div className="sticky top-0 vol-elev p-8 border-b vol-ring-strong flex justify-between select-none">
              <div>
                <div className="font-bold text-xl">DETAILED DIAGNOSTICS</div>
                <div className="vol-accent text-sm font-bold">
                  ALL PATCHES APPLIED TO CODEBASE
                </div>
              </div>
              <button onClick={() => setShowReport(false)} className="cursor-pointer">
                <X />
              </button>
            </div>
            <div className="p-8 space-y-7 flex-1 overflow-y-auto">
              {issues.map((issue, index) => (
                <div key={index} className="border-l-4 vol-ring-strong pl-6">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-bold text-lg">{issue.type}</div>
                    <div
                      className={`px-3 py-px text-xs font-bold rounded ${
                        issue.severity === "Critical" ||
                        issue.severity === "High"
                          ? "vol-acc-bg text-black"
                          : "vol-wash vol-accent"
                      }`}
                    >
                      {issue.severity}
                    </div>
                  </div>
                  <div className="vol-accent mb-3">{issue.description}</div>
                  <div className="text-sm opacity-75 leading-snug mb-4">
                    {issue.explanation}
                  </div>
                  <div className="text-[10px] font-mono vol-well p-3 rounded overflow-x-auto">
                    FIX: {issue.fixed}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 flex gap-3 sticky bottom-0 vol-elev border-t vol-line select-none">
              <button
                onClick={() => copyToClipboard(fixedCode)}
                className="flex-1 flex justify-center gap-2 items-center py-3 border vol-ring-strong hover:vol-wash rounded-xl font-semibold cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                COPY CODE
              </button>
              <button
                onClick={() => downloadCode(fixedCode, `fixed-${Date.now()}.js`)}
                className="flex-1 flex justify-center gap-2 items-center py-3 vol-acc-bg text-black font-extrabold rounded-xl cursor-pointer"
              >
                <Download className="w-4 h-4" />
                DOWNLOAD
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ShortcutsModalProps {
  showShortcutsCheatSheet: boolean;
  setShowShortcutsCheatSheet: (v: boolean) => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  showShortcutsCheatSheet,
  setShowShortcutsCheatSheet,
}) => {
  return (
    <AnimatePresence>
      {showShortcutsCheatSheet && (
        <div className="fixed inset-0 vol-veil z-[var(--ds-z-tooltip)] flex items-center justify-center p-6 select-text">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md vol-elev border vol-ring-strong p-8 rounded-3xl space-y-6"
          >
            <div className="flex justify-between items-center border-b vol-ring pb-4 select-none">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <HelpCircle className="vol-accent" />
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowShortcutsCheatSheet(false)}
                className="cursor-pointer"
              >
                <X />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { keys: "Ctrl + Enter", action: "Run AI Code Analysis" },
                { keys: "Ctrl + Shift + F", action: "Apply All Fixed Patches" },
                { keys: "Ctrl + /", action: "Toggle Sentinel Live Board" },
                { keys: "Ctrl + K", action: "Focus Model Dropdown" },
                { keys: "Escape", action: "Close Modals / Panels" },
                { keys: "?", action: "Toggle this Shortcuts Guide" },
              ].map((s, idx) => (
                <div key={idx} className="flex justify-between py-1.5 border-b vol-line">
                  <span className="vol-t2">{s.action}</span>
                  <kbd className="px-2 py-0.5 vol-acc-wash border vol-ring-strong vol-accent font-mono text-xs rounded-md">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface LangAlertModalProps {
  showLangAlert: boolean;
  setShowLangAlert: (v: boolean) => void;
}

export const LangAlertModal: React.FC<LangAlertModalProps> = ({
  showLangAlert,
  setShowLangAlert,
}) => {
  return (
    <AnimatePresence>
      {showLangAlert && (
        <div className="fixed inset-0 vol-veil z-[var(--ds-z-popover)] flex items-center justify-center p-6 select-text">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md vol-elev border border-red-500 p-8 rounded-3xl space-y-6"
          >
            <div className="flex justify-between items-center border-b border-red-500/25 pb-4 select-none">
              <h3 className="font-bold text-xl flex items-center gap-2 text-red-500">
                <AlertTriangle />
                Language not updated in system
              </h3>
              <button
                onClick={() => setShowLangAlert(false)}
                className="cursor-pointer vol-t2 hover:vol-t1"
              >
                <X />
              </button>
            </div>
            <div className="text-sm vol-t1 leading-relaxed font-mono">
              The analysis engine could not auto-detect the programming
              language of the active editor code. Please explicitly select the
              language from the dropdown menu (e.g. JavaScript, Python, C++,
              HTML, YAML, CSS) before running diagnostics.
            </div>
            <div className="flex justify-end gap-3 pt-4 select-none">
              <button
                onClick={() => setShowLangAlert(false)}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 vol-t1 font-bold rounded-xl cursor-pointer transition-all"
              >
                OK
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface LoginModalProps {
  showLoginModal: boolean;
  setShowLoginModal: (v: boolean) => void;
  loginMode: "login" | "register";
  setLoginMode: (v: "login" | "register") => void;
  loginError: string;
  setLoginError: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  handleLogin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  showLoginModal,
  setShowLoginModal,
  loginMode,
  setLoginMode,
  loginError,
  setLoginError,
  username,
  setUsername,
  loginPassword,
  setLoginPassword,
  handleLogin,
}) => {
  return (
    <AnimatePresence>
      {showLoginModal && (
        <div className="fixed inset-0 vol-veil z-[var(--ds-z-modal)] flex items-center justify-center select-text">
          <div className="vol-elev border vol-ring-strong w-full max-w-xl p-9 rounded-3xl max-h-[90vh] overflow-y-auto">
            <div className="font-bold text-center text-2xl mb-2 select-none flex justify-between items-center">
              {loginMode === "register" ? "CREATE ACCOUNT" : "SIGN IN"}
              <button
                onClick={() => setShowLoginModal(false)}
                className="cursor-pointer vol-t2 hover:vol-t1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center text-sm mb-6 vol-accent-soft select-none">
              Secure login — your data and keys stay protected
            </div>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setLoginMode("login");
                  setLoginError("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  loginMode === "login"
                    ? "vol-acc-bg text-black"
                    : "vol-wash vol-t2 hover:vol-wash"
                }`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => {
                  setLoginMode("register");
                  setLoginError("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  loginMode === "register"
                    ? "vol-acc-bg text-black"
                    : "vol-wash vol-t2 hover:vol-wash"
                }`}
              >
                CREATE ACCOUNT
              </button>
            </div>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full vol-well border vol-ring-strong py-3 px-4 mb-3 rounded-xl focus:outline-none focus:vol-ring-hi"
              placeholder="Username"
              autoComplete="username"
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full vol-well border vol-ring-strong py-3 px-4 mb-3 rounded-xl focus:outline-none focus:vol-ring-hi"
              placeholder="Password (min 8 characters)"
              autoComplete={loginMode === "register" ? "new-password" : "current-password"}
            />
            {loginError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-3">
                {loginError}
              </div>
            )}
            <button
              onClick={handleLogin}
              className="w-full py-3 vol-acc-bg text-black font-bold rounded-xl cursor-pointer"
            >
              {loginMode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
