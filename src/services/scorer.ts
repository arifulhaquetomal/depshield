// Risk scoring engine with explainable formula
import { DependencyRisk, Dependency, Vulnerability, LicenseInfo, MaintainerHealth, SupplyChainRisk, ScanResult } from '@/types';
import { getVulnerabilityScore } from './osv';
import { getLicenseRiskScore } from '@/utils/licenses';
import { getSupplyChainScore } from './analyzer';

// Scoring weights (must sum to 100)
export const SCORING_WEIGHTS = {
  vulnerability: 35,
  license: 25,
  maintainer: 20,
  supplyChain: 20,
};

export function getMaintainerScore(health: MaintainerHealth | null): number {
  if (!health) return 0;
  
  let score = 0;
  
  // Abandonment is the biggest risk
  if (health.isAbandoned) {
    score += 50;
  } else if (health.commitFrequency === 'low') {
    score += 30;
  } else if (health.commitFrequency === 'moderate') {
    score += 10;
  }
  
  // Single maintainer risk
  if (health.isSingleMaintainer) {
    score += 30;
  } else if (health.contributorCount <= 3) {
    score += 15;
  }
  
  // Days since last commit factor
  if (health.lastCommitDays > 180 && health.lastCommitDays <= 365) {
    score += 20;
  }
  
  return Math.min(100, score);
}

export function calculateDependencyRisk(
  dependency: Dependency,
  vulnerabilities: Vulnerability[],
  license: LicenseInfo,
  supplyChain: SupplyChainRisk | null,
  maintainerHealth: MaintainerHealth | null
): DependencyRisk {
  // Calculate individual scores (0-100 each)
  const vulnerabilityScore = getVulnerabilityScore(vulnerabilities);
  const licenseScore = getLicenseRiskScore(license);
  const supplyChainScore = getSupplyChainScore(supplyChain);
  const maintainerScore = getMaintainerScore(maintainerHealth);
  
  // Apply weights to get final score
  const weightedScore = 
    (vulnerabilityScore * SCORING_WEIGHTS.vulnerability / 100) +
    (licenseScore * SCORING_WEIGHTS.license / 100) +
    (maintainerScore * SCORING_WEIGHTS.maintainer / 100) +
    (supplyChainScore * SCORING_WEIGHTS.supplyChain / 100);
  
  const riskScore = Math.round(weightedScore);
  
  // Determine risk level
  let riskLevel: DependencyRisk['riskLevel'];
  if (riskScore >= 70) {
    riskLevel = 'Critical';
  } else if (riskScore >= 50) {
    riskLevel = 'High';
  } else if (riskScore >= 25) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }
  
  // Generate human-readable reasons
  const reasons: string[] = [];
  
  // Vulnerability reasons
  if (vulnerabilities.length > 0) {
    const critical = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const high = vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const medium = vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
    
    if (critical > 0) {
      reasons.push(`${critical} CRITICAL vulnerability${critical > 1 ? 'ies' : ''} found`);
    }
    if (high > 0) {
      reasons.push(`${high} HIGH severity vulnerability${high > 1 ? 'ies' : ''}`);
    }
    if (medium > 0) {
      reasons.push(`${medium} MEDIUM severity vulnerability${medium > 1 ? 'ies' : ''}`);
    }
  }
  
  // License reasons
  if (license.riskLevel === 'high-risk') {
    reasons.push(`High-risk license: ${license.name}`);
  } else if (license.riskLevel === 'conditional') {
    reasons.push(`Conditional license requires attention: ${license.name}`);
  } else if (license.riskLevel === 'ambiguous') {
    reasons.push(`License ambiguity: ${license.explanation}`);
  } else if (license.riskLevel === 'unknown') {
    reasons.push('Unknown or missing license information');
  }
  
  // Maintainer reasons
  if (maintainerHealth) {
    reasons.push(...maintainerHealth.risks);
  }
  
  // Supply chain reasons
  if (supplyChain) {
    if (supplyChain.hasInstallScripts) {
      const riskyScripts = supplyChain.scripts.filter(s => s.risks.length > 0);
      if (riskyScripts.length > 0) {
        reasons.push(`Suspicious install scripts detected (${riskyScripts.map(s => s.type).join(', ')})`);
      } else {
        reasons.push('Has install-time scripts');
      }
    }
    if (supplyChain.hasNativeBindings) {
      reasons.push('Contains native code bindings');
    }
    if (supplyChain.attackSurface.length > 3) {
      reasons.push(`Multiple attack vectors identified (${supplyChain.attackSurface.length} potential surfaces)`);
    }
  }
  
  return {
    dependency,
    vulnerabilities,
    license,
    supplyChain,
    maintainerHealth,
    riskScore,
    riskLevel,
    reasons,
    breakdown: {
      vulnerabilityScore,
      licenseScore,
      maintainerScore,
      supplyChainScore,
    },
  };
}

