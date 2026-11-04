/**
 * Hub view — consolidated secondary navigation (Git-Room, Sentinel, Settings,
 * Admin, About, PR Review). Taps set activeTab on the shell to route to the
 * target view, which is still rendered inline by App.tsx until extracted.
 */
import React from "react";
import { useVolt } from "../../context/VoltContext";
import {
  GitBranch,
  Shield,
  Settings,
  Users,
  Activity,
  GitPullRequest,
} from "lucide-react";

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
    <div className="p-4 sm:p-6 min-h-[100dvh] overflow-y-auto pb-28 sm:pb-16 vol-surface">
      <h1 className="text-lg sm:text-xl font-bold mb-6 vol-t1">Hub & Repo</h1>
      <p className="text-[10px] vol-t2 mb-8">
        Secondary tools — Git-Room, Sentinel, Settings, Admin.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {HUB_ITEMS.map((item) => (
          <button
            key={item.view}
            onClick={() => setActiveTab(item.view)}
            className="flex flex-col items-center gap-2 p-4 vol-panel border vol-ring rounded-xl hover:vol-ring-hi transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 vol-acc-bg rounded-lg flex items-center justify-center group-hover:vol-acc-wash transition-colors">
              {item.icon}
            </div>
            <div className="text-xs sm:text-sm font-bold vol-t1">{item.label}</div>
            <div className="text-[9px] vol-t2 text-center">{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
