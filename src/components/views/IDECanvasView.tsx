/**
 * IDE Canvas view — file tree + split editor + terminal.
 * Receives editor state and handlers as props from the shell.
 */
import React from "react";
import { ProfessionalEditorCanvas } from "../ProfessionalEditorCanvas";
import { TODOListWidget, type TodoItem } from "../TODOListWidget";
import { Sparkles } from "lucide-react";

interface IDECanvasViewProps {
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
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden vol-surface">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b vol-ring shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest vol-accent">
            <Sparkles className="w-4 h-4" />
            IDE CANVAS · {language.toUpperCase()}
          </div>
          <button
            onClick={onBack}
            className="text-[10px] font-bold vol-t2 hover:vol-t1 px-3 py-1.5 rounded-lg vol-wash hover:vol-wash"
          >
            BACK TO EDITOR
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isAnalyzing && (
            <div className="flex items-center gap-2 px-4 py-1.5 vol-acc-wash border-b vol-ring text-[10px] font-bold tracking-widest vol-accent">
              <span className="w-2 h-2 rounded-full vol-acc-bg animate-ping" />
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

      <div className="w-full md:w-80 shrink-0 border-l vol-ring vol-panel overflow-y-auto">
        <TODOListWidget
          todos={todos}
          onAddTodo={onAddTodo}
          onUpdateTodo={onUpdateTodo}
          onDeleteTodo={onDeleteTodo}
        />
      </div>
    </div>
  );
};
