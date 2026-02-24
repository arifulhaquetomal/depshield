// Core types for the dependency risk scanner

export interface RepoInfo {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  lastCommit: string;
  createdAt: string;
  updatedAt: string;
  license: string | null;
  defaultBranch: string;
}

export interface Dependency {
  name: string;
  version: string;
  isDev: boolean;
  isTransitive: boolean;
  depth: number;
}

export interface Vulnerability {
  id: string;
  summary: string;
  details: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  affectedVersions: string[];
  fixedVersions: string[];
  references: string[];
}

export interface LicenseInfo {
  spdxId: string;
  name: string;
  riskLevel: 'safe' | 'conditional' | 'high-risk' | 'ambiguous' | 'unknown';
  explanation: string;
  isOSIApproved: boolean;
}

export interface SupplyChainRisk {
  hasInstallScripts: boolean;
  scripts: {
    type: 'preinstall' | 'postinstall' | 'prepublish' | 'prepare';
    content: string;
    risks: string[];
  }[];
  hasNativeBindings: boolean;
  executionContext: 'build-time' | 'runtime-server' | 'runtime-browser' | 'ci-cd';
  attackSurface: string[];
}

export interface MaintainerHealth {
  contributorCount: number;
  lastCommitDays: number;
  isAbandoned: boolean;
  isSingleMaintainer: boolean;
  commitFrequency: 'active' | 'moderate' | 'low' | 'inactive';
  risks: string[];
}

export interface DependencyRisk {
  dependency: Dependency;
  vulnerabilities: Vulnerability[];
  license: LicenseInfo;
  supplyChain: SupplyChainRisk | null;
  maintainerHealth: MaintainerHealth | null;
  riskScore: number;
  riskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  reasons: string[];
  breakdown: {
    vulnerabilityScore: number;
    licenseScore: number;
    maintainerScore: number;
    supplyChainScore: number;
  };
}

export interface ScanResult {
  repo: RepoInfo;
  scanDate: string;
  dependencies: DependencyRisk[];
  overallRiskScore: number;
  overallRiskLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  summary: {
    totalDependencies: number;
    directDependencies: number;
    transitiveDependencies: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    mediumVulnerabilities: number;
    lowVulnerabilities: number;
    highRiskLicenses: number;
    abandonedPackages: number;
    supplyChainRisks: number;
  };
  topRisks: DependencyRisk[];
}

export interface ScanStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
}

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'error';
