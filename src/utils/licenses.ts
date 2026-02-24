// SPDX License List with risk classifications
import { LicenseInfo } from '@/types';

interface LicenseData {
  name: string;
  riskLevel: 'safe' | 'conditional' | 'high-risk' | 'ambiguous' | 'unknown';
  explanation: string;
  isOSIApproved: boolean;
}

const LICENSE_DATABASE: Record<string, LicenseData> = {
  // Safe licenses - permissive
  'MIT': {
    name: 'MIT License',
    riskLevel: 'safe',
    explanation: 'Permissive license with minimal restrictions. Safe for commercial use.',
    isOSIApproved: true,
  },
  'ISC': {
    name: 'ISC License',
    riskLevel: 'safe',
    explanation: 'Permissive license similar to MIT. Safe for commercial use.',
    isOSIApproved: true,
  },
  'BSD-2-Clause': {
    name: 'BSD 2-Clause License',
    riskLevel: 'safe',
    explanation: 'Permissive license with minimal restrictions. Safe for commercial use.',
    isOSIApproved: true,
  },
  'BSD-3-Clause': {
    name: 'BSD 3-Clause License',
    riskLevel: 'safe',
    explanation: 'Permissive license. Requires attribution. Safe for commercial use.',
    isOSIApproved: true,
  },
  'Apache-2.0': {
    name: 'Apache License 2.0',
    riskLevel: 'safe',
    explanation: 'Permissive license with patent protection. Safe for commercial use.',
    isOSIApproved: true,
  },
  'Unlicense': {
    name: 'The Unlicense',
    riskLevel: 'safe',
    explanation: 'Public domain dedication. No restrictions.',
    isOSIApproved: true,
  },
  'CC0-1.0': {
    name: 'CC0 1.0 Universal',
    riskLevel: 'safe',
    explanation: 'Public domain dedication. No restrictions.',
    isOSIApproved: false,
  },
  'WTFPL': {
    name: 'Do What The F*ck You Want To Public License',
    riskLevel: 'safe',
    explanation: 'Extremely permissive. No restrictions.',
    isOSIApproved: false,
  },
  '0BSD': {
    name: 'Zero-Clause BSD',
    riskLevel: 'safe',
    explanation: 'Public domain equivalent. No restrictions.',
    isOSIApproved: true,
  },

  // Conditional licenses - weak copyleft
  'LGPL-2.0': {
    name: 'GNU Lesser General Public License v2.0',
    riskLevel: 'conditional',
    explanation: 'Weak copyleft. Changes to the library must be shared, but your code can remain proprietary if linked dynamically.',
    isOSIApproved: true,
  },
  'LGPL-2.1': {
    name: 'GNU Lesser General Public License v2.1',
    riskLevel: 'conditional',
    explanation: 'Weak copyleft. Changes to the library must be shared, but your code can remain proprietary if linked dynamically.',
    isOSIApproved: true,
  },
  'LGPL-3.0': {
    name: 'GNU Lesser General Public License v3.0',
    riskLevel: 'conditional',
    explanation: 'Weak copyleft. Changes to the library must be shared, but your code can remain proprietary if linked dynamically.',
    isOSIApproved: true,
  },
  'MPL-2.0': {
    name: 'Mozilla Public License 2.0',
    riskLevel: 'conditional',
    explanation: 'File-level copyleft. Modified files must be shared, but your code can remain proprietary.',
    isOSIApproved: true,
  },
  'EPL-1.0': {
    name: 'Eclipse Public License 1.0',
    riskLevel: 'conditional',
    explanation: 'Weak copyleft similar to MPL. Modified code must be shared.',
    isOSIApproved: true,
  },
  'EPL-2.0': {
    name: 'Eclipse Public License 2.0',
    riskLevel: 'conditional',
    explanation: 'Weak copyleft similar to MPL. Modified code must be shared.',
    isOSIApproved: true,
  },
  'CDDL-1.0': {
    name: 'Common Development and Distribution License 1.0',
    riskLevel: 'conditional',
    explanation: 'File-level copyleft. Modified files must be shared under CDDL.',
    isOSIApproved: true,
  },

  // High-risk licenses - strong copyleft
  'GPL-2.0': {
    name: 'GNU General Public License v2.0',
    riskLevel: 'high-risk',
    explanation: 'Strong copyleft. Your entire project may need to be licensed under GPL if you distribute it.',
    isOSIApproved: true,
  },
  'GPL-3.0': {
    name: 'GNU General Public License v3.0',
    riskLevel: 'high-risk',
    explanation: 'Strong copyleft. Your entire project may need to be licensed under GPL if you distribute it. Includes patent protection.',
    isOSIApproved: true,
  },
  'AGPL-3.0': {
    name: 'GNU Affero General Public License v3.0',
    riskLevel: 'high-risk',
    explanation: 'Network copyleft. Even server-side use requires sharing your source code. Very restrictive for commercial SaaS.',
    isOSIApproved: true,
  },
  'SSPL-1.0': {
    name: 'Server Side Public License v1',
    riskLevel: 'high-risk',
    explanation: 'Extreme copyleft. Offering the software as a service requires sharing ALL service code. Not OSI approved.',
    isOSIApproved: false,
  },
  'CC-BY-SA-4.0': {
    name: 'Creative Commons Attribution Share Alike 4.0',
    riskLevel: 'high-risk',
    explanation: 'Share-alike requirement. Derived works must use the same license.',
    isOSIApproved: false,
  },
  'OSL-3.0': {
    name: 'Open Software License 3.0',
    riskLevel: 'high-risk',
    explanation: 'Strong copyleft with network clause. Similar to AGPL.',
    isOSIApproved: true,
  },

  // Ambiguous/Unknown
  'SEE LICENSE IN LICENSE': {
    name: 'Custom License',
    riskLevel: 'ambiguous',
    explanation: 'Custom license requires manual review. Could contain unexpected restrictions.',
    isOSIApproved: false,
  },
  'UNLICENSED': {
    name: 'No License / Proprietary',
    riskLevel: 'high-risk',
    explanation: 'No license means all rights reserved. You may not have permission to use this code.',
    isOSIApproved: false,
  },
};

