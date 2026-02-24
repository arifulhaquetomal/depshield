import { cn } from '@/utils/cn';

type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const levelConfig = {
  Critical: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
  High: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20',
  },
  Medium: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/20',
  },
  Low: {
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
    text: 'text-green-400',
    glow: 'shadow-green-500/20',
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function RiskBadge({ level, size = 'md', showIcon = true }: RiskBadgeProps) {
  const config = levelConfig[level];
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-medium",
      config.bg,
      config.border,
      config.text,
      sizeConfig[size],
      size === 'lg' && `shadow-lg ${config.glow}`
    )}>
      {showIcon && (
        <span className={cn(
          "rounded-full",
          level === 'Critical' && "animate-pulse"
        )}>
          {level === 'Critical' && '🔴'}
          {level === 'High' && '🟠'}
          {level === 'Medium' && '🟡'}
          {level === 'Low' && '🟢'}
        </span>
      )}
      {level}
    </span>
  );
}

interface RiskScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskScore({ score, size = 'md' }: RiskScoreProps) {
  const getColor = () => {
    if (score >= 70) return 'text-red-400';
    if (score >= 50) return 'text-orange-400';
    if (score >= 25) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSize = () => {
    switch (size) {
      case 'sm': return 'text-lg';
      case 'md': return 'text-2xl';
      case 'lg': return 'text-4xl';
    }
  };

  return (
    <span className={cn("font-bold font-mono", getColor(), getSize())}>
      {score}
    </span>
  );
}
