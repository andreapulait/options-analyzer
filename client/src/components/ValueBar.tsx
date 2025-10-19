import React from 'react';

interface ValueBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  showValue?: boolean;
}

export default function ValueBar({ label, value, maxValue, color, showValue = true }: ValueBarProps) {
  const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-foreground/80">{label}</span>
        {showValue && <span className="font-mono text-foreground/60">{value.toFixed(2)}</span>}
      </div>
      <div className="relative h-8 bg-muted rounded-md overflow-hidden border border-border">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground/70">
          {percentage.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

