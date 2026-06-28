import React from 'react';

interface ResponsiveContainerProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  terminal: React.ReactNode;
  diagnostics: React.ReactNode;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  sidebar,
  content,
  terminal,
  diagnostics
}) => {
  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-white flex overflow-hidden font-sans select-none">
      
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

      {/* 3. MOBILE TOUCH WORKSPACE (9:16 Sheets) - Screen sm (below 768px) */}
      <div className="flex md:hidden lg:hidden w-full h-screen flex-col overflow-hidden relative pb-14">
        {/* Header */}
        <header className="h-14 border-b border-[#FF5F00]/20 bg-[#121212] flex items-center justify-between px-4 shrink-0">
          <span className="font-black text-[#FF5F00] text-sm tracking-widest">VOLT MOBILE</span>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          </div>
        </header>

        {/* Scrollable touch panels stacked vertically */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0A] scroll-smooth">
          <div className="bg-black/50 border border-white/5 rounded-2xl p-4 shadow-xl">
            {content}
          </div>
          
          <div className="bg-black/50 border border-white/5 rounded-2xl p-4 shadow-xl">
            <h4 className="text-xs text-[#FF5F00] font-bold uppercase tracking-wider mb-3">Live Telemetry Diagnostics</h4>
            {diagnostics}
          </div>

          <div className="bg-black/50 border border-white/5 rounded-2xl p-4 shadow-xl">
            {terminal}
          </div>
        </div>
      </div>
      
    </div>
  );
};
