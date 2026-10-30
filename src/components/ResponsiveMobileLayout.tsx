import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Code,
  Eye,
  GitCompare,
  FileText,
  CheckCircle2,
  Users,
  GitPullRequest,
  Crown,
  Plus,
} from "lucide-react";

interface ResponsiveMobileLayoutProps {
  code: string;
  onCodeChange: (code: string) => void;
  children?: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  isMobile: boolean;
}

export function ResponsiveMobileLayout({
  code,
  onCodeChange,
  children,
  currentView,
  onViewChange,
  isMobile,
}: ResponsiveMobileLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "code" | "preview" | "compare" | "notes"
  >("code");
  const [notes, setNotes] = useState("");
  const [showTodo, setShowTodo] = useState(false);

  if (!isMobile) {
    return <>{children}</>;
  }

  // Mobile Bottom Navigation Icons
  const bottomNavItems = [
    { id: "editor", label: "Editor", icon: Code, view: "editor" },
    { id: "meeting", label: "Meeting", icon: Users, view: "meeting" },
    { id: "pr", label: "PR Review", icon: GitPullRequest, view: "pr-review" },
    { id: "boss", label: "Boss", icon: Crown, view: "boss" },
    { id: "more", label: "More", icon: Menu, view: null },
  ];

  return (
    <div className="h-screen flex flex-col vol-surface overflow-hidden">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 vol-elev border-b vol-ring px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 vol-acc-bg rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-xs vol-t2 font-bold">VOLT CODE AI</div>
            <div className="text-xs font-bold vol-accent">Mobile View</div>
          </div>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 hover:vol-wash rounded-lg transition-all"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Hamburger Menu (Mobile) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="vol-elev border-b vol-ring overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {[
                { label: "New Analysis", view: "editor" },
                { label: "History", view: "history" },
                { label: "Sentinel", view: "sentinel" },
                { label: "GitHub", view: "github" },
                { label: "Settings", view: "settings" },
                { label: "Admin", view: "admin" },
              ].map((item) => (
                <button
                  key={item.view}
                  onClick={() => {
                    onViewChange(item.view);
                    setMenuOpen(false);
                  }}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all text-left ${
                    currentView === item.view
                      ? "vol-acc-bg text-black"
                      : "vol-t1 hover:vol-wash"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area - Vertical Stack */}
      <div className="flex-1 overflow-y-auto pb-32 space-y-4 p-4">
        {/* Code Editor Section */}
        <div className="vol-elev border vol-ring rounded-xl overflow-hidden">
          {/* Tab Selection */}
          <div className="flex gap-1 p-2 vol-surface border-b vol-ring">
            {[
              { id: "code", label: "Code", icon: Code },
              { id: "preview", label: "Preview", icon: Eye },
              { id: "compare", label: "Compare", icon: GitCompare },
              { id: "notes", label: "Notes", icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() =>
                  setActiveTab(id as "code" | "preview" | "compare" | "notes")
                }
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === id
                    ? "vol-acc-bg text-black"
                    : "vol-t2 hover:vol-t1"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-3">
            {activeTab === "code" && (
              <textarea
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                spellCheck={false}
                className="w-full h-48 vol-panel border vol-line rounded-lg p-3 font-mono text-xs vol-t1 caret-[#FF5F00] focus:vol-ring-hi outline-none resize-none"
                style={{
                  fontFamily:
                    "ui-monospace, Menlo, Monaco, Consolas, monospace",
                }}
              />
            )}

            {activeTab === "preview" && (
              <div className="vol-panel border vol-line rounded-lg p-3 text-xs vol-t1 max-h-48 overflow-auto">
                <pre className="font-mono whitespace-pre-wrap break-words">
                  {code.slice(0, 300)}
                </pre>
              </div>
            )}

            {activeTab === "compare" && (
              <div className="space-y-2">
                <div className="text-[10px] vol-t2 font-bold">
                  Original
                </div>
                <div className="vol-panel border vol-line rounded-lg p-2 font-mono text-[10px] vol-t2 max-h-20 overflow-auto">
                  {code.slice(0, 150)}...
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Quick notes..."
                className="w-full h-32 vol-panel border vol-line rounded-lg p-3 text-xs vol-t1 focus:vol-ring-hi outline-none resize-none"
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 p-3 border-t vol-ring">
            <button className="py-2 vol-well border vol-ring-strong vol-accent text-xs font-bold rounded-lg hover:vol-acc-wash transition-all">
              Analyze
            </button>
            <button className="py-2 vol-acc-bg text-black text-xs font-bold rounded-lg hover:vol-accbg-hi transition-all">
              Fix
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Issues", value: 5, color: "text-red-400" },
            { label: "Warnings", value: 3, color: "text-yellow-400" },
            { label: "Health", value: "78%", color: "text-green-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-3 vol-panel border vol-line rounded-lg text-center"
            >
              <div className={`text-lg font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[10px] vol-t2 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* TODOs Section */}
        <div className="vol-elev border vol-ring rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold vol-accent">TODOs</div>
            <button
              onClick={() => setShowTodo(!showTodo)}
              className="p-1.5 hover:vol-wash rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showTodo && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="New task..."
                className="flex-1 vol-panel border vol-line px-3 py-2 rounded-lg text-xs vol-t1 focus:vol-ring-hi outline-none"
              />
              <button className="px-3 py-2 vol-acc-bg text-black text-xs font-bold rounded-lg">
                Add
              </button>
            </div>
          )}

          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 vol-panel rounded-lg"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <div className="flex-1 text-xs vol-t1">Task {i}</div>
                <span className="text-[9px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                  High
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 vol-elev border-t vol-ring px-2 py-2 flex gap-1 justify-around">
        {bottomNavItems.map(({ id, label, icon: Icon, view }) => (
          <button
            key={id}
            onClick={() => {
              if (view) onViewChange(view);
              if (id === "more") setMenuOpen(!menuOpen);
            }}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[9px] font-bold transition-all ${
              (view && currentView === view) || (id === "more" && menuOpen)
                ? "vol-acc-wash vol-accent"
                : "vol-t2 hover:vol-t2"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
