import { useEffect, useState, useMemo } from 'react';
import { ScanStage } from '@/types';
import { cn } from '@/utils/cn';
import { TerminalLogs } from './TerminalLogs';

interface ScanProgressProps {
  stages: ScanStage[];
  currentStage: number;
}

export function ScanProgress({ stages, currentStage }: ScanProgressProps) {
  const [logs, setLogs] = useState<string[]>(['Initializing scanner protocols...', 'Connecting to secure gateway...']);

  // Effect to generate logs based on stage progress/change
  useEffect(() => {
    const stage = stages[currentStage];
    if (!stage) return;

    if (stage.status === 'running') {
      const newLogs: string[] = [];
      // Add random "tech" logs based on stage
      if (Math.random() > 0.7) {
        const key = stage.id;
        if (key === 'metadata') newLogs.push(`GET /repos/${Math.random().toString(16).substr(2, 8)} [200 OK]`);
        if (key === 'dependencies') newLogs.push(`Parsing manifest... found entry ${Math.random().toString(36).substr(2, 5)}`);
        if (key === 'licenses') newLogs.push(`Analyzing compliance: ${Math.random() > 0.5 ? 'MIT' : 'Apache-2.0'}`);
        if (key === 'vulnerabilities') newLogs.push(`Querying CVE database... hash:${Math.random().toString(16).substr(2, 6)}`);
        if (key === 'scoring') newLogs.push(`Calculating risk vector: ${Math.random().toFixed(4)}`);

        if (newLogs.length > 0) {
          setLogs(prev => [...prev, ...newLogs].slice(-50)); // Keep last 50
        }
      }
    } else if (stage.status === 'completed' && !logs.includes(`Stage '${stage.name}' completed.`)) {
      setLogs(prev => [...prev, `Stage '${stage.name}' completed.`, '----------------------------------------']);
    }
  }, [currentStage, stages, logs]); // dep on logs might cause loop if not careful, but condition checks content

  // Better log generation approach:
  // We can just add a log when stage changes or progress increments significantly.
  // For now the above random effect is "okay" but might be spammy. 
  // Let's refine:

  useEffect(() => {
    const stage = stages[currentStage];
    if (stage && stage.status === 'running') {
      const interval = setInterval(() => {
        const techWords = ['Analysing', 'Decrypting', 'Fetching', 'Parsing', 'Validating', 'Handshaking'];
        const targets = ['payload', 'manifest', 'token', 'buffer', 'dependency tree', 'license header'];
        setLogs(prev => [...prev, `${techWords[Math.floor(Math.random() * techWords.length)]} ${targets[Math.floor(Math.random() * targets.length)]}...`].slice(-20));
      }, 800);
      return () => clearInterval(interval);
    }
  }, [currentStage]);


  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

      {/* Left: Stages List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-200 mb-6 font-mono border-b border-cyan-500/30 pb-2 inline-block">
            // SCAN_PROGRESS
        </h3>
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            className={cn(
              "flex items-center gap-4 p-3 rounded-lg border transition-all duration-300",
              index === currentStage && "bg-slate-800/80 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
              index < currentStage && "bg-slate-900/40 border-slate-700/50 opacity-70",
              index > currentStage && "bg-transparent border-transparent opacity-30"
            )}
          >
            {/* Status indicator */}
            <div className="flex-shrink-0">
              {stage.status === 'completed' && (
                <div className="w-6 h-6 rounded bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30 font-mono text-xs">
                  OK
                </div>
              )}
              {stage.status === 'running' && (
                <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 animate-pulse font-mono text-xs">
                  ..
                </div>
              )}
              {stage.status === 'pending' && (
                <div className="w-6 h-6 rounded bg-slate-800 text-slate-600 flex items-center justify-center border border-slate-700 font-mono text-xs">
                  --
                </div>
              )}
              {stage.status === 'error' && (
                <div className="w-6 h-6 rounded bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30 font-mono text-xs">
                  !!
                </div>
              )}
            </div>

            {/* Stage info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "font-mono text-sm",
                  index === currentStage ? "text-cyan-400" : "text-slate-300"
                )}>
                  {stage.name}
                </span>
                {index === currentStage && stage.status === 'running' && (
                  <span className="text-xs font-mono text-cyan-500">{Math.round(stage.progress)}%</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right: Terminal */}
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-bold text-slate-200 mb-6 font-mono border-b border-green-500/30 pb-2 inline-block">
            // LIVE_LOGS
        </h3>
        <div className="flex-1 min-h-[400px]">
          <TerminalLogs logs={logs} className="h-full border-green-900/30 bg-black/80" />
        </div>
      </div>
    </div>
  );
}
