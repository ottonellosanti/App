import React from 'react';
import { DayStats } from '../types';
import { formatNumber, STATUS_COLORS } from '../utils/calculations';

interface StatsGridProps {
  stats: DayStats;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const cards = [
    {
      label: 'GANADAS',
      value: stats.won + stats.halfWon,
      colorHex: STATUS_COLORS['Verde'].hex,
    },
    {
      label: 'DEVUELTAS',
      value: stats.returned,
      colorHex: 'var(--text)',
    },
    {
      label: 'PERDIDAS',
      value: stats.lost + stats.halfLost,
      colorHex: STATUS_COLORS['Rojo'].hex,
    },
    {
      label: 'PENDIENTES',
      value: stats.pending,
      colorHex: STATUS_COLORS['Pendiente'].hex,
    },
    {
      label: 'TOTAL APUESTAS',
      value: stats.total,
      colorHex: 'var(--text)',
    },
    {
      label: 'TOTAL APOSTADO',
      value: formatNumber(stats.staked),
      colorHex: 'var(--text)',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-[var(--panel)] border border-[var(--border)] rounded-xl px-4 py-3 flex flex-col justify-between shadow-xs transition-colors"
        >
          <span className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            {c.label}
          </span>
          <span
            style={{ color: c.colorHex }}
            className="mt-2 text-xl sm:text-2xl font-bold tracking-tight"
          >
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
};
