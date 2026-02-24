import { useState } from 'react';
import { WebScanResult } from '@/services/web-scanner';
import { generateWebReport } from '@/services/ReportGenerator';
import { CyberBrain } from './CyberBrain';
import { ContextHelp } from './ContextHelp';
import { WebSecurityRadar } from './WebSecurityRadar';
import { DomainMap } from './DomainMap';
import { HeaderTestsTable } from './HeaderTestsTable';


import { cn } from '@/utils/cn';

interface WebDashboardProps {
    result: WebScanResult;
    onNewScan: () => void;
}

export function WebDashboard({ result, onNewScan }: WebDashboardProps) {
    const [isBrainOpen, setIsBrainOpen] = useState(false);
    const [brainQuestion, setBrainQuestion] = useState<string>('');


    const askBrain = (question: string) => {
        setBrainQuestion(question);
        setIsBrainOpen(true);
    };

    // NO default context - each query provides only what it needs

    const getGradeColor = (grade: string) => {
        if (grade === 'A+' || grade === 'A') return 'text-green-400';
        if (grade === 'B' || grade === 'C') return 'text-yellow-400';
        return 'text-red-400';
    };

    const getGradeBg = (grade: string) => {
        if (grade === 'A+' || grade === 'A') return 'bg-green-950/20 border-green-500/30';
        if (grade === 'B' || grade === 'C') return 'bg-yellow-950/20 border-yellow-500/30';
        return 'bg-red-950/20 border-red-500/30';
    };

    const passedTests = Object.values(result.observatory.tests).filter(t => t.pass).length;
    const totalTests = Object.values(result.observatory.tests).length;

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 sm:pb-20">
            {/* AI Brain */}
            <CyberBrain
                isOpen={isBrainOpen}
                onToggle={() => setIsBrainOpen(!isBrainOpen)}
                contextData={undefined}
                initialQuestion={brainQuestion}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 uppercase tracking-tight">
                            Security Operations Center
                        </h1>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-900/50 text-cyan-400 border border-cyan-800/50 shrink-0">
                            WEB
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 font-mono break-all sm:break-normal">
                        <span>{result.domain}</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button
                        onClick={() => generateWebReport(result)}
                        className="flex-1 md:flex-none justify-center px-4 py-2 border border-slate-600 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 rounded-lg transition-all flex items-center gap-2 group text-sm sm:text-base"
                    >
                        <svg className="w-4 h-4 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                    <button
                        onClick={onNewScan}
                        className="flex-1 md:flex-none justify-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all shadow-lg shadow-cyan-900/20 flex items-center gap-2 text-sm sm:text-base"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        New Scan
                    </button>
                </div>
            </div>



            {/* Top Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Security Grade Card */}
                <div className={cn("col-span-1 lg:col-span-2 p-6 rounded-xl border relative overflow-hidden group", getGradeBg(result.observatory.grade))}>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent -translate-y-full group-hover:animate-[scan_2s_infinite_linear] pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono uppercase text-slate-500">Security Grade</span>
                                <ContextHelp label="Security Grade" value={result.observatory.grade} onAsk={askBrain} />
                            </div>
                            <div className={cn("text-5xl sm:text-6xl font-bold", getGradeColor(result.observatory.grade))}>
                                {result.observatory.grade}
                            </div>
                            <div className="text-slate-400 mt-2 text-sm">Score: {result.observatory.score}/100</div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl sm:text-4xl font-bold text-slate-100">{passedTests}/{totalTests}</div>
                            <div className="text-xs font-mono text-slate-500 uppercase">Tests Passed</div>
                        </div>
                    </div>
                </div>

                {/* Security Radar */}
                <div className="col-span-1 lg:col-span-2 row-span-1 lg:row-span-2">
                    <WebSecurityRadar
                        score={result.observatory.score}
                        tests={result.observatory.tests}
                    />
                </div>


                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-4 col-span-1 lg:col-span-2">
                    <StatCard
                        label="RISKS FOUND"
                        value={result.risks.length}
                        icon="⚠️"
                        highlight={result.risks.length > 0 ? 'red' : undefined}
                        subLabel="Security Issues"
                        onAsk={askBrain}
                    />
                    <StatCard
                        label="PASSED TESTS"
                        value={passedTests}
                        icon="✅"
                        highlight={passedTests > totalTests * 0.7 ? 'green' : 'yellow'}
                        subLabel={`${passedTests} of ${totalTests} checks`}
                        onAsk={askBrain}
                    />
                </div>

            </div>

            {/* Domain Map */}
            {result.certificates.length > 0 && (
                <DomainMap domain={result.domain} certificates={result.certificates} />
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    label="Subdomains"
                    value={result.certificates.length}
                    icon="🌐"
                    onAsk={askBrain}
                />
                <StatCard
                    label="Failed Tests"
                    value={totalTests - passedTests}
                    icon="❌"
                    highlight={totalTests - passedTests > 0 ? 'orange' : undefined}
                    onAsk={askBrain}
                />
                <StatCard
                    label="Certificate Age"
                    value={result.certificates[0] ? Math.floor((Date.now() - new Date(result.certificates[0].not_before).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                    icon="📅"
                    onAsk={askBrain}
                />
                <StatCard
                    label="Header Score"
                    value={result.observatory.score}
                    icon="🔒"
                    highlight={result.observatory.score < 50 ? 'red' : result.observatory.score < 75 ? 'yellow' : 'green'}
                    onAsk={askBrain}
                />
            </div>

            {/* Test Results Table */}
            {Object.keys(result.observatory.tests).length > 0 && (
                <div className="overflow-hidden">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2 font-mono uppercase text-sm">
                        <span className="text-cyan-500">::</span> Security Test Results
                    </h2>
                    <HeaderTestsTable tests={result.observatory.tests} domain={result.domain} />
                </div>
            )}

            {/* Risks */}
            {result.risks.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2 font-mono uppercase text-sm">
                        <span className="text-cyan-500">::</span> Security Issues
                    </h2>



                    <div className="space-y-2">
                        {result.risks.map((risk, i) => (
                            <div key={i} className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg flex items-start gap-3 hover:border-slate-600 transition-colors">
                                <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-slate-300 text-sm">{risk}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Action */}
            <div className="text-center pt-8 border-t border-slate-800">
                <button
                    onClick={() => askBrain(`Analyze web security. Domain: ${result.domain}, Grade: ${result.observatory.grade}, Score: ${result.observatory.score}/100, Risks: ${result.risks.length}. How to fix?`)}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 transition-all flex items-center justify-center gap-3 mx-auto text-base sm:text-lg font-semibold group"
                >
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Generate AI Solution Plan
                </button>
                <p className="mt-4 text-slate-500 text-sm px-4">
                    Get expert advice on how to secure your headers and SSL configuration.
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
    onAsk
}: {
    label: string;
    value: number;
    icon: string;
    highlight?: 'red' | 'orange' | 'yellow' | 'green' | 'purple';
    subLabel?: string;
    onAsk?: (q: string) => void;
}) {
    return (
        <div className={cn(
            "p-4 rounded-xl border bg-slate-800/20 backdrop-blur-sm",
            highlight === 'red' && "border-red-500/30 bg-red-900/10",
            highlight === 'orange' && "border-orange-500/30 bg-orange-900/10",
            highlight === 'yellow' && "border-yellow-500/30 bg-yellow-900/10",
            highlight === 'green' && "border-green-500/30 bg-green-900/10",
            highlight === 'purple' && "border-purple-500/30 bg-purple-900/10",
            !highlight && "border-slate-700/50"
        )}>
            <div className="flex justify-between items-start mb-2">
                <div className="text-2xl">{icon}</div>
                <div className="flex items-center gap-1">
                    {onAsk && <ContextHelp label={label} value={value} onAsk={onAsk} />}
                    {highlight && <div className={`w-2 h-2 rounded-full bg-${highlight}-500 animate-pulse`} />}
                </div>
            </div>
            <div className={cn(
                "text-3xl font-bold tracking-tighter mb-1",
                highlight === 'red' && "text-red-400",
                highlight === 'orange' && "text-orange-400",
                highlight === 'yellow' && "text-yellow-400",
                highlight === 'green' && "text-green-400",
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
