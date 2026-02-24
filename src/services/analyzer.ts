// Supply-chain behavior analyzer
import { SupplyChainRisk } from '@/types';

interface PackageJsonScripts {
  preinstall?: string;
  postinstall?: string;
  prepublish?: string;
  prepare?: string;
  [key: string]: string | undefined;
}

const DANGEROUS_PATTERNS = [
  { pattern: /curl\s+/i, risk: 'Downloads external content via curl' },
  { pattern: /wget\s+/i, risk: 'Downloads external content via wget' },
  { pattern: /http[s]?:\/\//i, risk: 'References external URLs' },
  { pattern: /\$\(/i, risk: 'Uses command substitution' },
  { pattern: /`[^`]+`/i, risk: 'Uses backtick command execution' },
  { pattern: /eval\s*\(/i, risk: 'Uses eval() which can execute arbitrary code' },
  { pattern: /exec\s*\(/i, risk: 'Uses exec() for command execution' },
  { pattern: /child_process/i, risk: 'Uses child_process module' },
  { pattern: /spawn\s*\(/i, risk: 'Spawns child processes' },
  { pattern: /rm\s+-rf/i, risk: 'Destructive file operations (rm -rf)' },
  { pattern: /chmod\s+/i, risk: 'Modifies file permissions' },
  { pattern: /sudo\s+/i, risk: 'Attempts privilege escalation' },
  { pattern: /\.env/i, risk: 'May access environment variables or .env files' },
  { pattern: /process\.env/i, risk: 'Accesses environment variables' },
  { pattern: /base64/i, risk: 'Uses base64 encoding (possible obfuscation)' },
  { pattern: /Buffer\.from.*toString/i, risk: 'Potential encoded payload' },
  { pattern: /require\s*\(\s*['"][^'"]+['"]\s*\)/i, risk: 'Dynamic require statements' },
  { pattern: /node\s+-e/i, risk: 'Inline Node.js execution' },
  { pattern: /powershell/i, risk: 'PowerShell execution' },
  { pattern: /cmd\s*\/c/i, risk: 'Windows command execution' },
];

const NATIVE_BINDING_PATTERNS = [
  'node-gyp',
  'node-pre-gyp',
  'prebuild',
  'prebuild-install',
  'napi',
  'nan',
  'bindings',
  'ffi',
  'ffi-napi',
];

function analyzeScript(
  scriptType: 'preinstall' | 'postinstall' | 'prepublish' | 'prepare',
  content: string
): { type: typeof scriptType; content: string; risks: string[] } {
  const risks: string[] = [];
  
  for (const { pattern, risk } of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      risks.push(risk);
    }
  }
  
  // Check for obfuscation indicators
  if (content.length > 500 && !content.includes('\n')) {
    risks.push('Long single-line script (possible obfuscation)');
  }
  
  // Check for hex/unicode escapes
  if (/\\x[0-9a-f]{2}|\\u[0-9a-f]{4}/i.test(content)) {
    risks.push('Contains encoded characters');
  }
  
  return { type: scriptType, content, risks };
}

export function analyzeSupplyChainRisks(
  packageJson: any,
  isDev: boolean = false
): SupplyChainRisk {
  const scripts: SupplyChainRisk['scripts'] = [];
  const attackSurface: string[] = [];
  
  const pkgScripts: PackageJsonScripts = packageJson.scripts || {};
  
  // Analyze install scripts
  const installScriptTypes: Array<'preinstall' | 'postinstall' | 'prepublish' | 'prepare'> = [
    'preinstall', 'postinstall', 'prepublish', 'prepare'
  ];
  
  for (const scriptType of installScriptTypes) {
    const scriptContent = pkgScripts[scriptType];
    if (scriptContent) {
      scripts.push(analyzeScript(scriptType, scriptContent));
    }
  }
  
  const hasInstallScripts = scripts.length > 0;
  
  // Check for native bindings
  const allDeps = {
    ...(packageJson.dependencies || {}),
    ...(packageJson.devDependencies || {}),
    ...(packageJson.optionalDependencies || {}),
  };
  
  const hasNativeBindings = NATIVE_BINDING_PATTERNS.some(pattern => 
    Object.keys(allDeps).some(dep => dep.includes(pattern))
  ) || Boolean(pkgScripts.install?.includes('node-gyp'));
  
  // Determine execution context
  let executionContext: SupplyChainRisk['executionContext'] = 'build-time';
  
  if (packageJson.browser || packageJson.unpkg || packageJson.jsdelivr) {
    executionContext = 'runtime-browser';
  } else if (packageJson.bin || packageJson.main?.includes('server') || packageJson.main?.includes('cli')) {
    executionContext = 'runtime-server';
  } else if (isDev) {
    executionContext = 'ci-cd';
  }
  
  // Calculate attack surface
  if (hasInstallScripts) {
    attackSurface.push('Install-time code execution');
  }
  
  if (hasNativeBindings) {
    attackSurface.push('Native code compilation and execution');
  }
  
  if (scripts.some(s => s.risks.length > 0)) {
    attackSurface.push('Suspicious script patterns detected');
  }
  
  const highRiskScripts = scripts.filter(s => s.risks.length > 0);
  if (highRiskScripts.length > 0) {
    for (const script of highRiskScripts) {
      attackSurface.push(`${script.type}: ${script.risks.join(', ')}`);
    }
  }
  
  // Check for network access indicators
  if (packageJson.dependencies?.axios || packageJson.dependencies?.fetch || 
      packageJson.dependencies?.['node-fetch'] || packageJson.dependencies?.request) {
    attackSurface.push('Has network access capabilities');
  }
  
  // Check for filesystem access indicators
  if (packageJson.dependencies?.['fs-extra'] || packageJson.dependencies?.glob ||
      packageJson.dependencies?.rimraf) {
    attackSurface.push('Has filesystem access capabilities');
  }
  
  return {
    hasInstallScripts,
    scripts,
    hasNativeBindings,
    executionContext,
    attackSurface,
  };
}

export function getSupplyChainScore(risk: SupplyChainRisk | null): number {
  if (!risk) return 0;
  
  let score = 0;
  
  // Install scripts are inherently risky
  if (risk.hasInstallScripts) {
    score += 20;
  }
  
  // Native bindings add risk
  if (risk.hasNativeBindings) {
    score += 15;
  }
  
  // Each risky script pattern adds to score
  for (const script of risk.scripts) {
    score += script.risks.length * 10;
  }
  
  // Cap at 100
  return Math.min(100, score);
}

export function analyzePackageJsonBehavior(packageJson: any): {
  hasBinaries: boolean;
  hasEngines: boolean;
  hasOS: boolean;
  hasCPU: boolean;
  funding: boolean;
  types: boolean;
} {
  return {
    hasBinaries: Boolean(packageJson.bin),
    hasEngines: Boolean(packageJson.engines),
    hasOS: Boolean(packageJson.os),
    hasCPU: Boolean(packageJson.cpu),
    funding: Boolean(packageJson.funding),
    types: Boolean(packageJson.types || packageJson.typings),
  };
}