export function calculateOverallRisk(dependencies: DependencyRisk[]): {
  score: number;
  level: ScanResult['overallRiskLevel'];
  summary: ScanResult['summary'];
  topRisks: DependencyRisk[];
} {
  if (dependencies.length === 0) {
    return {
      score: 0,
      level: 'Low',
      summary: {
        totalDependencies: 0,
        directDependencies: 0,
        transitiveDependencies: 0,
        criticalVulnerabilities: 0,
        highVulnerabilities: 0,
        mediumVulnerabilities: 0,
        lowVulnerabilities: 0,
        highRiskLicenses: 0,
        abandonedPackages: 0,
        supplyChainRisks: 0,
      },
      topRisks: [],
    };
  }
  
  // Calculate summary statistics
  const summary: ScanResult['summary'] = {
    totalDependencies: dependencies.length,
    directDependencies: dependencies.filter(d => !d.dependency.isTransitive).length,
    transitiveDependencies: dependencies.filter(d => d.dependency.isTransitive).length,
    criticalVulnerabilities: 0,
    highVulnerabilities: 0,
    mediumVulnerabilities: 0,
    lowVulnerabilities: 0,
    highRiskLicenses: 0,
    abandonedPackages: 0,
    supplyChainRisks: 0,
  };
  
  for (const dep of dependencies) {
    // Count vulnerabilities
    for (const vuln of dep.vulnerabilities) {
      switch (vuln.severity) {
        case 'CRITICAL': summary.criticalVulnerabilities++; break;
        case 'HIGH': summary.highVulnerabilities++; break;
        case 'MEDIUM': summary.mediumVulnerabilities++; break;
        case 'LOW': summary.lowVulnerabilities++; break;
      }
    }
    
    // Count license risks
    if (dep.license.riskLevel === 'high-risk') {
      summary.highRiskLicenses++;
    }
    
    // Count abandoned packages
    if (dep.maintainerHealth?.isAbandoned) {
      summary.abandonedPackages++;
    }
    
    // Count supply chain risks
    if (dep.supplyChain?.hasInstallScripts || dep.supplyChain?.hasNativeBindings) {
      summary.supplyChainRisks++;
    }
  }
  
  // Calculate overall score
  // Weight direct dependencies higher than transitive
  const directDeps = dependencies.filter(d => !d.dependency.isTransitive);
  const transitiveDeps = dependencies.filter(d => d.dependency.isTransitive);
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const dep of directDeps) {
    weightedSum += dep.riskScore * 2; // Direct deps count double
    totalWeight += 2;
  }
  
  for (const dep of transitiveDeps) {
    weightedSum += dep.riskScore;
    totalWeight += 1;
  }
  
  const avgScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  // Boost score if there are critical issues
  let score = avgScore;
  if (summary.criticalVulnerabilities > 0) {
    score = Math.min(100, score + 20);
  }
  if (summary.highRiskLicenses > 0) {
    score = Math.min(100, score + 10);
  }
  
  score = Math.round(score);
  
  // Determine overall level
  let level: ScanResult['overallRiskLevel'];
  if (score >= 70 || summary.criticalVulnerabilities > 0) {
    level = 'Critical';
  } else if (score >= 50) {
    level = 'High';
  } else if (score >= 25) {
    level = 'Medium';
  } else {
    level = 'Low';
  }
  
  // Get top 3 riskiest dependencies
  const topRisks = [...dependencies]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3);
  
  return { score, level, summary, topRisks };
}
