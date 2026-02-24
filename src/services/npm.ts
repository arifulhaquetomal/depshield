// NPM Registry API service for package metadata
import { LicenseInfo } from '@/types';
import { analyzeLicense } from '@/utils/licenses';

const NPM_REGISTRY = 'https://registry.npmjs.org';

interface NpmPackageInfo {
  name: string;
  version?: string;
  license?: string | { type: string };
  repository?: {
    type: string;
    url: string;
  };
  maintainers?: Array<{ name: string; email?: string }>;
  time?: Record<string, string>;
  versions?: Record<string, any>;
}

export async function fetchPackageInfo(packageName: string): Promise<NpmPackageInfo | null> {
  try {
    // Use abbreviated metadata for faster response
    const response = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(packageName)}`, {
      headers: {
        'Accept': 'application/vnd.npm.install-v1+json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function fetchPackageLicense(
  packageName: string, 
  version?: string
): Promise<LicenseInfo> {
  try {
    // Try to get the specific version's metadata
    const endpoint = version 
      ? `${NPM_REGISTRY}/${encodeURIComponent(packageName)}/${version}`
      : `${NPM_REGISTRY}/${encodeURIComponent(packageName)}/latest`;
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      return analyzeLicense(null);
    }

    const data = await response.json();
    
    let licenseId: string | null = null;
    
    if (typeof data.license === 'string') {
      licenseId = data.license;
    } else if (data.license?.type) {
      licenseId = data.license.type;
    } else if (data.licenses && Array.isArray(data.licenses)) {
      // Handle old license format
      const types = data.licenses.map((l: any) => l.type || l).filter(Boolean);
      if (types.length > 1) {
        licenseId = types.join(' OR ');
      } else if (types.length === 1) {
        licenseId = types[0];
      }
    }

    return analyzeLicense(licenseId);
  } catch {
    return analyzeLicense(null);
  }
}

export async function batchFetchLicenses(
  packages: Array<{ name: string; version: string }>
): Promise<Map<string, LicenseInfo>> {
  const results = new Map<string, LicenseInfo>();
  
  // Limit concurrency to avoid overwhelming the registry
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < packages.length; i += BATCH_SIZE) {
    const batch = packages.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(
      batch.map(async ({ name, version }) => {
        const license = await fetchPackageLicense(name, version);
        return { key: `${name}@${version}`, license };
      })
    );
    
    for (const { key, license } of batchResults) {
      results.set(key, license);
    }
    
    // Small delay between batches
    if (i + BATCH_SIZE < packages.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  return results;
}
