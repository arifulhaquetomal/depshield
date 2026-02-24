import { useState } from 'react';
import { ScanResult, DependencyRisk } from '@/types';
import { RiskBadge, RiskScore } from './RiskBadge';
import { DependencyTable } from './DependencyTable';
import { RiskExplainer } from './RiskExplainer';
import { AttackSurfaceMap } from './AttackSurfaceMap';
import { RiskRadar } from './RiskRadar';
import { CyberBrain } from './CyberBrain';
import { ContextHelp } from './ContextHelp';
import { generateReport } from '@/services/ReportGenerator';
import { cn } from '@/utils/cn';

interface DashboardProps {
  result: ScanResult;
  onNewScan: () => void;
}

export function Dashboard({ result, onNewScan }: DashboardProps) {
  const [selectedDep, setSelectedDep] = useState<DependencyRisk | null>(null);
  const [isBrainOpen, setIsBrainOpen] = useState(false);
  const [brainQuestion, setBrainQuestion] = useState<string>('');

  const handleExport = () => {
    generateReport(result);
  };

  const askBrain = (question: string) => {
    setBrainQuestion(question);
    setIsBrainOpen(true);
  };

  // NO default context - each query will provide only what it needs


  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
      {/* AI Brain */}
      <CyberBrain
        isOpen={isBrainOpen}
        onToggle={() => setIsBrainOpen(!isBrainOpen)}
        contextData={undefined}
        initialQuestion={brainQuestion}
      />

      {/* SOC Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-slate-100 uppercase tracking-tight">
              Security Operations Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-900/50 text-cyan-400 border border-cyan-800/50">
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400 font-mono">
            <a
              href={`https://github.com/${result.repo.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              {result.repo.fullName}
            </a>
            <span>::</span>
            <span>SCAN_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-slate-600 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 rounded-lg transition-all flex items-center gap-2 group"
          >
            <svg className="w-4 h-4 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Report
          </button>
          <button
            onClick={onNewScan}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all shadow-lg shadow-cyan-900/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            New Scan
          </button>
        </div>
      </div>

      {/* Top Threat Intel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Overall Score */}
        <div className={cn(
          "col-span-2 p-6 rounded-xl border relative overflow-hidden group",
          result.overallRiskLevel === 'Critical' && "bg-red-950/20 border-red-500/30",
          result.overallRiskLevel === 'High' && "bg-orange-950/20 border-orange-500/30",
          result.overallRiskLevel === 'Medium' && "bg-yellow-950/20 border-yellow-500/30",
          result.overallRiskLevel === 'Low' && "bg-green-950/20 border-green-500/30"
        )}>
          {/* Scanline Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent -translate-y-full group-hover:animate-[scan_2s_infinite_linear] pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-500 mb-1">
                Threat Level
                <ContextHelp label="Repo Threat Level" value={result.overallRiskLevel} onAsk={askBrain} context={`Risk: ${result.overallRiskLevel}, Score: ${result.overallRiskScore}`} />
              </div>
              <div className="flex items-center gap-4">
                <RiskScore score={result.overallRiskScore} size="lg" />
                <RiskBadge level={result.overallRiskLevel} size="lg" />
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-slate-100 tracking-tighter">{result.summary.totalDependencies}</div>
              <div className="text-xs font-mono text-slate-500 uppercase">Total Vectors</div>
            </div>
          </div>
        </div>

        {/* Risk Radar */}
        <div className="col-span-2 row-span-2">
          <RiskRadar dependencies={result.dependencies} />
        </div>

        {/* Primary Stats */}
        <StatCard
          label="CRITICAL VULNS"
          value={result.summary.criticalVulnerabilities}
          icon="☠️"
          highlight={result.summary.criticalVulnerabilities > 0 ? 'red' : undefined}
          subLabel="Immediate Action Required"
          onAsk={askBrain}
          scanSummary={result.summary}
        />
        <StatCard
          label="SUPPLY CHAIN"
          value={result.summary.supplyChainRisks}
          icon="⛓️"
          highlight={result.summary.supplyChainRisks > 0 ? 'purple' : undefined}
          subLabel="Suspicious Behaviors"
          onAsk={askBrain}
          scanSummary={result.summary}
        />
      </div>

      {/* Attack Surface Map */}
      <div>
        <AttackSurfaceMap dependencies={result.dependencies} />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Direct Deps"
          value={result.summary.directDependencies}
          icon="📦"
          onAsk={askBrain}
          scanSummary={result.summary}
        />
        <StatCard
          label="Transitive Deps"
          value={result.summary.transitiveDependencies}
          icon="🔗"
          onAsk={askBrain}
          scanSummary={result.summary}
        />
        <StatCard
          label="High Risk Lic"
          value={result.summary.highRiskLicenses}
          icon="⚖️"
          highlight={result.summary.highRiskLicenses > 0 ? 'yellow' : undefined}
          onAsk={askBrain}
          scanSummary={result.summary}
        />
        <StatCard
          label="High Vulns"
          value={result.summary.highVulnerabilities}
          icon="🟠"
          highlight={result.summary.highVulnerabilities > 0 ? 'orange' : undefined}
          onAsk={askBrain}
          scanSummary={result.summary}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Dependency Table */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2 font-mono uppercase text-sm">
            <span className="text-cyan-500">::</span> Detected Artifacts
          </h2>
          <DependencyTable
            dependencies={result.dependencies}
            onSelect={setSelectedDep}
            selectedDep={selectedDep}
          />
        </div>

        {/* Explainer Panel */}
        <div className="lg:col-span-1">
          {selectedDep ? (
            <div className="h-full flex flex-col">
              <RiskExplainer
                dependency={selectedDep}
                onClose={() => setSelectedDep(null)}
              />
              <button
                onClick={() => askBrain(`How do I fix the risks associated with package ${selectedDep.dependency.name}? Risks: ${selectedDep.reasons.join(', ')}`)}
                className="mt-4 w-full py-3 bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-400 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Ask Brain for Remediation
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-8 text-center h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-600/50">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-mono text-slate-300 mb-2">
                Awaiting Selection
              </h3>
              <p className="text-xs font-mono text-slate-500 max-w-[200px]">
                Select an artifact from the table to analyze its attack vector.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Remediation Action */}
      <div className="text-center pt-8 border-t border-slate-800">
        <button
          onClick={() => askBrain(`Create a remediation plan. Repo: ${result.repo.fullName}, Risk: ${result.overallRiskLevel}, Critical vulns: ${result.summary.criticalVulnerabilities}, High vulns: ${result.summary.highVulnerabilities}, Supply chain risks: ${result.summary.supplyChainRisks}`)}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 transition-all flex items-center gap-3 mx-auto text-lg font-semibold group"
        >
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate AI Remediation Plan
        </button>
        <p className="mt-4 text-slate-500 text-sm">
          Use DepShield Brain to automatically generate a fix strategy for your team.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
  subLabel,
  onAsk,
  scanSummary
}: {
  label: string;
  value: number;
  icon: string;
  highlight?: 'red' | 'orange' | 'yellow' | 'purple';
  subLabel?: string;
  onAsk?: (q: string) => void;
  scanSummary?: any;
}) {
  // Create minimal context based on the specific stat
  const getMinimalContext = () => {
    if (!scanSummary) return undefined;
    if (label.includes('CRITICAL')) return `Critical: ${scanSummary.criticalVulnerabilities}, High: ${scanSummary.highVulnerabilities}`;
    if (label.includes('SUPPLY')) return `Supply chain risks: ${scanSummary.supplyChainRisks}`;
    if (label.includes('Direct')) return `Direct deps: ${scanSummary.directDependencies}`;
    if (label.includes('Transitive')) return `Transitive deps: ${scanSummary.transitiveDependencies}`;
    if (label.includes('Lic')) return `High risk licenses: ${scanSummary.highRiskLicenses}`;
    if (label.includes('Vulns')) return `High vulnerabilities: ${scanSummary.highVulnerabilities}`;
    return undefined;
  };

  return (
    <div className={cn(
      "p-4 rounded-xl border bg-slate-800/20 backdrop-blur-sm",
      highlight === 'red' && "border-red-500/30 bg-red-900/10",
      highlight === 'orange' && "border-orange-500/30 bg-orange-900/10",
      highlight === 'yellow' && "border-yellow-500/30 bg-yellow-900/10",
      highlight === 'purple' && "border-purple-500/30 bg-purple-900/10",
      !highlight && "border-slate-700/50"
    )}>
      <div className="flex justify-between items-start mb-2">
        <div className="text-2xl">{icon}</div>
        <div className="flex items-center gap-1">
          {onAsk && <ContextHelp label={label} value={value} onAsk={onAsk} context={getMinimalContext()} />}
          {highlight && <div className={`w-2 h-2 rounded-full bg-${highlight}-500 animate-pulse`} />}
        </div>
      </div>
      <div className={cn(
        "text-3xl font-bold tracking-tighter mb-1",
        highlight === 'red' && "text-red-400",
        highlight === 'orange' && "text-orange-400",
        highlight === 'yellow' && "text-yellow-400",
        highlight === 'purple' && "text-purple-400",
        !highlight && "text-slate-100"
      )}>
        {value}
      </div>
      <div className="text-xs font-mono text-slate-500 uppercase tracking-wide">{label}</div>
      {subLabel && (
        <div className="mt-2 text-[10px] text-slate-400 border-t border-slate-700/50 pt-2 opacity-70">
          {subLabel}
        </div>
      )}
    </div>
  );
}
