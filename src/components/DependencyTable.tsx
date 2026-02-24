import { useState, useMemo } from 'react';
import { DependencyRisk } from '@/types';
import { RiskBadge, RiskScore } from './RiskBadge';
import { cn } from '@/utils/cn';

interface DependencyTableProps {
  dependencies: DependencyRisk[];
  onSelect: (dep: DependencyRisk) => void;
  selectedDep: DependencyRisk | null;
}

type SortField = 'name' | 'version' | 'riskScore' | 'license' | 'vulnerabilities';
type SortOrder = 'asc' | 'desc';

export function DependencyTable({ dependencies, onSelect, selectedDep }: DependencyTableProps) {
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filter, setFilter] = useState('');
  const [showTransitive, setShowTransitive] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedDeps = useMemo(() => {
    let filtered = dependencies;

    // Apply filter
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      filtered = filtered.filter(d =>
        d.dependency.name.toLowerCase().includes(lowerFilter) ||
        d.license.spdxId.toLowerCase().includes(lowerFilter)
      );
    }

    // Apply transitive filter
    if (!showTransitive) {
      filtered = filtered.filter(d => !d.dependency.isTransitive);
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let compare = 0;

      switch (sortField) {
        case 'name':
          compare = a.dependency.name.localeCompare(b.dependency.name);
          break;
        case 'version':
          compare = a.dependency.version.localeCompare(b.dependency.version);
          break;
        case 'riskScore':
          compare = a.riskScore - b.riskScore;
          break;
        case 'license':
          compare = a.license.spdxId.localeCompare(b.license.spdxId);
          break;
        case 'vulnerabilities':
          compare = a.vulnerabilities.length - b.vulnerabilities.length;
          break;
      }

      return sortOrder === 'asc' ? compare : -compare;
    });
  }, [dependencies, sortField, sortOrder, filter, showTransitive]);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <svg className={cn("w-4 h-4", sortOrder === 'asc' && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search dependencies..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showTransitive}
              onChange={(e) => setShowTransitive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500/50"
            />
            Show transitive
          </label>

          <span className="text-sm text-slate-500">
            {sortedDeps.length} of {dependencies.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <SortHeader field="name">Package</SortHeader>
              <SortHeader field="version">Version</SortHeader>
              <SortHeader field="license">License</SortHeader>
              <SortHeader field="vulnerabilities">Vulns</SortHeader>
              <SortHeader field="riskScore">Risk</SortHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sortedDeps.map((dep) => (
              <tr
                key={`${dep.dependency.name}@${dep.dependency.version}`}
                onClick={() => onSelect(dep)}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedDep?.dependency.name === dep.dependency.name
                    ? "bg-cyan-500/10"
                    : "hover:bg-slate-700/30"
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">{dep.dependency.name}</span>
                    {dep.dependency.isTransitive && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                        transitive
                      </span>
                    )}
                    {dep.dependency.isDev && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                        dev
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-slate-400">
                  {dep.dependency.version}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-sm",
                    dep.license.riskLevel === 'safe' && "text-green-400",
                    dep.license.riskLevel === 'conditional' && "text-yellow-400",
                    dep.license.riskLevel === 'high-risk' && "text-red-400",
                    dep.license.riskLevel === 'ambiguous' && "text-orange-400",
                    dep.license.riskLevel === 'unknown' && "text-slate-500"
                  )}>
                    {dep.license.spdxId}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {dep.vulnerabilities.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "font-medium",
                        dep.vulnerabilities.some(v => v.severity === 'CRITICAL') && "text-red-400",
                        !dep.vulnerabilities.some(v => v.severity === 'CRITICAL') && dep.vulnerabilities.some(v => v.severity === 'HIGH') && "text-orange-400",
                        !dep.vulnerabilities.some(v => v.severity === 'CRITICAL' || v.severity === 'HIGH') && "text-yellow-400"
                      )}>
                        {dep.vulnerabilities.length}
                      </span>
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <RiskScore score={dep.riskScore} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {dep.reasons.length > 0 && (
                      <RiskBadge level={dep.riskLevel} size="sm" showIcon={false} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedDeps.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          No dependencies match your filter
        </div>
      )}
    </div>
  );
}
