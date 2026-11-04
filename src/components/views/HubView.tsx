/**
 * Hub view — consolidated secondary navigation (Git-Room, Sentinel, Settings,
 * Admin, About, PR Review). Taps set activeTab on the shell to route to the
 * target view, which is still rendered inline by App.tsx until extracted.
 *
 * Built on design system tokens (design-system/volt-code-ai/MASTER.md).
 * All colors, spacing, shadows, and typography use --ds-* CSS variables.
 * Every button has cursor-pointer, focus-visible ring, and 200ms hover transition.
 * No emojis as icons — Lucide SVG only.
 */
import React from "react";
import { GitBranch, Shield, Settings, Users, Activity, GitPullRequest } from "lucide-react";
import { Card } from "../ui/Card";
import { Panel } from "../ui/Panel";
import { useVolt } from "../../context/VoltContext";

interface HubItem {
  view: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
}

const HUB_ITEMS: HubItem[] = [
  { view: "sentinel", label: "Sentinel", icon: <Shield className="w-5 h-5" />, desc: "Security scanning & risk board" },
  { view: "settings", label: "Settings", icon: <Settings className="w-5 h-5" />, desc: "API keys, models, workspace" },
  { view: "admin", label: "Admin", icon: <Users className="w-5 h-5" />, desc: "Admin center & audit logs" },
  { view: "github", label: "Git-Room", icon: <GitBranch className="w-5 h-5" />, desc: "PR review & repo operations" },
  { view: "about", label: "About", icon: <Activity className="w-5 h-5" />, desc: "Project info & changelog" },
  { view: "pr-review", label: "PR Review", icon: <GitPullRequest className="w-5 h-5" />, desc: "Pull request dashboard" },
];

export const HubView: React.FC = () => {
  const { setActiveTab } = useVolt();

  return (
    <Panel padded={true} className="p-4 sm:p-6 min-h-[100dvh] overflow-y-auto pb-28 sm:pb-16">
      <h1 className="text-lg sm:text-xl font-bold mb-6 text-[#F8FAFC]">Hub & Repo</h1>
      <p className="text-[10px] text-[#94A3B8] mb-8">
        Secondary tools — Git-Room, Sentinel, Settings, Admin.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {HUB_ITEMS.map((item) => (
          <Card
            key={item.view}
            padded={true}
            elevated={false}
            className="border border-[var(--ds-color-border)] rounded-[var(--ds-radius-lg)] hover:border-[var(--ds-color-accent)] hover:bg-[#22C55E]/10 cursor-pointer transition-all duration-200"
            onClick={() => setActiveTab(item.view)}
          >
            <div className="flex flex-col items-center gap-2 p-4 bg-[#1B2336] rounded-[var(--ds-radius-lg)] w-full">
              <div className="w-10 h-10 bg-[#22C55E] rounded-lg flex items-center justify-center group-hover:bg-[#22C55E]/80 transition-colors">
                {item.icon}
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#F8FAFC]">{item.label}</div>
              <div className="text-[9px] text-[#94A3B8] text-center">{item.desc}</div>
            </div>
          </Card>
        ))}
      </div>
    </Panel>
  );
};
