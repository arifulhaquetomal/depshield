import { useState, useCallback } from 'react';
import {
  ScanStage,
  ScanStatus,
  ScanResult,
  DependencyRisk
} from '@/types';
import {
  parseRepoUrl,
  fetchRepoInfo,
  fetchPackageJson,
  fetchPackageLock,
  extractDependencies,
  fetchContributors,
  fetchRecentCommits,
  analyzeMaintainerHealth
} from '@/services/github';
import { batchQueryVulnerabilities } from '@/services/osv';
import { analyzeLicense } from '@/utils/licenses';
import { analyzeSupplyChainRisks } from '@/services/analyzer';
import { calculateDependencyRisk, calculateOverallRisk } from '@/services/scorer';
import { batchFetchLicenses } from '@/services/npm';

const INITIAL_STAGES: ScanStage[] = [
  {
    id: 'metadata',
    name: 'Initializing Scan',
    description: 'Retrieving project metadata',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'dependencies',
    name: 'Parsing Dependency Graph',
    description: 'Extracting dependencies from manifest files',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'licenses',
    name: 'Analyzing Licenses',
    description: 'Classifying license types and identifying risks',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'behavior',
    name: 'Inspecting Install & Runtime Behavior',
    description: 'Detecting install scripts, native bindings, and supply chain risks',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'vulnerabilities',
    name: 'Scanning for Vulnerabilities',
    description: 'Querying OSV.dev for known security issues',
    status: 'pending',
    progress: 0,
  },
  {
    id: 'scoring',
    name: 'Calculating Risk Scores',
    description: 'Computing weighted risk scores for each dependency',
    status: 'pending',
    progress: 0,
  },
];

interface LocalScanFiles {
  packageJson: any;
  packageLock?: any;
  filename: string;
}

