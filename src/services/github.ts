// GitHub REST API service
import { RepoInfo, Dependency, MaintainerHealth } from '@/types';

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = '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';

interface GitHubError {
  message: string;
  documentation_url?: string;
}

async function fetchGitHub<T>(endpoint: string, token: string = GITHUB_TOKEN): Promise<T> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(`${GITHUB_API}${endpoint}`, { headers });

  if (!response.ok) {
    const error: GitHubError = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`GitHub API Error: ${error.message}`);
  }

  return response.json();
}

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/.*)?$/,
    /^([^\/]+)\/([^\/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
    }
  }

  return null;
}

export async function fetchRepoInfo(owner: string, repo: string, token?: string): Promise<RepoInfo> {
  const data = await fetchGitHub<any>(`/repos/${owner}/${repo}`, token);

  return {
    owner: data.owner.login,
    name: data.name,
    fullName: data.full_name,
    description: data.description || '',
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    lastCommit: data.pushed_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    license: data.license?.spdx_id || null,
    defaultBranch: data.default_branch,
  };
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<string | null> {
  try {
    const data = await fetchGitHub<any>(`/repos/${owner}/${repo}/contents/${path}`, token);

    if (data.content && data.encoding === 'base64') {
      return atob(data.content.replace(/\n/g, ''));
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchPackageJson(
  owner: string,
  repo: string,
  token?: string
): Promise<any | null> {
  const content = await fetchFileContent(owner, repo, 'package.json', token);
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function fetchPackageLock(
  owner: string,
  repo: string,
  token?: string
): Promise<any | null> {
  // Try package-lock.json first
  let content = await fetchFileContent(owner, repo, 'package-lock.json', token);

  // Fallback to npm-shrinkwrap.json
  if (!content) {
    content = await fetchFileContent(owner, repo, 'npm-shrinkwrap.json', token);
  }

  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function extractDependencies(
  packageJson: any,
  packageLock?: any
): Dependency[] {
  const dependencies: Dependency[] = [];
  const seen = new Set<string>();

  // Extract direct dependencies
  const addDeps = (deps: Record<string, string> | undefined, isDev: boolean) => {
    if (!deps) return;

    for (const [name, version] of Object.entries(deps)) {
      const key = `${name}@${version}`;
      if (!seen.has(key)) {
        seen.add(key);
        dependencies.push({
          name,
          version: version.replace(/^[\^~>=<]/, ''),
          isDev,
          isTransitive: false,
          depth: 0,
        });
      }
    }
  };

  addDeps(packageJson.dependencies, false);
  addDeps(packageJson.devDependencies, true);

  // Extract transitive dependencies from lockfile
  if (packageLock?.packages) {
    for (const [path, info] of Object.entries(packageLock.packages) as [string, any][]) {
      if (!path || path === '') continue; // Skip root

      const nameParts = path.replace('node_modules/', '').split('node_modules/');
      const name = nameParts[nameParts.length - 1];
      const depth = nameParts.length;
      const version = info.version || '';

      const key = `${name}@${version}`;
      if (!seen.has(key) && name) {
        seen.add(key);
        dependencies.push({
          name,
          version,
          isDev: info.dev || false,
          isTransitive: true,
          depth,
        });
      }
    }
  } else if (packageLock?.dependencies) {
    // Older lockfile format
    const extractLockDeps = (deps: Record<string, any>, depth: number) => {
      for (const [name, info] of Object.entries(deps)) {
        const version = info.version || '';
        const key = `${name}@${version}`;

        if (!seen.has(key)) {
          seen.add(key);
          dependencies.push({
            name,
            version,
            isDev: info.dev || false,
            isTransitive: depth > 0,
            depth,
          });
        }

        if (info.dependencies) {
          extractLockDeps(info.dependencies, depth + 1);
        }
      }
    };

    extractLockDeps(packageLock.dependencies, 0);
  }

  return dependencies;
}

export async function fetchContributors(
  owner: string,
  repo: string,
  token?: string
): Promise<number> {
  try {
    const data = await fetchGitHub<any[]>(`/repos/${owner}/${repo}/contributors?per_page=100`, token);
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

export async function fetchRecentCommits(
  owner: string,
  repo: string,
  token?: string
): Promise<{ count: number; lastDate: string | null }> {
  try {
    const data = await fetchGitHub<any[]>(`/repos/${owner}/${repo}/commits?per_page=30`, token);

    if (!Array.isArray(data) || data.length === 0) {
      return { count: 0, lastDate: null };
    }

    return {
      count: data.length,
      lastDate: data[0]?.commit?.committer?.date || null,
    };
  } catch {
    return { count: 0, lastDate: null };
  }
}

export function analyzeMaintainerHealth(
  contributorCount: number,
  lastCommitDate: string | null,
  repoCreatedAt: string
): MaintainerHealth {
  const now = new Date();
  const lastCommit = lastCommitDate ? new Date(lastCommitDate) : new Date(repoCreatedAt);
  const daysSinceLastCommit = Math.floor((now.getTime() - lastCommit.getTime()) / (1000 * 60 * 60 * 24));

  const risks: string[] = [];

  // Check abandonment
  const isAbandoned = daysSinceLastCommit > 365;
  if (isAbandoned) {
    risks.push('Repository appears abandoned (no commits in over a year)');
  } else if (daysSinceLastCommit > 180) {
    risks.push('Low recent activity (no commits in 6+ months)');
  }

  // Check bus factor
  const isSingleMaintainer = contributorCount <= 1;
  if (isSingleMaintainer) {
    risks.push('Single maintainer risk (bus factor = 1)');
  } else if (contributorCount <= 3) {
    risks.push('Limited maintainer pool (only ' + contributorCount + ' contributors)');
  }

  // Determine commit frequency
  let commitFrequency: 'active' | 'moderate' | 'low' | 'inactive';
  if (daysSinceLastCommit <= 30) {
    commitFrequency = 'active';
  } else if (daysSinceLastCommit <= 90) {
    commitFrequency = 'moderate';
  } else if (daysSinceLastCommit <= 365) {
    commitFrequency = 'low';
  } else {
    commitFrequency = 'inactive';
  }

  return {
    contributorCount,
    lastCommitDays: daysSinceLastCommit,
    isAbandoned,
    isSingleMaintainer,
    commitFrequency,
    risks,
  };
}
