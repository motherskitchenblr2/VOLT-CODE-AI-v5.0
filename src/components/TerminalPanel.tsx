import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Trash2, Minimize2 } from 'lucide-react';

interface TerminalPanelProps {
  logs: string[];
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  code: string;
  runAnalysis: () => void;
  applyFixes: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  logs,
  setLogs,
  code,
  runAnalysis,
  applyFixes
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'powershell' | 'ubuntu' | 'cmd'>('diagnostic');
  const [inputVal, setInputVal] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const [powershellLogs, setPowershellLogs] = useState<string[]>([
    'Windows PowerShell',
    'Copyright (C) Microsoft Corporation. All rights reserved.',
    '',
    'PS C:\\Workspace\\Volt-Code-AI> '
  ]);
  const [ubuntuLogs, setUbuntuLogs] = useState<string[]>([
    'Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-88-generic x86_64)',
    'Last login: Thu Jun 25 04:30:11 2026 from 192.168.1.5',
    '',
    'volt-user@ubuntu:~/workspace$ '
  ]);
  const [cmdLogs, setCmdLogs] = useState<string[]>([
    'Microsoft Windows [Version 10.0.22631.3296]',
    '(c) Microsoft Corporation. All rights reserved.',
    '',
    'C:\\Workspace\\Volt-Code-AI> '
  ]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, powershellLogs, ubuntuLogs, cmdLogs, activeTab]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = inputVal.trim();
    if (!command) return;

    setInputVal('');
    let promptStr = '';
    let currentLogs: string[] = [];
    let logSetter: React.Dispatch<React.SetStateAction<string[]>>;

    if (activeTab === 'powershell') {
      promptStr = 'PS C:\\Workspace\\Volt-Code-AI> ';
      currentLogs = powershellLogs;
      logSetter = setPowershellLogs;
    } else if (activeTab === 'ubuntu') {
      promptStr = 'volt-user@ubuntu:~/workspace$ ';
      currentLogs = ubuntuLogs;
      logSetter = setUbuntuLogs;
    } else {
      promptStr = 'C:\\Workspace\\Volt-Code-AI> ';
      currentLogs = cmdLogs;
      logSetter = setCmdLogs;
    }

    const commandLower = command.toLowerCase();
    let outputLines: string[] = [];

    if (commandLower === 'clear' || commandLower === 'cls') {
      logSetter([promptStr]);
      return;
    }
    if (commandLower === 'ls' || commandLower === 'dir') {
      outputLines = [
        'Mode                 LastWriteTime         Length Name',
        '----                 -------------         ------ ----',
        'd----           6/24/2026  11:59 PM                src',
        'd----           6/24/2026  11:59 PM                api',
        'd----           6/24/2026  11:59 PM                public',
        '-a---           6/24/2026  11:59 PM           1236 package.json',
        '-a---           6/24/2026  11:59 PM            544 tsconfig.app.json'
      ];
    } else if (commandLower === 'whoami') {
      outputLines = ['volt_enterprise_dev'];
    } else if (commandLower === 'git status') {
      outputLines = [
        'On branch feature/v6-enterprise-upgrade',
        'Your branch is up to date with \'origin/feature/v6-enterprise-upgrade\'.',
        'nothing to commit, working tree clean'
      ];
    } else if (commandLower === 'volt analyze') {
      outputLines = ['[TELEMETRY] Starting full diagnostic analysis...'];
      runAnalysis();
    } else if (commandLower === 'volt fix') {
      outputLines = ['[TELEMETRY] Applying patches to editor...'];
      applyFixes();
    } else {
      outputLines = [`Command '${command}' not recognized. Try 'ls', 'whoami', 'git status', 'volt analyze', or 'volt fix'.`];
    }

    logSetter(prev => {
      const copy = [...prev];
      copy[copy.length - 1] = promptStr + command;
      return [...copy, ...outputLines, promptStr];
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#070707] text-[#E0E0E0] border-t border-[#FF5F00]/30 font-mono text-xs overflow-hidden">
      
      {/* Header */}
      <div className="h-10 bg-[#121212] border-b border-[#FF5F00]/25 px-4 flex justify-between items-center select-none shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[#FF5F00] font-black">
            <TerminalIcon className="w-4 h-4" />
            <span>SHELL GATEWAY</span>
          </div>

          <div className="flex gap-1.5">
            {(['diagnostic', 'powershell', 'ubuntu', 'cmd'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-[#FF5F00] text-black' 
                    : 'border border-[#FF5F00]/25 text-[#FF5F00] hover:bg-[#FF5F00]/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (activeTab === 'diagnostic') setLogs(['[SYSTEM] Diagnostic log cleared.']);
              else if (activeTab === 'powershell') setPowershellLogs(['PS C:\\Workspace\\Volt-Code-AI> ']);
              else if (activeTab === 'ubuntu') setUbuntuLogs(['volt-user@ubuntu:~/workspace$ ']);
              else if (activeTab === 'cmd') setCmdLogs(['C:\\Workspace\\Volt-Code-AI> ']);
            }}
            className="hover:text-red-400 text-white/50 transition-colors cursor-pointer"
            title="Clear Console"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="hover:text-[#FF5F00] text-white/50 transition-colors cursor-pointer" title="Minimize">
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 p-4 overflow-y-auto space-y-1 select-text">
        {activeTab === 'diagnostic' ? (
          logs.map((log, idx) => {
            let color = 'text-white/80';
            if (log.includes('[SUCCESS]')) color = 'text-green-400';
            else if (log.includes('[ERROR]')) color = 'text-red-400';
            else if (log.includes('[WARNING]')) color = 'text-yellow-400 font-bold';
            else if (log.includes('[INFO]')) color = 'text-[#FF5F00]';

            return <div key={idx} className={color}>{log}</div>;
          })
        ) : (
          <>
            {(activeTab === 'powershell' ? powershellLogs : activeTab === 'ubuntu' ? ubuntuLogs : cmdLogs)
              .slice(0, -1)
              .map((line, idx) => (
                <div key={idx} className="text-white/80 whitespace-pre-wrap leading-relaxed">{line}</div>
              ))
            }
            <form onSubmit={handleCommandSubmit} className="flex items-center text-white mt-0.5">
              <span className="text-[#FF5F00] font-bold mr-1.5 shrink-0">
                {(activeTab === 'powershell' ? powershellLogs : activeTab === 'ubuntu' ? ubuntuLogs : cmdLogs).slice(-1)[0]}
              </span>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="flex-1 bg-transparent text-white border-none outline-none focus:ring-0 focus:outline-none p-0 font-mono text-xs"
                placeholder="Run command..."
                autoFocus
              />
            </form>
          </>
        )}
        <div ref={endRef} />
      </div>

    </div>
  );
};
