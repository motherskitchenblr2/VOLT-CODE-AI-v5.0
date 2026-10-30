import React, { useState } from "react";
import { Eye, GitCompare, FileText, CheckCircle2 } from "lucide-react";
import { HunkIssue } from "./VisualDiff";

interface SplitEditorLayoutProps {
  code: string;
  onCodeChange: (code: string) => void;
  fixedCode?: string;
  issues: HunkIssue[];
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onApplyFix: () => void;
  language: string;
}

export function SplitEditorLayout({
  code,
  onCodeChange,
  fixedCode,
  issues,
  isAnalyzing: _isAnalyzing,
  onAnalyze: _onAnalyze,
  onApplyFix,
  language,
}: SplitEditorLayoutProps) {
  const [rightPanel, setRightPanel] = useState<
    "preview" | "comparison" | "notepad" | "review"
  >("preview");
  const [notes, setNotes] = useState("");
  const [dividerPos, setDividerPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);

  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = e.currentTarget as HTMLDivElement;
    const rect = container.getBoundingClientRect();
    const newPos = Math.max(
      30,
      Math.min(70, ((e.clientX - rect.left) / rect.width) * 100),
    );
    setDividerPos(newPos);
  };

  return (
    <div
      className="flex h-[calc(100vh-400px)] gap-0 vol-surface rounded-2xl border vol-ring overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left Panel - Code Editor (50%+ height) */}
      <div
        style={{ width: `${dividerPos}%` }}
        className="flex flex-col overflow-hidden vol-surface"
      >
        <div className="border-b vol-ring px-6 py-3 vol-elev flex items-center justify-between">
          <div className="text-xs font-bold vol-accent uppercase tracking-wider">
            Code Editor
          </div>
          <div className="text-[10px] vol-t2 font-mono">{language}</div>
        </div>

        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full resize-none bg-transparent p-6 font-mono text-[13px] leading-[1.65] outline-none vol-t1 caret-[#FF5F00]"
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            boxShadow: "inset 0 0 0 1px rgba(255,95,0,0.05)",
          }}
        />
      </div>

      {/* Draggable Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 vol-acc-wash hover:vol-acc-wash cursor-col-resize transition-colors"
      />

      {/* Right Panel - Preview/Comparison/Notepad/Review */}
      <div
        style={{ width: `${100 - dividerPos}%` }}
        className="flex flex-col overflow-hidden vol-surface"
      >
        {/* Tab Navigation */}
        <div className="border-b vol-ring px-4 py-2 vol-elev flex items-center gap-1 overflow-x-auto">
          {[
            { id: "preview", label: "Preview", icon: Eye },
            { id: "comparison", label: "Comparison", icon: GitCompare },
            { id: "notepad", label: "Notepad", icon: FileText },
            { id: "review", label: "Review", icon: CheckCircle2 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() =>
                setRightPanel(
                  id as "preview" | "comparison" | "notepad" | "review",
                )
              }
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                rightPanel === id
                  ? "vol-acc-bg text-black"
                  : "vol-t2 hover:vol-t1 hover:vol-wash"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {rightPanel === "preview" && (
            <div className="space-y-4">
              <div className="text-xs font-bold vol-accent uppercase tracking-wider mb-4">
                Live Preview
              </div>
              <div className="vol-panel border vol-line rounded-lg p-4 text-sm vol-t1 font-mono">
                <pre>{code.slice(0, 500)}</pre>
                {code.length > 500 && (
                  <div className="vol-t2 text-xs mt-2">
                    ... ({code.length} characters)
                  </div>
                )}
              </div>
            </div>
          )}

          {rightPanel === "comparison" && fixedCode && (
            <div className="space-y-4">
              <div className="text-xs font-bold vol-accent uppercase tracking-wider mb-4">
                Code Comparison
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border vol-line rounded-lg p-3 vol-panel">
                  <div className="text-[10px] vol-t2 mb-2">Original</div>
                  <pre className="text-[11px] vol-t2 max-h-48 overflow-auto">
                    {code.slice(0, 250)}
                  </pre>
                </div>
                <div className="border border-green-500/20 rounded-lg p-3 bg-green-500/5">
                  <div className="text-[10px] text-green-400 mb-2">Fixed</div>
                  <pre className="text-[11px] text-green-300 max-h-48 overflow-auto">
                    {fixedCode.slice(0, 250)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {rightPanel === "notepad" && (
            <div className="space-y-3">
              <div className="text-xs font-bold vol-accent uppercase tracking-wider mb-4">
                Quick Notes
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes, TODOs, or observations..."
                className="w-full h-64 vol-panel border vol-line rounded-lg p-3 text-sm vol-t1 focus:vol-ring-hi outline-none resize-none"
              />
            </div>
          )}

          {rightPanel === "review" && (
            <div className="space-y-4">
              <div className="text-xs font-bold vol-accent uppercase tracking-wider mb-4">
                Code Review
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-xs font-bold text-red-400 mb-1">
                    Issues Found: {issues.length}
                  </div>
                  <div className="text-xs text-red-300/80">
                    {issues
                      .slice(0, 3)
                      .map((i) => i.description)
                      .join(", ")}
                  </div>
                </div>
                {fixedCode && (
                  <button
                    onClick={onApplyFix}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 vol-t1 text-xs font-bold rounded-lg transition-colors"
                  >
                    Apply Fixes
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
