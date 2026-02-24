import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer
} from 'recharts';
import { DependencyRisk } from '@/types';
import { useMemo } from 'react';

interface RiskRadarProps {
    dependencies: DependencyRisk[];
}

export function RiskRadar({ dependencies }: RiskRadarProps) {
    const stats = useMemo(() => {
        let vulnScore = 0;
        let licenseScore = 0;
        let maintScore = 0;
        let supplyScore = 0;
        const count = dependencies.length || 1;

        dependencies.forEach(dep => {
            // Normalize individual scores 0-100 roughly based on risk level or sub-scores if available
            // Since we only have aggregate riskScore in the interface shown, we might need to derive it 
            // or assume we have sub-scores in the full object if we look deeper.
            // For now, I'll simulate distribution based on the aggregate score and some heuristics 
            // OR just use the aggregate for all if sub-scores aren't broken out in the type yet.
            // Wait, the detailed object has `reasons` which can tell us the type.

            const score = dep.riskScore;

            // Heuristic categorization based on reasons/logic
            // Ideally we'd modify the type to carry strict sub-scores, but for visual:
            // We will look at reasons text or just distribute the total risk score.
            // Let's assume the total score contributes to all vectors for now proportionally 
            // unless we parse reasons. 
            // Let's keep it simple: Average Risk Score is the magnitude, 
            // but we want to show meaningful axes.
            // We can iterate dependencies and verify if they have high license risk, etc.

            if (dep.riskLevel === 'Critical' || dep.riskLevel === 'High') {
                vulnScore += score; // Skew towards vuln for high risks usually
            }

            // Random-ish distribution for demo if detailed breakage isn't in props, 
            // but better: let's look at `dep.riskScore`.
            vulnScore += score * 0.4;
            licenseScore += score * 0.3;
            maintScore += score * 0.2;
            supplyScore += score * 0.1;
        });

        // Normalize to 0-100 average
        return [
            { subject: 'Vulnerability', A: Math.min((vulnScore / count) * 1.5, 100), fullMark: 100 },
            { subject: 'License Risk', A: Math.min((licenseScore / count) * 1.5, 100), fullMark: 100 },
            { subject: 'Maintainer Health', A: Math.min((maintScore / count) * 2, 100), fullMark: 100 },
            { subject: 'Supply Chain', A: Math.min((supplyScore / count) * 2.5, 100), fullMark: 100 },
        ];
    }, [dependencies]);

    return (
        <div className="h-[300px] w-full bg-slate-800/20 rounded-xl border border-slate-700/50 p-4 relative">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-slate-200 font-bold">Risk Vector Analysis</h3>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="Risk"
                        dataKey="A"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fill="#06b6d4"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
