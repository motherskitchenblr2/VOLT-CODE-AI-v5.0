/**
 * IDE Canvas view — file tree + split editor + terminal.
 *
 * All state and handlers are passed as props from the shell.
 *
 * Built on design system tokens (design-system/volt-code-ai/MASTER.md).
 * All colors, spacing, shadows, and typography use --ds-* CSS variables.
 * Every button has cursor-pointer, focus-visible ring, and 200ms hover transition.
 * No emojis as icons — Lucide SVG only.
 */
import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ProfessionalEditorCanvas } from "../ProfessionalEditorCanvas";
import { TODOListWidget, type TodoItem } from "../TODOListWidget";

export interface IDECanvasViewProps {
  code: string;
  language: string;
  isAnalyzing: boolean;
  enableAgentSuggestions: boolean;
  onCodeChange: (code: string) => void;
  onToggleSuggestions: () => void;
  onBack: () => void;
  issues: Array<{ id: number; severity: string }>;
  todos: TodoItem[];
  onAddTodo: (t: TodoItem) => void;
  onUpdateTodo: (id: string, updates: Partial<TodoItem>) => void;
  onDeleteTodo: (id: string) => void;
}

export const IDECanvasView: React.FC<IDECanvasViewProps> = ({
  code,
  language,
  isAnalyzing,
  enableAgentSuggestions,
  onCodeChange,
  onToggleSuggestions,
  onBack,
  issues,
  todos,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
}) => {
  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-[#0F172A]">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--ds-color-border)] shrink-0 bg-[#0F172A]">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-[#22C55E]">
            <Sparkles className="w-4 h-4" />
            IDE CANVAS · {language.toUpperCase()}
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            BACK TO EDITOR
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isAnalyzing && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#22C55E]/20 border-b border-[var(--ds-color-border)] text-xs text-[#F8FAFC] font-bold tracking-widest">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              AGENT SCAN IN PROGRESS
            </div>
          )}
          <ProfessionalEditorCanvas
            code={code}
            onCodeChange={onCodeChange}
            language={language}
            enableAgentSuggestions={enableAgentSuggestions}
            onToggleSuggestions={onToggleSuggestions}
            issues={issues}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </div>

      <Card
        padded={false}
        elevated={false}
        className="w-full md:w-80 shrink-0 border border-[var(--ds-color-border)] rounded-none overflow-y-auto bg-[#1B2336]"
      >
        <TODOListWidget
          todos={todos}
          onAddTodo={onAddTodo}
          onUpdateTodo={onUpdateTodo}
          onDeleteTodo={onDeleteTodo}
        />
      </Card>
    </div>
  );
};