export function useScanner() {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [stages, setStages] = useState<ScanStage[]>(INITIAL_STAGES);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStage = useCallback((index: number, updates: Partial<ScanStage>) => {
    setStages(prev => prev.map((stage, i) =>
      i === index ? { ...stage, ...updates } : stage
    ));
  }, []);

  const simulateProgress = useCallback((stageIndex: number, duration: number = 1000): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        updateStage(stageIndex, { progress });

        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }, [updateStage]);

  const runScan = async (input: string | LocalScanFiles) => {
    // Reset state
    setStatus('scanning');
    setStages(INITIAL_STAGES);
    setCurrentStage(0);
    setError(null);
    setResult(null);

    const isLocal = typeof input !== 'string';

    try {
      let repoInfo: any = {};
      let packageJson: any = null;
      let packageLock: any = null;

      // Stage 1: Fetch/Load Metadata
      setCurrentStage(0);
      updateStage(0, { status: 'running', name: isLocal ? 'Loading Local Files' : 'Fetching Repository Metadata' });

      if (!isLocal) {
        // GitHub Mode
        const parsed = parseRepoUrl(input as string);
        if (!parsed) throw new Error('Invalid GitHub repository URL');
        const { owner, repo } = parsed;

        const [fetchedRepo, fetchedPkg, fetchedLock] = await Promise.all([
          fetchRepoInfo(owner, repo),
          fetchPackageJson(owner, repo),
          fetchPackageLock(owner, repo),
          simulateProgress(0, 1500),
        ]);
        repoInfo = fetchedRepo;
        packageJson = fetchedPkg;
        packageLock = fetchedLock;
      } else {
        // Local Mode
        await simulateProgress(0, 500);
        const files = input as LocalScanFiles;
        packageJson = files.packageJson;
        packageLock = files.packageLock;
        repoInfo = {
          fullName: `Local: ${files.filename}`,
          name: files.filename,
          owner: 'local',
          stars: 0,
          forks: 0,
          openIssues: 0,
          createdAt: new Date().toISOString(),
          description: 'Local dependency scan'
        };
      }

      if (!packageJson) {
        throw new Error('No package.json found. Please provide a valid package manifest.');
      }

      updateStage(0, { status: 'completed', progress: 100 });

      // Stage 2: Parse dependencies
      setCurrentStage(1);
      updateStage(1, { status: 'running' });

      await simulateProgress(1, 800);
      const dependencies = extractDependencies(packageJson, packageLock);

      if (dependencies.length === 0) {
        throw new Error('No dependencies found in package.json');
      }

      updateStage(1, { status: 'completed', progress: 100 });

      // Stage 3: Analyze licenses
      setCurrentStage(2);
      updateStage(2, { status: 'running' });

      // Fetch licenses from npm registry for direct dependencies
      const directDepsForLicense = dependencies.filter(d => !d.isTransitive).slice(0, 20);

      const licenseProgressPromise = simulateProgress(2, 1500);
      const npmLicenses = await batchFetchLicenses(
        directDepsForLicense.map(d => ({ name: d.name, version: d.version }))
      );
      await licenseProgressPromise;

      // Build license map, using npm data or fallback to analysis
      const licenseMap = new Map<string, ReturnType<typeof analyzeLicense>>();

      for (const dep of dependencies) {
        const key = `${dep.name}@${dep.version}`;
        const npmLicense = npmLicenses.get(key);

        if (npmLicense) {
          licenseMap.set(key, npmLicense);
        } else {
          // Fallback to repo's license for transitive deps
          licenseMap.set(key, analyzeLicense(packageJson.license || null));
        }
      }

      updateStage(2, { status: 'completed', progress: 100 });

      // Stage 4: Analyze supply chain behavior
      setCurrentStage(3);
      updateStage(3, { status: 'running' });

      await simulateProgress(3, 700);
      const supplyChainRisks = analyzeSupplyChainRisks(packageJson);

      updateStage(3, { status: 'completed', progress: 100 });

      // Stage 5: Query vulnerabilities
      setCurrentStage(4);
      updateStage(4, { status: 'running' });

      // Query OSV for direct dependencies (limit to avoid rate limiting)
      const depsForVulnScan = dependencies.filter(d => !d.isTransitive).slice(0, 30);

      const vulnQueryProgress = simulateProgress(4, 2000);
      const vulnResults = await batchQueryVulnerabilities(
        depsForVulnScan.map(d => ({ name: d.name, version: d.version }))
      );
      await vulnQueryProgress;

      updateStage(4, { status: 'completed', progress: 100 });

      // Stage 6: Calculate risk scores
      setCurrentStage(5);
      updateStage(5, { status: 'running' });

      let repoMaintainerHealth;

      if (!isLocal) {
        const parsed = parseRepoUrl(input as string);
        if (parsed) {
          const { owner, repo } = parsed;
          const [contributorCount, commits] = await Promise.all([
            fetchContributors(owner, repo),
            fetchRecentCommits(owner, repo),
          ]);
          repoMaintainerHealth = analyzeMaintainerHealth(
            contributorCount,
            commits.lastDate,
            repoInfo.createdAt
          );
        }
      } else {
        // Mock health for local
        repoMaintainerHealth = { score: 100, label: 'Unknown (Local)' as const, reasons: [] };
      }

      await simulateProgress(5, 800);

      // Calculate risk for each dependency
      const dependencyRisks: DependencyRisk[] = dependencies.map(dep => {
        const key = `${dep.name}@${dep.version}`;
        const vulns = vulnResults.get(key) || [];
        const license = licenseMap.get(key) || analyzeLicense(null);
        const supplyChain = dep.isTransitive ? null : supplyChainRisks;
        const maintainerHealth = dep.isTransitive ? null : repoMaintainerHealth;

        return calculateDependencyRisk(
          dep,
          vulns,
          license,
          supplyChain,
          maintainerHealth
        );
      });

      updateStage(5, { status: 'completed', progress: 100 });

      // Calculate overall risk
      const { score, level, summary, topRisks } = calculateOverallRisk(dependencyRisks);

      // Build final result
      const scanResult: ScanResult = {
        repo: repoInfo,
        scanDate: new Date().toISOString(),
        dependencies: dependencyRisks,
        overallRiskScore: score,
        overallRiskLevel: level,
        summary,
        topRisks,
      };

      setResult(scanResult);
      setStatus('completed');
      setCurrentStage(6);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setStatus('error');

      // Mark current stage as error
      setStages(prev => prev.map((stage, i) =>
        i === currentStage ? { ...stage, status: 'error' } : stage
      ));
    }
  };

  const reset = useCallback(() => {
    setStatus('idle');
    setStages(INITIAL_STAGES);
    setCurrentStage(0);
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    stages,
    currentStage,
    result,
    error,
    scan: runScan, // Expose unified scanner
    reset,
  };
}
