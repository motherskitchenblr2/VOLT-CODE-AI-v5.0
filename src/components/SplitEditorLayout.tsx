import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Eye, GitCompare, FileText, CheckCircle2 } from 'lucide-react';

interface SplitEditorLayoutProps {
  code: string;
  onCodeChange: (code: string) => void;
  fixedCode?: string;
  issues: any[];
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
  isAnalyzing,
  onAnalyze,
  onApplyFix,
  language
}: SplitEditorLayoutProps) {
  const [rightPanel, setRightPanel] = useState<'preview' | 'comparison' | 'notepad' | 'review'>('preview');
  const [notes, setNotes] = useState('');
  const [dividerPos, setDividerPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  
  const handleMouseUp = () => setIsDragging(false);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = (e.currentTarget as HTMLDivElement);
    const rect = container.getBoundingClientRect();
    const newPos = Math.max(30, Math.min(70, ((e.clientX - rect.left) / rect.width) * 100));
    setDividerPos(newPos);
  };

  return (
    <div 
      className="flex h-[calc(100vh-400px)] gap-0 bg-[#0A0A0A] rounded-2xl border border-[#FF5F00]/20 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left Panel - Code Editor (50%+ height) */}
      <div style={{ width: `${dividerPos}%` }} className="flex flex-col overflow-hidden bg-[#0A0A0A]">
        <div className="border-b border-[#FF5F00]/20 px-6 py-3 bg-[#121212] flex items-center justify-between">
          <div className="text-xs font-bold text-[#FF5F00] uppercase tracking-wider">Code Editor</div>
          <div className="text-[10px] text-white/40 font-mono">{language}</div>
        </div>
        
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full resize-none bg-transparent p-6 font-mono text-[13px] leading-[1.65] outline-none text-[#EDEDED] caret-[#FF5F00]"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            boxShadow: 'inset 0 0 0 1px rgba(255,95,0,0.05)'
          }}
        />
      </div>

      {/* Draggable Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 bg-[#FF5F00]/20 hover:bg-[#FF5F00]/40 cursor-col-resize transition-colors"
      />

      {/* Right Panel - Preview/Comparison/Notepad/Review */}
      <div style={{ width: `${100 - dividerPos}%` }} className="flex flex-col overflow-hidden bg-[#0A0A0A]">
        {/* Tab Navigation */}
        <div className="border-b border-[#FF5F00]/20 px-4 py-2 bg-[#121212] flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'comparison', label: 'Comparison', icon: GitCompare },
            { id: 'notepad', label: 'Notepad', icon: FileText },
            { id: 'review', label: 'Review', icon: CheckCircle2 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setRightPanel(id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                rightPanel === id
                  ? 'bg-[#FF5F00] text-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {rightPanel === 'preview' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#FF5F00] uppercase tracking-wider mb-4">Live Preview</div>
              <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-white/70 font-mono">
                <pre>{code.slice(0, 500)}</pre>
                {code.length > 500 && <div className="text-white/30 text-xs mt-2">... ({code.length} characters)</div>}
              </div>
            </div>
          )}

          {rightPanel === 'comparison' && fixedCode && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#FF5F00] uppercase tracking-wider mb-4">Code Comparison</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-white/10 rounded-lg p-3 bg-black/40">
                  <div className="text-[10px] text-white/50 mb-2">Original</div>
                  <pre className="text-[11px] text-white/60 max-h-48 overflow-auto">{code.slice(0, 250)}</pre>
                </div>
                <div className="border border-green-500/20 rounded-lg p-3 bg-green-500/5">
                  <div className="text-[10px] text-green-400 mb-2">Fixed</div>
                  <pre className="text-[11px] text-green-300 max-h-48 overflow-auto">{fixedCode.slice(0, 250)}</pre>
                </div>
              </div>
            </div>
          )}

          {rightPanel === 'notepad' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-[#FF5F00] uppercase tracking-wider mb-4">Quick Notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes, TODOs, or observations..."
                className="w-full h-64 bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white/80 focus:border-[#FF5F00]/40 outline-none resize-none"
              />
            </div>
          )}

          {rightPanel === 'review' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-[#FF5F00] uppercase tracking-wider mb-4">Code Review</div>
              <div className="space-y-3">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-xs font-bold text-red-400 mb-1">Issues Found: {issues.length}</div>
                  <div className="text-xs text-red-300/80">{issues.slice(0, 3).map(i => i.description).join(', ')}</div>
                </div>
                {fixedCode && (
                  <button
                    onClick={onApplyFix}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
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
