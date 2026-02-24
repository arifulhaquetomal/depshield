import { DependencyRisk } from '@/types';
import { RiskBadge, RiskScore } from './RiskBadge';
import { SCORING_WEIGHTS } from '@/services/scorer';
import { cn } from '@/utils/cn';

interface RiskExplainerProps {
  dependency: DependencyRisk;
  onClose: () => void;
}

export function RiskExplainer({ dependency, onClose }: RiskExplainerProps) {
  const { breakdown } = dependency;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-100">{dependency.dependency.name}</h3>
            <RiskBadge level={dependency.riskLevel} />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            v{dependency.dependency.version}
            {dependency.dependency.isTransitive && ' • Transitive dependency'}
            {dependency.dependency.isDev && ' • Development dependency'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Overall Risk Score */}
        <div className="text-center py-4">
          <div className="text-sm text-slate-400 mb-2">Overall Risk Score</div>
          <RiskScore score={dependency.riskScore} size="lg" />
          <div className="text-xs text-slate-500 mt-1">out of 100</div>
        </div>

        {/* Score Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Score Breakdown
          </h4>
          <div className="space-y-3">
            <ScoreBar
              label="Vulnerabilities"
              score={breakdown.vulnerabilityScore}
              weight={SCORING_WEIGHTS.vulnerability}
              color="red"
            />
            <ScoreBar
              label="License Risk"
              score={breakdown.licenseScore}
              weight={SCORING_WEIGHTS.license}
              color="orange"
            />
            <ScoreBar
              label="Maintainer Health"
              score={breakdown.maintainerScore}
              weight={SCORING_WEIGHTS.maintainer}
              color="yellow"
            />
            <ScoreBar
              label="Supply Chain"
              score={breakdown.supplyChainScore}
              weight={SCORING_WEIGHTS.supplyChain}
              color="purple"
            />
          </div>
        </div>

        {/* Risk Reasons */}
        {dependency.reasons.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Why This Is Risky
            </h4>
            <ul className="space-y-2">
              {dependency.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-red-400 mt-1">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vulnerabilities */}
        {dependency.vulnerabilities.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Known Vulnerabilities ({dependency.vulnerabilities.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {dependency.vulnerabilities.map((vuln) => (
                <div key={vuln.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      vuln.severity === 'CRITICAL' && "bg-red-500/30 text-red-400",
                      vuln.severity === 'HIGH' && "bg-orange-500/30 text-orange-400",
                      vuln.severity === 'MEDIUM' && "bg-yellow-500/30 text-yellow-400",
                      vuln.severity === 'LOW' && "bg-green-500/30 text-green-400",
                      vuln.severity === 'UNKNOWN' && "bg-slate-500/30 text-slate-400"
                    )}>
                      {vuln.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{vuln.id}</span>
                  </div>
                  <p className="text-sm text-slate-300">{vuln.summary}</p>
                  {vuln.fixedVersions.length > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      Fixed in: {vuln.fixedVersions.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* License Info */}
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            License Analysis
          </h4>
          <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "font-medium",
                dependency.license.riskLevel === 'safe' && "text-green-400",
                dependency.license.riskLevel === 'conditional' && "text-yellow-400",
                dependency.license.riskLevel === 'high-risk' && "text-red-400",
                dependency.license.riskLevel === 'ambiguous' && "text-orange-400",
                dependency.license.riskLevel === 'unknown' && "text-slate-400"
              )}>
                {dependency.license.name}
              </span>
              {dependency.license.isOSIApproved && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                  OSI Approved
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">{dependency.license.explanation}</p>
          </div>
        </div>

        {/* Supply Chain */}
        {dependency.supplyChain && dependency.supplyChain.attackSurface.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Supply Chain Analysis
            </h4>
            <div className="space-y-2">
              {dependency.supplyChain.attackSurface.map((surface, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-purple-500/10 rounded border border-purple-500/20 text-sm text-purple-300">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{surface}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintainer Health */}
        {dependency.maintainerHealth && (
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Maintainer Health
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-slate-100">
                  {dependency.maintainerHealth.contributorCount}
                </div>
                <div className="text-xs text-slate-400">Contributors</div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className={cn(
                  "text-2xl font-bold",
                  dependency.maintainerHealth.lastCommitDays > 365 && "text-red-400",
                  dependency.maintainerHealth.lastCommitDays > 180 && dependency.maintainerHealth.lastCommitDays <= 365 && "text-yellow-400",
                  dependency.maintainerHealth.lastCommitDays <= 180 && "text-green-400"
                )}>
                  {dependency.maintainerHealth.lastCommitDays}
                </div>
                <div className="text-xs text-slate-400">Days since last commit</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  score,
  weight,
  color
}: {
  label: string;
  score: number;
  weight: number;
  color: 'red' | 'orange' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  const contribution = (score * weight) / 100;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label} ({weight}%)</span>
        <span className="text-slate-300 font-mono">
          {score}/100 → {contribution.toFixed(1)} pts
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorClasses[color])}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
