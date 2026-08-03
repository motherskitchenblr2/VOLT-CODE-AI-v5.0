import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  User,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  dueDate?: Date;
  linkedMeeting?: string;
  linkedIssue?: string;
  subtasks?: TodoItem[];
}

interface TODOListWidgetProps {
  todos: TodoItem[];
  onAddTodo: (todo: TodoItem) => void;
  onUpdateTodo: (id: string, updates: Partial<TodoItem>) => void;
  onDeleteTodo: (id: string) => void;
  agents?: string[];
}

export function TODOListWidget({
  todos,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  agents = [],
}: TODOListWidgetProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<
    "low" | "medium" | "high" | "critical"
  >("medium");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "in-progress" | "completed" | "blocked"
  >("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredTodos = todos.filter(
    (todo) => filterStatus === "all" || todo.status === filterStatus,
  );

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.status === "completed").length,
    inProgress: todos.filter((t) => t.status === "in-progress").length,
    blocked: todos.filter((t) => t.status === "blocked").length,
  };

  const handleAddTodo = () => {
    if (!newTitle.trim()) return;

    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      title: newTitle,
      status: "pending",
      priority: newPriority,
      subtasks: [],
    };

    onAddTodo(newTodo);
    setNewTitle("");
    setNewPriority("medium");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "in-progress":
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case "blocked":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Circle className="w-5 h-5 text-white/40" />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#FF5F00]/20 rounded-2xl">
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-[#FF5F00]" />
            TODO List
          </h2>
          <div className="text-xs text-white/50 font-semibold">
            {stats.completed}/{stats.total} completed
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
          <motion.div
            animate={{
              width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
            }}
            transition={{ type: "spring", stiffness: 100 }}
            className="h-full bg-gradient-to-r from-green-500 to-[#FF5F00]"
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: stats.total, color: "text-white" },
            {
              label: "Active",
              value: stats.inProgress,
              color: "text-yellow-400",
            },
            { label: "Done", value: stats.completed, color: "text-green-400" },
            { label: "Blocked", value: stats.blocked, color: "text-red-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-2 bg-black/40 border border-white/10 rounded-lg text-center"
            >
              <div className={`text-lg font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[10px] text-white/40 uppercase font-bold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Todo */}
      <div className="space-y-3 p-4 bg-black/40 border border-[#FF5F00]/20 rounded-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
            placeholder="Add a new task..."
            className="flex-1 bg-black border border-white/10 px-3 py-2 rounded-lg text-sm text-white focus:border-[#FF5F00]/40 outline-none"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
            className="px-3 py-2 bg-black border border-white/10 rounded-lg text-sm text-white focus:border-[#FF5F00]/40 outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button
            onClick={handleAddTodo}
            className="px-4 py-2 bg-[#FF5F00] hover:bg-[#FF5F00]/90 text-black font-bold rounded-lg flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(
          ["all", "pending", "in-progress", "completed", "blocked"] as const
        ).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              filterStatus === status
                ? "bg-[#FF5F00] text-black"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {status.replace("-", " ").toUpperCase()}
          </button>
        ))}
      </div>

      {/* Todos List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredTodos.length === 0 ? (
            <div className="text-center py-8 text-white/40 text-sm">
              No tasks in this category
            </div>
          ) : (
            filteredTodos.map((todo, idx) => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: idx * 0.05 }}
                className="border border-white/10 rounded-lg p-3 bg-black/40 hover:bg-black/60 transition-all cursor-pointer group"
                onClick={() =>
                  setExpandedId(expandedId === todo.id ? null : todo.id)
                }
              >
                {/* Todo Item Header */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newStatus =
                        todo.status === "completed"
                          ? "pending"
                          : todo.status === "pending"
                            ? "in-progress"
                            : "completed";
                      onUpdateTodo(todo.id, { status: newStatus });
                    }}
                    className="flex-shrink-0"
                  >
                    {getStatusIcon(todo.status)}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold text-sm ${
                        todo.status === "completed"
                          ? "text-white/40 line-through"
                          : "text-white"
                      }`}
                    >
                      {todo.title}
                    </h3>
                    {todo.description && (
                      <p className="text-xs text-white/40 mt-1 line-clamp-1">
                        {todo.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(todo.priority)}`}
                    >
                      {todo.priority.charAt(0).toUpperCase()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTodo(todo.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === todo.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-white/10 space-y-2"
                    >
                      {todo.assignedTo && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <User className="w-3 h-3" />
                          Assigned: {todo.assignedTo}
                        </div>
                      )}
                      {todo.dueDate && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Calendar className="w-3 h-3" />
                          Due: {todo.dueDate.toLocaleDateString()}
                        </div>
                      )}
                      {todo.linkedIssue && (
                        <div className="text-xs text-blue-400">
                          Linked Issue: #{todo.linkedIssue}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
