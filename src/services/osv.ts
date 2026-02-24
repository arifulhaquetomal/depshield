// OSV.dev API service - Free vulnerability database
import { Vulnerability } from '@/types';

const OSV_API = 'https://api.osv.dev/v1';

interface OSVVulnerability {
  id: string;
  summary?: string;
  details?: string;
  severity?: Array<{
    type: string;
    score: string;
  }>;
  affected?: Array<{
    package?: {
      name: string;
      ecosystem: string;
    };
    ranges?: Array<{
      type: string;
      events: Array<{
        introduced?: string;
        fixed?: string;
      }>;
    }>;
    versions?: string[];
  }>;
  references?: Array<{
    type: string;
    url: string;
  }>;
}

interface OSVQueryResponse {
  vulns?: OSVVulnerability[];
}

function parseSeverity(vuln: OSVVulnerability): Vulnerability['severity'] {
  // Check for severity in the response
  if (vuln.severity && vuln.severity.length > 0) {
    const cvss = vuln.severity[0];
    const score = parseFloat(cvss.score);
    
    if (score >= 9.0) return 'CRITICAL';
    if (score >= 7.0) return 'HIGH';
    if (score >= 4.0) return 'MEDIUM';
    if (score > 0) return 'LOW';
  }
  
  // Try to infer from ID or summary
  const text = `${vuln.id} ${vuln.summary || ''} ${vuln.details || ''}`.toLowerCase();
  
  if (text.includes('critical') || text.includes('rce') || text.includes('remote code')) {
    return 'CRITICAL';
  }
  if (text.includes('high') || text.includes('arbitrary') || text.includes('injection')) {
    return 'HIGH';
  }
  if (text.includes('medium') || text.includes('moderate')) {
    return 'MEDIUM';
  }
  if (text.includes('low') || text.includes('minor')) {
    return 'LOW';
  }
  
  return 'UNKNOWN';
}

function extractVersionInfo(vuln: OSVVulnerability): { affected: string[]; fixed: string[] } {
  const affected: string[] = [];
  const fixed: string[] = [];
  
  if (vuln.affected) {
    for (const aff of vuln.affected) {
      if (aff.versions) {
        affected.push(...aff.versions);
      }
      
      if (aff.ranges) {
        for (const range of aff.ranges) {
          for (const event of range.events || []) {
            if (event.introduced && event.introduced !== '0') {
              affected.push(`>= ${event.introduced}`);
            }
            if (event.fixed) {
              fixed.push(event.fixed);
            }
          }
        }
      }
    }
  }
  
  return { affected, fixed };
}

export async function queryVulnerabilities(
  packageName: string, 
  version: string
): Promise<Vulnerability[]> {
  try {
    const response = await fetch(`${OSV_API}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        package: {
          name: packageName,
          ecosystem: 'npm',
        },
        version: version || undefined,
      }),
    });
    
    if (!response.ok) {
      console.warn(`OSV query failed for ${packageName}@${version}`);
      return [];
    }
    
    const data: OSVQueryResponse = await response.json();
    
    if (!data.vulns || data.vulns.length === 0) {
      return [];
    }
    
    return data.vulns.map(vuln => {
      const versionInfo = extractVersionInfo(vuln);
      
      return {
        id: vuln.id,
        summary: vuln.summary || 'No summary available',
        details: vuln.details || '',
        severity: parseSeverity(vuln),
        affectedVersions: versionInfo.affected,
        fixedVersions: versionInfo.fixed,
        references: (vuln.references || []).map(r => r.url),
      };
    });
  } catch (error) {
    console.warn(`Error querying OSV for ${packageName}:`, error);
    return [];
  }
}

export async function batchQueryVulnerabilities(
  packages: Array<{ name: string; version: string }>
): Promise<Map<string, Vulnerability[]>> {
  const results = new Map<string, Vulnerability[]>();
  
  // OSV doesn't have a true batch endpoint, so we'll do parallel requests
  // but limit concurrency to avoid rate limiting
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < packages.length; i += BATCH_SIZE) {
    const batch = packages.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(
      batch.map(async ({ name, version }) => {
        const vulns = await queryVulnerabilities(name, version);
        return { key: `${name}@${version}`, vulns };
      })
    );
    
    for (const { key, vulns } of batchResults) {
      results.set(key, vulns);
    }
    
    // Small delay between batches to be respectful
    if (i + BATCH_SIZE < packages.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

export function getVulnerabilityScore(vulns: Vulnerability[]): number {
  if (vulns.length === 0) return 0;
  
  let score = 0;
  
  for (const vuln of vulns) {
    switch (vuln.severity) {
      case 'CRITICAL':
        score += 40;
        break;
      case 'HIGH':
        score += 25;
        break;
      case 'MEDIUM':
        score += 15;
        break;
      case 'LOW':
        score += 5;
        break;
      case 'UNKNOWN':
        score += 10;
        break;
    }
  }
  
  // Cap at 100
  return Math.min(100, score);
}
