import { HeaderTest } from '@/services/web-scanner';

import { cn } from '@/utils/cn';

interface HeaderTestsTableProps {
    tests: Record<string, HeaderTest>;
    domain?: string;
}

export function HeaderTestsTable({ tests, domain = 'this website' }: HeaderTestsTableProps) {
    const testEntries = Object.entries(tests).sort(([, a], [, b]) => {
        // Sort by pass status, then by score impact
        if (a.pass !== b.pass) return a.pass ? 1 : -1;
        return a.score_modifier - b.score_modifier;
    });

    if (testEntries.length === 0) {
        return null;
    }

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50 bg-slate-800/50">
                            <th className="px-4 py-3 text-left text-xs font-mono uppercase text-slate-400">Test</th>
                            <th className="px-4 py-3 text-left text-xs font-mono uppercase text-slate-400">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-mono uppercase text-slate-400">Impact</th>
                            <th className="px-4 py-3 text-left text-xs font-mono uppercase text-slate-400 hidden md:table-cell">Details</th>

                        </tr>
                    </thead>
                    <tbody>
                        {testEntries.map(([name, test]) => (
                            <tr key={name} className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3 text-sm font-mono text-slate-300">
                                    {name.replace(/-/g, ' ')}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn(
                                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono",
                                        test.pass
                                            ? "bg-green-900/30 text-green-400 border border-green-500/30"
                                            : "bg-red-900/30 text-red-400 border border-red-500/30"
                                    )}>
                                        {test.pass ? (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        )}
                                        {test.pass ? 'PASS' : 'FAIL'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn(
                                        "text-sm font-mono",
                                        test.score_modifier > 0 && "text-green-400",
                                        test.score_modifier < 0 && "text-red-400",
                                        test.score_modifier === 0 && "text-slate-500"
                                    )}>
                                        {test.score_modifier > 0 && '+'}
                                        {test.score_modifier}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell max-w-md truncate">
                                    {test.score_description}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
