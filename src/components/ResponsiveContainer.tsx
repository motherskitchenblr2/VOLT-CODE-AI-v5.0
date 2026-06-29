import React, { useState } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  Zap, 
  Users, 
  Play, 
  History, 
  Settings, 
  Github, 
  Wrench, 
  HelpCircle, 
  RefreshCw 
} from 'lucide-react';

interface ResponsiveContainerProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  terminal: React.ReactNode;
  diagnostics: React.ReactNode;
  currentView: string;
  setCurrentView: (view: any) => void;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  sidebar,
  content,
  terminal,
  diagnostics,
  currentView,
  setCurrentView
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'performance' | 'activity'>('activity');

  const renderSkeuoCards = () => {
    return (
      <div className="space-y-4">
        {/* Card 1: Active Threats */}
        <div className="relative overflow-hidden machined-plate border-l-4 border-[#FF3B30] p-5 flex items-center justify-between red-neon-glow">
          <div className="space-y-1 z-10">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50">Active Threats</span>
            <div className="text-3xl font-black text-[#FF3B30]">3</div>
            <div className="flex items-center gap-1.5 text-xs text-[#FF3B30]/80 font-bold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-ping"></span>
              Declining
            </div>
          </div>
          <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-xl bg-[#242426] border border-white/5 shadow-inner">
            <Shield className="w-6 h-6 text-[#FF3B30]" />
          </div>
          {/* Gear Watermark */}
          <svg className="absolute right-[-10px] top-[-10px] opacity-10 text-white/30 w-28 h-28 animate-spin-slow pointer-events-none z-0" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 35c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 24c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z"/>
            <path d="M92 46.5l-6.8-1.1c-.6-2.1-1.6-4.1-2.9-5.9l4-5.6c.7-.9.6-2.3-.3-3.1L81 25.8c-.9-.9-2.3-.9-3.1-.3l-5.6 4c-1.8-1.3-3.8-2.3-5.9-2.9L65.3 20c-.2-1.1-1.2-2-2.4-2H57.1c-1.2 0-2.2.9-2.4 2l-1.1 6.8c-2.1.6-4.1 1.6-5.9 2.9l-5.6-4c-.9-.7-2.3-.6-3.1.3L34.2 31c-.9.9-.9 2.3-.3 3.1l4 5.6c-1.3 1.8-2.3 3.8-2.9 5.9L28.2 46.7c-1.1.2-2 1.2-2 2.4v5.8c0 1.2.9 2.2 2 2.4l6.8 1.1c.6 2.1 1.6 4.1 2.9 5.9l-4 5.6c-.7.9-.6 2.3.3 3.1l5 5.9c.9.9 2.3.9 3.1.3l5.6-4c1.8 1.3 3.8 2.3 5.9 2.9l1.1 6.8c.2 1.1 1.2 2 2.4 2h5.8c1.2 0 2.2-.9 2.4-2l1.1-6.8c2.1-.6 4.1-1.6 5.9-2.9l5.6 4c.9.7 2.3.6 3.1-.3l5-5c.9-.9.9-2.3.3-3.1l-4-5.6c1.3-1.8 2.3-3.8 2.9-5.9l6.8-1.1c1.1-.2 2-1.2 2-2.4v-5.8c-.1-1.2-1-2.2-2.1-2.4z"/>
          </svg>
        </div>

        {/* Card 2: Blocked Attacks */}
        <div className="relative overflow-hidden machined-plate border-l-4 border-[#3B82F6] p-5 flex items-center justify-between blue-neon-glow">
          <div className="space-y-1 z-10">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50">Blocked Attacks</span>
            <div className="text-3xl font-black text-[#3B82F6]">67</div>
            <div className="flex items-center gap-1.5 text-xs text-[#3B82F6]/80 font-bold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></span>
              Improving
            </div>
          </div>
          <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-xl bg-[#242426] border border-white/5 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-[#3B82F6]" />
          </div>
          {/* Gear Watermark */}
          <svg className="absolute right-[-10px] top-[-10px] opacity-10 text-white/30 w-28 h-28 animate-spin-reverse-slow pointer-events-none z-0" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 35c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 24c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z"/>
            <path d="M92 46.5l-6.8-1.1c-.6-2.1-1.6-4.1-2.9-5.9l4-5.6c.7-.9.6-2.3-.3-3.1L81 25.8c-.9-.9-2.3-.9-3.1-.3l-5.6 4c-1.8-1.3-3.8-2.3-5.9-2.9L65.3 20c-.2-1.1-1.2-2-2.4-2H57.1c-1.2 0-2.2.9-2.4 2l-1.1 6.8c-2.1.6-4.1 1.6-5.9 2.9l-5.6-4c-.9-.7-2.3-.6-3.1.3L34.2 31c-.9.9-.9 2.3-.3 3.1l4 5.6c-1.3 1.8-2.3 3.8-2.9 5.9L28.2 46.7c-1.1.2-2 1.2-2 2.4v5.8c0 1.2.9 2.2 2 2.4l6.8 1.1c.6 2.1 1.6 4.1 2.9 5.9l-4 5.6c-.7.9-.6 2.3.3 3.1l5 5.9c.9.9 2.3.9 3.1.3l5.6-4c1.8 1.3 3.8 2.3 5.9 2.9l1.1 6.8c.2 1.1 1.2 2 2.4 2h5.8c1.2 0 2.2-.9 2.4-2l1.1-6.8c2.1-.6 4.1-1.6 5.9-2.9l5.6 4c.9.7 2.3.6 3.1-.3l5-5c.9-.9.9-2.3.3-3.1l-4-5.6c1.3-1.8 2.3-3.8 2.9-5.9l6.8-1.1c1.1-.2 2-1.2 2-2.4v-5.8c-.1-1.2-1-2.2-2.1-2.4z"/>
          </svg>
        </div>

        {/* Card 3: Today's Threats */}
        <div className="relative overflow-hidden machined-plate border-l-4 border-[#FF9F0A] p-5 flex items-center justify-between orange-neon-glow">
          <div className="space-y-1 z-10">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50">Today's Threats</span>
            <div className="text-3xl font-black text-[#FF9F0A]">1</div>
            <div className="flex items-center gap-1.5 text-xs text-[#FF9F0A]/80 font-bold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF9F0A]"></span>
              Stable
            </div>
          </div>
          <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-xl bg-[#242426] border border-white/5 shadow-inner">
            <TrendingUp className="w-6 h-6 text-[#FF9F0A]" />
          </div>
          {/* Gear Watermark */}
          <svg className="absolute right-[-10px] top-[-10px] opacity-10 text-white/30 w-28 h-28 animate-spin-slow pointer-events-none z-0" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 35c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 24c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z"/>
            <path d="M92 46.5l-6.8-1.1c-.6-2.1-1.6-4.1-2.9-5.9l4-5.6c.7-.9.6-2.3-.3-3.1L81 25.8c-.9-.9-2.3-.9-3.1-.3l-5.6 4c-1.8-1.3-3.8-2.3-5.9-2.9L65.3 20c-.2-1.1-1.2-2-2.4-2H57.1c-1.2 0-2.2.9-2.4 2l-1.1 6.8c-2.1.6-4.1 1.6-5.9 2.9l-5.6-4c-.9-.7-2.3-.6-3.1.3L34.2 31c-.9.9-.9 2.3-.3 3.1l4 5.6c-1.3 1.8-2.3 3.8-2.9 5.9L28.2 46.7c-1.1.2-2 1.2-2 2.4v5.8c0 1.2.9 2.2 2 2.4l6.8 1.1c.6 2.1 1.6 4.1 2.9 5.9l-4 5.6c-.7.9-.6 2.3.3 3.1l5 5.9c.9.9 2.3.9 3.1.3l5.6-4c1.8 1.3 3.8 2.3 5.9 2.9l1.1 6.8c.2 1.1 1.2 2 2.4 2h5.8c1.2 0 2.2-.9 2.4-2l1.1-6.8c2.1-.6 4.1-1.6 5.9-2.9l5.6 4c.9.7 2.3.6 3.1-.3l5-5c.9-.9.9-2.3.3-3.1l-4-5.6c1.3-1.8 2.3-3.8 2.9-5.9l6.8-1.1c1.1-.2 2-1.2 2-2.4v-5.8c-.1-1.2-1-2.2-2.1-2.4z"/>
          </svg>
        </div>

        {/* Card 4: Detection Rate */}
        <div className="relative overflow-hidden machined-plate border-l-4 border-[#10B981] p-5 flex items-center justify-between green-neon-glow">
          <div className="space-y-1 z-10">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50">Detection Rate</span>
            <div className="text-3xl font-black text-[#10B981]">104%</div>
            <div className="flex items-center gap-1.5 text-xs text-[#10B981]/80 font-bold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              Improving
            </div>
          </div>
          <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-xl bg-[#242426] border border-white/5 shadow-inner">
            <Activity className="w-6 h-6 text-[#10B981]" />
          </div>
          {/* Gear Watermark */}
          <svg className="absolute right-[-10px] top-[-10px] opacity-10 text-white/30 w-28 h-28 animate-spin-reverse-slow pointer-events-none z-0" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 35c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 24c-5 0-9-4-9-9s4-9 9-9 9 4 9 9-4 9-9 9z"/>
            <path d="M92 46.5l-6.8-1.1c-.6-2.1-1.6-4.1-2.9-5.9l4-5.6c.7-.9.6-2.3-.3-3.1L81 25.8c-.9-.9-2.3-.9-3.1-.3l-5.6 4c-1.8-1.3-3.8-2.3-5.9-2.9L65.3 20c-.2-1.1-1.2-2-2.4-2H57.1c-1.2 0-2.2.9-2.4 2l-1.1 6.8c-2.1.6-4.1 1.6-5.9 2.9l-5.6-4c-.9-.7-2.3-.6-3.1.3L34.2 31c-.9.9-.9 2.3-.3 3.1l4 5.6c-1.3 1.8-2.3 3.8-2.9 5.9L28.2 46.7c-1.1.2-2 1.2-2 2.4v5.8c0 1.2.9 2.2 2 2.4l6.8 1.1c.6 2.1 1.6 4.1 2.9 5.9l-4 5.6c-.7.9-.6 2.3.3 3.1l5 5.9c.9.9 2.3.9 3.1.3l5.6-4c1.8 1.3 3.8 2.3 5.9 2.9l1.1 6.8c.2 1.1 1.2 2 2.4 2h5.8c1.2 0 2.2-.9 2.4-2l1.1-6.8c2.1-.6 4.1-1.6 5.9-2.9l5.6 4c.9.7 2.3.6 3.1-.3l5-5c.9-.9.9-2.3.3-3.1l-4-5.6c1.3-1.8 2.3-3.8 2.9-5.9l6.8-1.1c1.1-.2 2-1.2 2-2.4v-5.8c-.1-1.2-1-2.2-2.1-2.4z"/>
          </svg>
        </div>
      </div>
    );
  };

  const renderMobileContent = () => {
    switch (currentView) {
      case 'sentinel':
        return renderSkeuoCards();
      case 'editor':
        return (
          <div className="space-y-4">
            <div className="machined-plate p-4 shadow-xl border border-white/5 bg-black/60">
              {content}
            </div>
            <div className="machined-plate p-4 shadow-xl border border-white/5 bg-black/80">
              {terminal}
            </div>
          </div>
        );
      case 'history':
      case 'settings':
      case 'github':
      case 'admin':
      default:
        return (
          <div className="machined-plate p-4 shadow-xl border border-white/5 bg-black/70 min-h-[300px]">
            {content}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0B] text-white flex overflow-hidden font-sans select-none relative">
      
      {/* Dynamic Skeuomorphic Inject Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse-slow {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 25s linear infinite;
        }

        .machined-plate {
          background: linear-gradient(135deg, #1C1C1E 0%, #111112 100%);
          border: 1px solid #2C2C2E;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.05),
            0 4px 10px rgba(0, 0, 0, 0.6);
          border-radius: 14px;
        }

        .red-neon-glow {
          border-color: #FF3B30;
          box-shadow: 
            0 0 8px rgba(255, 59, 48, 0.4),
            inset 0 0 4px rgba(255, 59, 48, 0.2);
        }

        .blue-neon-glow {
          border-color: #3B82F6;
          box-shadow: 
            0 0 8px rgba(59, 130, 246, 0.4),
            inset 0 0 4px rgba(59, 130, 246, 0.2);
        }

        .orange-neon-glow {
          border-color: #FF9F0A;
          box-shadow: 
            0 0 8px rgba(255, 159, 10, 0.4),
            inset 0 0 4px rgba(255, 159, 10, 0.2);
        }

        .green-neon-glow {
          border-color: #10B981;
          box-shadow: 
            0 0 8px rgba(16, 185, 129, 0.4),
            inset 0 0 4px rgba(16, 185, 129, 0.2);
        }

        .sentinel-neon-glow {
          border-color: #FF5F00;
          box-shadow: 
            0 0 12px rgba(255, 95, 0, 0.6),
            inset 0 0 6px rgba(255, 95, 0, 0.3);
        }

        .skeuo-button {
          background: linear-gradient(180deg, #242426 0%, #151516 100%);
          border-top: 1px solid rgba(255,255,255,0.08);
          border-bottom: 2px solid rgba(0,0,0,0.6);
          border-left: 1px solid rgba(255,255,255,0.03);
          border-right: 1px solid rgba(255,255,255,0.03);
          text-shadow: 0 -1px 0 rgba(0,0,0,0.8);
          transition: all 0.15s ease-in-out;
        }

        .skeuo-button:active {
          background: #111112;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.8);
          transform: translateY(1px);
        }

        .footer-btn-row1-inactive {
          color: #B94D45;
        }
        .footer-btn-row2-inactive {
          color: #6B7280;
        }
      ` }} />

      {/* 1. DESKTOP WORKSPACE (16:9 Grid Layout) - Screen lg (1024px) and above */}
      <div className="hidden lg:flex w-full h-screen">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-[#FF5F00]/20 bg-[#121212] flex flex-col shrink-0">
          {sidebar}
        </aside>
        
        {/* Main Coding Stage */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex overflow-hidden">
            <section className="flex-1 overflow-auto border-r border-white/5 bg-[#0D0D0D]">
              {content}
            </section>
            
            {/* Right Diagnostic Telemetry Column */}
            <aside className="w-80 overflow-y-auto bg-[#121212]/30 p-4 border-l border-white/5 shrink-0">
              {diagnostics}
            </aside>
          </div>
          
          {/* Integrated Multi-Tab Terminal Drawer */}
          <footer className="h-56 bg-[#070707] shrink-0 z-10">
            {terminal}
          </footer>
        </main>
      </div>

      {/* 2. TABLET WORKSPACE (1:1 Stack Layout) - Screen md to lg */}
      <div className="hidden md:only:flex lg:hidden w-full h-screen flex-col">
        <header className="h-16 border-b border-[#FF5F00]/20 bg-[#121212] flex items-center px-6 justify-between shrink-0">
          <span className="font-extrabold text-[#FF5F00] tracking-wider">VOLT TABLET ENGINE</span>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/50 uppercase font-semibold">Workspace Mode</span>
          </div>
        </header>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main workspace */}
          <main className="flex-1 overflow-auto bg-[#0D0D0D]">
            {content}
          </main>
          
          {/* Diagnostics sidebar */}
          <aside className="w-72 overflow-y-auto border-l border-white/5 bg-[#121212]/40 p-4">
            {diagnostics}
          </aside>
        </div>

        <footer className="h-48 bg-[#070707] shrink-0 border-t border-[#FF5F00]/10">
          {terminal}
        </footer>
      </div>

      {/* 3. MOBILE SKEUOMORPHIC CYBERPUNK WORKSPACE - Screen sm (below 768px) */}
      <div className="flex md:hidden lg:hidden w-full h-screen flex-col overflow-hidden relative pb-16 bg-[#0A0A0B] p-4 space-y-4">
        {/* Beveled Machined Header identity plate */}
        <header className="h-[72px] machined-plate px-4 flex items-center justify-between shrink-0 select-none border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 z-10">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/40 border border-[#FF3B30]/30 shadow-inner">
              <Shield className="w-5 h-5 text-[#FF3B30] animate-pulse" />
            </div>
            <div>
              <div className="text-[#FF3B30] text-xl font-black tracking-widest text-shadow-glow">VOLT</div>
              <div className="text-[#FF5F00] text-[8px] font-black uppercase tracking-[2px] mt-0.5">V5.0 Agentic Hub</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-black/50 border border-white/5 rounded-lg text-[9px] font-bold text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            SYNCED
          </div>
        </header>

        {/* Segmented Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 shrink-0 h-10 select-none">
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'machined-plate red-neon-glow text-[#FF3B30]' 
                : 'machined-plate text-white/50 hover:text-white/80'
            }`}
          >
            <Shield className="w-3 h-3" />
            Security
          </button>
          <button 
            onClick={() => setActiveTab('performance')}
            className={`flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'performance'
                ? 'machined-plate red-neon-glow text-[#FF3B30]' 
                : 'machined-plate text-white/50 hover:text-white/80'
            }`}
          >
            <Zap className="w-3 h-3" />
            Performance
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'machined-plate red-neon-glow text-[#FF3B30]' 
                : 'machined-plate text-white/50 hover:text-white/80'
            }`}
          >
            <Users className="w-3 h-3" />
            Activity
          </button>
        </div>

        {/* Scrollable View Content Slot */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {renderMobileContent()}
        </div>

        {/* Cyberpunk Footer Switch Console */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0F0F10] border-t border-white/5 px-4 py-2 shrink-0 z-30 select-none">
          <div className="max-w-md mx-auto grid grid-cols-1 gap-2">
            {/* Row 1 footer controls */}
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setCurrentView('editor')}
                className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all skeuo-button cursor-pointer ${
                  currentView === 'editor' ? 'orange-neon-glow text-[#FF5F00] font-black bg-black' : 'footer-btn-row1-inactive'
                }`}
              >
                Editor
              </button>
              <button 
                onClick={() => setCurrentView('sentinel')}
                className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 skeuo-button cursor-pointer ${
                  currentView === 'sentinel' ? 'orange-neon-glow text-[#FF5F00] font-black bg-black' : 'footer-btn-row1-inactive'
                }`}
              >
                <RefreshCw className={`w-2.5 h-2.5 ${currentView === 'sentinel' ? 'animate-spin' : ''}`} />
                Sentinel
                <RefreshCw className={`w-2.5 h-2.5 ${currentView === 'sentinel' ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => alert('TACTICAL TELEMETRY ARMED')}
                className="py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all skeuo-button footer-btn-row1-inactive cursor-pointer"
              >
                Activate
              </button>
            </div>
            
            {/* Row 2 footer controls */}
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => setCurrentView('github')}
                className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all skeuo-button cursor-pointer ${
                  currentView === 'github' ? 'orange-neon-glow text-[#FF5F00] font-black bg-black' : 'footer-btn-row2-inactive'
                }`}
              >
                Modules
              </button>
              <button 
                onClick={() => setCurrentView('history')}
                className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all skeuo-button cursor-pointer ${
                  currentView === 'history' ? 'orange-neon-glow text-[#FF5F00] font-black bg-black' : 'footer-btn-row2-inactive'
                }`}
              >
                History
              </button>
              <button 
                onClick={() => setCurrentView('settings')}
                className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all skeuo-button cursor-pointer ${
                  currentView === 'settings' ? 'orange-neon-glow text-[#FF5F00] font-black bg-black' : 'footer-btn-row2-inactive'
                }`}
              >
                Settings
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
