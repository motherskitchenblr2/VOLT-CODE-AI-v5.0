import React, { useState, useCallback, useEffect } from "react";
import { Lightbulb, Copy, Check } from "lucide-react";

interface AgentSuggestion {
  line: number;
  suggestion: string;
  type: "optimization" | "bug" | "style" | "performance";
}

interface ProfessionalEditorCanvasProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  enableAgentSuggestions: boolean;
  onToggleSuggestions: (enabled: boolean) => void;
  agentSuggestions?: AgentSuggestion[];
  issues?: unknown[];
  isAnalyzing?: boolean;
}

export const ProfessionalEditorCanvas: React.FC<
  ProfessionalEditorCanvasProps
> = ({
  code,
  onCodeChange,
  language,
  enableAgentSuggestions,
  onToggleSuggestions,
  agentSuggestions = [],
  isAnalyzing = false,
}) => {
  const [copiedSuggestion, setCopiedSuggestion] = useState<number | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Generate agent suggestions based on code analysis
  const generateAgentSuggestions = useCallback(async () => {
    if (!enableAgentSuggestions || !code) return;

    const lines = code.split("\n");
    const suggestions: AgentSuggestion[] = [];

    // Simple suggestion logic - can be enhanced with AI
    lines.forEach((line, index) => {
      if (line.includes("var ")) {
        suggestions.push({
          line: index + 1,
          suggestion: 'Replace "var" with "const" or "let" for better scoping',
          type: "style",
        });
      }
      if (line.includes("==")) {
        suggestions.push({
          line: index + 1,
          suggestion: 'Use "===" for strict equality comparison',
          type: "style",
        });
      }
      if (line.length > 120) {
        suggestions.push({
          line: index + 1,
          suggestion: "Line is too long (>120 chars). Consider breaking it up",
          type: "style",
        });
      }
    });

    // Update parent with suggestions
  }, [code, enableAgentSuggestions]);

  useEffect(() => {
    generateAgentSuggestions();
  }, [code, enableAgentSuggestions, generateAgentSuggestions]);

  const handleCopySuggestion = (idx: number, suggestion: string) => {
    navigator.clipboard.writeText(suggestion);
    setCopiedSuggestion(idx);
    setTimeout(() => setCopiedSuggestion(null), 2000);
  };

  const lineNumbers = code.split("\n").map((_, i) => i + 1);

  return (
    <div className="flex h-full gap-0 vol-surface">
      {/* Line Numbers */}
      <div className="flex flex-col vol-surface border-r vol-line py-4 px-2 select-none overflow-hidden">
        {lineNumbers.map((num) => (
          <div
            key={num}
            className="h-6 text-right pr-3 vol-t2 text-xs font-mono leading-6"
          >
            {num}
          </div>
        ))}
      </div>

      {/* Editor with Column Lines */}
      <div className="flex-1 flex flex-col vol-surface relative">
        {/* Column Guidelines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 79px,
              #111111 79px,
              #111111 80px
            )`,
            backgroundPosition: "0 0",
          }}
        />

        {/* Editor Header with Toggle */}
        <div className="flex items-center justify-between px-4 py-2 vol-surface border-b vol-line z-10">
          <div className="text-xs vol-t2 font-mono">
            {language.toUpperCase()} • {code.split("\n").length} lines
          </div>

          <button
            onClick={() => onToggleSuggestions(!enableAgentSuggestions)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              enableAgentSuggestions
                ? "bg-blue-600 vol-t1"
                : "vol-elev vol-t2 hover:vol-elev"
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            {enableAgentSuggestions ? "Suggestions ON" : "Suggestions OFF"}
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="flex-1 vol-surface vol-t1 font-mono text-sm resize-none outline-none px-4 py-4 relative z-20 overflow-hidden"
          style={{
            backgroundAttachment: "local",
            backgroundImage: `linear-gradient(
              to right,
              #111111 0.5px,
              transparent 0.5px
            )`,
            backgroundSize: "80px 1em",
            backgroundPosition: "4px 4px",
            lineHeight: "1.5em",
            letterSpacing: "0.5px",
          }}
          spellCheck="false"
        />
      </div>

      {/* Agent Suggestions Panel - AMOLED Black */}
      {enableAgentSuggestions && (
        <div className="w-96 vol-surface border-l vol-line flex flex-col overflow-hidden">
          {/* Suggestions Header */}
          <div className="px-4 py-3 border-b vol-line vol-surface">
            <h3 className="text-sm font-semibold vol-t1 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-blue-500" />
              AI Agent Suggestions
            </h3>
            <p className="text-xs vol-t2 mt-1">
              {agentSuggestions.length} active suggestions
            </p>
          </div>

          {/* Suggestions List */}
          <div className="flex-1 overflow-y-auto">
            {agentSuggestions.length > 0 ? (
              <div className="space-y-2 p-3">
                {agentSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-3 vol-surface border vol-line rounded-lg hover:vol-line transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-mono vol-t2">
                          Line {suggestion.line}
                        </p>
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded mt-1 ${
                            suggestion.type === "bug"
                              ? "bg-red-900/30 text-red-400"
                              : suggestion.type === "performance"
                                ? "bg-yellow-900/30 text-yellow-400"
                                : suggestion.type === "optimization"
                                  ? "bg-green-900/30 text-green-400"
                                  : "bg-blue-900/30 text-blue-400"
                          }`}
                        >
                          {suggestion.type}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleCopySuggestion(idx, suggestion.suggestion)
                        }
                        className="p-1 hover:vol-elev rounded transition-colors"
                      >
                        {copiedSuggestion === idx ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 vol-t2" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs vol-t2 leading-relaxed">
                      {suggestion.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center px-4">
                <p className="text-xs vol-t2">
                  {isAnalyzing ? "Analyzing code..." : "No suggestions yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
