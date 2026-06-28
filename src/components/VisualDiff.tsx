import React, { useState } from 'react';
import { Check, X, AlertTriangle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface HunkIssue {
  id: number;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  explanation: string;
  original: string;
  fixed: string;
}

interface VisualDiffProps {
  issues: HunkIssue[];
  acceptedHunkIds: number[];
  onToggleHunk: (id: number) => void;
}

export const VisualDiff: React.FC<VisualDiffProps> = ({
  issues,
  acceptedHunkIds,
  onToggleHunk
}) => {
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'inline'>('inline');
  const [expandedExplanation, setExpandedExplanation] = useState<Record<number, boolean>>({});

  const toggleExplanation = (id: number) => {
    setExpandedExplanation(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderInlineDiff = (original: string, fixed: string) => {
    const originalLines = original.split('\n');
    const fixedLines = fixed.split('\n');
    
    // Simplistic line-by-line diff mapping
    const elements: React.ReactNode[] = [];
    const maxLen = Math.max(originalLines.length, fixedLines.length);

    for (let i = 0; i < maxLen; i++) {
      const orig = originalLines[i];
      const fix = fixedLines[i];

      if (orig !== undefined && fix !== undefined) {
        if (orig === fix) {
          elements.push(
            <div key={`n-${i}`} className="flex py-0.5 px-3 hover:bg-white/5 font-mono text-[11px] text-white/50">
              <span className="w-8 select-none text-white/20 text-right pr-3">{i + 1}</span>
              <span className="w-8 select-none text-white/20 text-right pr-3">{i + 1}</span>
              <span className="w-5 select-none text-white/10 text-center font-bold"> </span>
              <span className="whitespace-pre-wrap">{orig}</span>
            </div>
          );
        } else {
          elements.push(
            <div key={`r-${i}`} className="flex py-0.5 px-3 bg-red-500/10 border-l-2 border-red-500 font-mono text-[11px] text-red-400">
              <span className="w-8 select-none text-red-500/30 text-right pr-3">{i + 1}</span>
              <span className="w-8 select-none text-red-500/10 text-right pr-3">-</span>
              <span className="w-5 select-none text-red-500/40 text-center font-bold">-</span>
              <span className="whitespace-pre-wrap">{orig}</span>
            </div>
          );
          elements.push(
            <div key={`a-${i}`} className="flex py-0.5 px-3 bg-green-500/10 border-l-2 border-green-500 font-mono text-[11px] text-green-400">
              <span className="w-8 select-none text-green-500/10 text-right pr-3">-</span>
              <span className="w-8 select-none text-green-500/30 text-right pr-3">{i + 1}</span>
              <span className="w-5 select-none text-green-500/40 text-center font-bold">+</span>
              <span className="whitespace-pre-wrap">{fix}</span>
            </div>
          );
        }
      } else if (orig !== undefined) {
        elements.push(
          <div key={`r-${i}`} className="flex py-0.5 px-3 bg-red-500/10 border-l-2 border-red-500 font-mono text-[11px] text-red-400">
            <span className="w-8 select-none text-red-500/30 text-right pr-3">{i + 1}</span>
            <span className="w-8 select-none text-red-500/10 text-right pr-3">-</span>
            <span className="w-5 select-none text-red-500/40 text-center font-bold">-</span>
            <span className="whitespace-pre-wrap">{orig}</span>
          </div>
        );
      } else if (fix !== undefined) {
        elements.push(
          <div key={`a-${i}`} className="flex py-0.5 px-3 bg-green-500/10 border-l-2 border-green-500 font-mono text-[11px] text-green-400">
            <span className="w-8 select-none text-green-500/10 text-right pr-3">-</span>
            <span className="w-8 select-none text-green-500/30 text-right pr-3">{i + 1}</span>
            <span className="w-5 select-none text-green-500/40 text-center font-bold">+</span>
            <span className="whitespace-pre-wrap">{fix}</span>
          </div>
        );
      }
    }

    return (
      <div className="bg-[#050505] border border-white/5 rounded-xl overflow-hidden py-2 max-h-72 overflow-y-auto">
        {elements}
      </div>
    );
  };

  const renderSideBySideDiff = (original: string, fixed: string) => {
    const originalLines = original.split('\n');
    const fixedLines = fixed.split('\n');

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Column */}
        <div className="space-y-1">
          <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider pl-1 mb-1">Original Code</div>
          <div className="bg-[#0B0303] border border-red-500/10 rounded-xl p-3 max-h-72 overflow-y-auto font-mono text-[11px] text-red-300 space-y-0.5">
            {originalLines.map((line, idx) => (
              <div key={idx} className="flex hover:bg-red-500/5 py-0.5 px-1 rounded">
                <span className="w-8 select-none text-red-500/30 text-right pr-2 shrink-0">{idx + 1}</span>
                <span className="whitespace-pre-wrap">{line || ' '}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Column */}
        <div className="space-y-1">
          <div className="text-[10px] text-green-400 font-bold uppercase tracking-wider pl-1 mb-1">Staged Patch</div>
          <div className="bg-[#030B03] border border-green-500/10 rounded-xl p-3 max-h-72 overflow-y-auto font-mono text-[11px] text-green-300 space-y-0.5">
            {fixedLines.map((line, idx) => (
              <div key={idx} className="flex hover:bg-green-500/5 py-0.5 px-1 rounded">
                <span className="w-8 select-none text-green-500/30 text-right pr-2 shrink-0">{idx + 1}</span>
                <span className="whitespace-pre-wrap">{line || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none">
      {/* Tab Control */}
      <div className="flex justify-between items-center bg-[#121212] border border-white/5 rounded-xl p-2 shrink-0">
        <div className="text-xs text-white/50 font-bold uppercase tracking-wider pl-2">
          Staged Changes ({issues.length} Hunks Available)
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDiffMode('inline')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
              diffMode === 'inline'
                ? 'bg-[#FF5F00] text-black'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Inline View
          </button>
          <button
            onClick={() => setDiffMode('side-by-side')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
              diffMode === 'side-by-side'
                ? 'bg-[#FF5F00] text-black'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Side-By-Side
          </button>
        </div>
      </div>

      {/* Issues list (Hunks) */}
      <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1">
        {issues.map(issue => {
          const isAccepted = acceptedHunkIds.includes(issue.id);
          const showExp = !!expandedExplanation[issue.id];

          return (
            <div
              key={issue.id}
              className={`border rounded-2xl overflow-hidden transition-all ${
                isAccepted 
                  ? 'border-[#FF5F00]/30 bg-black/35 shadow-[0_0_15px_rgba(255,95,0,0.02)]' 
                  : 'border-white/5 bg-[#121212]/30 opacity-75'
              }`}
            >
              {/* Hunk Header */}
              <div className="p-4 bg-[#121212] border-b border-white/5 flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-wider uppercase ${
                    issue.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    issue.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    issue.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {issue.severity}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-relaxed">{issue.type}</h4>
                    <p className="text-[10px] text-white/50 mt-0.5">{issue.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* AI Explanation Toggle */}
                  <button
                    onClick={() => toggleExplanation(issue.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-[10px] font-bold text-white/70 hover:text-white transition-all cursor-pointer"
                  >
                    {showExp ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showExp ? 'HIDE EXPLANATION' : 'EXPLANATION'}
                  </button>

                  {/* Accept/Reject Button */}
                  <button
                    onClick={() => onToggleHunk(issue.id)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                      isAccepted
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-red-600/20 text-red-400 border border-red-500/35 hover:bg-red-600/30'
                    }`}
                  >
                    {isAccepted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        ACCEPTED
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" />
                        REJECTED
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Diff Code Box */}
              <div className="p-4 bg-black/25">
                {diffMode === 'inline' 
                  ? renderInlineDiff(issue.original, issue.fixed)
                  : renderSideBySideDiff(issue.original, issue.fixed)
                }

                {/* AI Explanation Pane */}
                {showExp && (
                  <div className="mt-4 p-4 rounded-xl border border-[#FF5F00]/25 bg-[#FF5F00]/5 text-xs text-white/90 leading-relaxed font-mono space-y-2">
                    <div className="text-[9px] text-[#FF5F00] font-black uppercase tracking-wider">AI Explanation & Analysis</div>
                    <p className="whitespace-pre-line">{issue.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
