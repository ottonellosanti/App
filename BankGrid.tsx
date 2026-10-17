import React from 'react';
import { BankMetrics } from '../types';
import { formatNumber, formatPct, STATUS_COLORS } from '../utils/calculations';

interface BankGridProps {
  metrics: BankMetrics;
  onEditInitialBank?: () => void;
}

export const BankGrid: React.FC<BankGridProps> = ({ metrics, onEditInitialBank }) => {
  const isPositiveProfit = metrics.dayProfit >= 0;
  const isPositiveRoi = metrics.roi >= 0;

  const cards = [
    {
      label: 'BANK INICIAL',
      value: formatNumber(metrics.initial),
      colorHex: 'var(--text)',
      canEdit: true,
    },
    {
      label: 'BANK INICIO DEL DÍA',
      value: formatNumber(metrics.startOfDay),
      colorHex: 'var(--text)',
    },
    {
      label: 'PROFIT DEL DÍA',
      value: formatNumber(metrics.dayProfit),
      colorHex: isPositiveProfit ? STATUS_COLORS['Verde'].hex : STATUS_COLORS['Rojo'].hex,
    },
    {
      label: 'BANK ACTUAL',
      value: formatNumber(metrics.current),
      colorHex: 'var(--text)',
    },
    {
      label: 'ROI DEL DÍA',
      value: formatPct(metrics.roi),
      colorHex: isPositiveRoi ? STATUS_COLORS['Verde'].hex : STATUS_COLORS['Rojo'].hex,
    },
    {
      label: 'BANK EN JUEGO',
      value: formatNumber(metrics.inPlay),
      colorHex: STATUS_COLORS['Pendiente'].hex,
    },
    {
      label: 'BANK DISPONIBLE',
      value: formatNumber(metrics.available),
      colorHex: 'var(--text)',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          onClick={c.canEdit ? onEditInitialBank : undefined}
          className={`bg-[var(--panel)] border border-[var(--border)] rounded-xl px-4 py-3 flex flex-col justify-between shadow-xs transition-colors ${
            c.canEdit ? 'cursor-pointer hover:border-zinc-500 transition-colors' : ''
          }`}
          title={c.canEdit ? 'Hacé clic para editar bank inicial' : undefined}
        >
          <span className="text-[10px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            {c.label}
          </span>
          <span
            style={{ color: c.colorHex }}
            className="mt-2 text-xl font-bold tracking-tight"
          >
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
};