export function analyzeLicense(licenseId: string | null | undefined): LicenseInfo {
  if (!licenseId) {
    return {
      spdxId: 'UNKNOWN',
      name: 'Unknown License',
      riskLevel: 'unknown',
      explanation: 'No license information found. This could mean all rights reserved or missing metadata.',
      isOSIApproved: false,
    };
  }

  // Normalize license ID
  const normalized = licenseId.toUpperCase().trim();
  
  // Check for dual licenses (e.g., "MIT OR GPL-3.0")
  if (normalized.includes(' OR ') || normalized.includes('/')) {
    const licenses = normalized.split(/\s+OR\s+|\//).map(l => l.trim());
    const analyzed = licenses.map(l => LICENSE_DATABASE[l]).filter(Boolean);
    
    if (analyzed.length > 1) {
      const hasSafe = analyzed.some(l => l.riskLevel === 'safe');
      const hasHighRisk = analyzed.some(l => l.riskLevel === 'high-risk');
      
      return {
        spdxId: licenseId,
        name: `Dual License: ${licenseId}`,
        riskLevel: 'ambiguous',
        explanation: hasSafe && hasHighRisk 
          ? 'Dual license with both permissive and copyleft options. You may choose the permissive license, but verify compatibility.'
          : 'Multiple license options available. Verify which license applies to your use case.',
        isOSIApproved: analyzed.some(l => l.isOSIApproved),
      };
    }
  }

  // Check for "AND" licenses (all must be followed)
  if (normalized.includes(' AND ')) {
    return {
      spdxId: licenseId,
      name: `Combined License: ${licenseId}`,
      riskLevel: 'conditional',
      explanation: 'Multiple licenses must ALL be followed. Review each license requirement carefully.',
      isOSIApproved: false,
    };
  }

  // Try to find exact match
  const exactMatch = LICENSE_DATABASE[normalized] || LICENSE_DATABASE[licenseId];
  if (exactMatch) {
    return {
      spdxId: licenseId,
      ...exactMatch,
    };
  }

  // Try partial matching for common variations
  for (const [key, value] of Object.entries(LICENSE_DATABASE)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        spdxId: licenseId,
        ...value,
      };
    }
  }

  // Unknown license
  return {
    spdxId: licenseId,
    name: licenseId,
    riskLevel: 'unknown',
    explanation: 'Unrecognized license. Manual review recommended to understand restrictions.',
    isOSIApproved: false,
  };
}

export function getLicenseRiskScore(license: LicenseInfo): number {
  switch (license.riskLevel) {
    case 'safe': return 0;
    case 'conditional': return 40;
    case 'ambiguous': return 60;
    case 'high-risk': return 100;
    case 'unknown': return 70;
    default: return 50;
  }
}
