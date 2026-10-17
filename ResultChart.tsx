import React from 'react';
import { Bet } from '../types';
import { STATUSES, STATUS_COLORS, formatPct } from '../utils/calculations';

interface ResultChartProps {
  bets: Bet[];
}

export const ResultChart: React.FC<ResultChartProps> = ({ bets }) => {
  const total = bets.length;

  const statusCounts = STATUSES.map((status) => {
    const count = bets.filter((b) => b.status === status).length;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return {
      status,
      count,
      percentage,
      color: STATUS_COLORS[status],
    };
  }).filter((x) => x.count > 0);

  // SVG Donut calculation
  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between h-full min-h-[300px] shadow-xs transition-colors">
      <h3 className="text-xs font-bold text-[var(--text)] tracking-tight">
        Recuento de Resultados
      </h3>

      <div className="flex-1 flex items-center justify-center my-3">
        {total === 0 ? (
          <div className="text-center text-xs text-[var(--text-muted)] py-10">
            Sin resultados para mostrar
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="var(--border)"
                strokeWidth={strokeWidth}
              />
              {statusCounts.map((item) => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -currentOffset;
                currentOffset += (item.percentage / 100) * circumference;

                return (
                  <circle
                    key={item.status}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={item.color.hex}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Legend below donut matching the screenshot */}
      <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
        {statusCounts.length === 0 ? (
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Sin datos</span>
            <span>0,0 %</span>
          </div>
        ) : (
          statusCounts.map((item) => (
            <div key={item.status} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: item.color.hex }}
                />
                <span className="text-[var(--text)] font-medium">{item.status}</span>
              </div>
              <span className="font-bold text-[var(--text)]">{formatPct(item.percentage)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
