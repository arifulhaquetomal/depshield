import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { HeaderTest } from '@/services/web-scanner';

interface WebSecurityRadarProps {
    score: number;
    tests: Record<string, HeaderTest>;
}

export function WebSecurityRadar({ score, tests }: WebSecurityRadarProps) {
    // Calculate scores for different security dimensions
    const calculateDimensionScore = (testKeys: string[]) => {
        const relevantTests = testKeys.map(key => tests[key]).filter(Boolean);
        if (relevantTests.length === 0) return 50;

        const passedTests = relevantTests.filter(t => t.pass).length;
        return Math.round((passedTests / relevantTests.length) * 100);
    };

    const data = [
        {
            dimension: 'Headers',
            score: calculateDimensionScore(['content-security-policy', 'x-content-type-options', 'x-frame-options']),
            fullMark: 100,
        },
        {
            dimension: 'Transport',
            score: calculateDimensionScore(['strict-transport-security', 'redirection']),
            fullMark: 100,
        },
        {
            dimension: 'Cookies',
            score: calculateDimensionScore(['cookies']),
            fullMark: 100,
        },
        {
            dimension: 'Content',
            score: calculateDimensionScore(['content-security-policy', 'subresource-integrity']),
            fullMark: 100,
        },
    ];

    return (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2 font-mono uppercase text-sm">
                <span className="text-cyan-500">::</span> Security Posture
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={data}>
                    <PolarGrid stroke="#475569" />
                    <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Radar
                        name="Security Score"
                        dataKey="score"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.3}
                        strokeWidth={2}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
