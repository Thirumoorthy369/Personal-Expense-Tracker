import React from 'react';
import { formatMoney } from '../../lib/finance';

export function CustomChartTooltip({ active, payload, label, formatter }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-3 rounded-xl shadow-2xl text-xs space-y-1.5 z-50 font-sans backdrop-blur-md">
        {label && (
          <p className="font-semibold text-foreground font-mono text-[11px] pb-1 border-b border-border/60">
            {label}
          </p>
        )}
        {payload.map((entry, index) => {
          const formattedVal = formatter ? formatter(entry.value) : formatMoney(entry.value);
          const color = entry.color || entry.fill || 'hsl(var(--primary))';

          return (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground font-medium">{entry.name || 'Value'}:</span>
              </div>
              <span className="font-bold font-mono text-foreground">{formattedVal}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}
