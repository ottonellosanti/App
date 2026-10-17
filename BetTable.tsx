import React, { useState } from 'react';
import { Bet, BetStatus } from '../types';
import { STATUSES, STATUS_COLORS, calcProfit, formatNumber, formatOdds } from '../utils/calculations';
import { Pencil, Trash2, ChevronDown } from 'lucide-react';

interface BetTableProps {
  bets: Bet[];
  currency?: string;
  onEdit: (bet: Bet) => void;
  onDelete: (bet: Bet) => void;
  onStatusChange: (betId: string, newStatus: BetStatus) => void;
  emptyMessage?: string;
  onAddNew?: () => void;
}

export const BetTable: React.FC<BetTableProps> = ({
  bets,
  onEdit,
  onDelete,
  onStatusChange,
  emptyMessage = 'Todavía no hay apuestas registradas.',
  onAddNew,
}) => {
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

  if (bets.length === 0) {
    return (
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-8 text-center flex flex-col items-center justify-center shadow-xs transition-colors">
        <p className="text-xs text-[var(--text-muted)] mb-3">{emptyMessage}</p>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="px-3.5 py-1.5 bg-[var(--text)] text-[var(--bg)] font-semibold text-xs rounded-lg hover:opacity-90 transition-colors"
          >
            ＋ Carga Manual
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-4 sm:p-5 overflow-hidden shadow-xs transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="text-[var(--text-muted)] text-[11px] font-medium border-b border-[var(--border)] pb-3">
              <th className="pb-3 pr-4 font-normal">Apuesta</th>
              <th className="pb-3 px-3 font-normal whitespace-nowrap">Hora</th>
              <th className="pb-3 px-3 font-normal whitespace-nowrap">Resultado</th>
              <th className="pb-3 px-3 font-normal whitespace-nowrap">Cuota</th>
              <th className="pb-3 px-3 font-normal whitespace-nowrap">Apostado</th>
              <th className="pb-3 px-3 font-normal whitespace-nowrap">Ganancia</th>
              <th className="pb-3 pl-3 font-normal text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {bets.map((b) => {
              const profitVal = calcProfit(b);
              const isProfitPos = profitVal > 0;
              const isProfitNeg = profitVal < 0;

              return (
                <tr key={b.id} className="hover:bg-zinc-500/5 transition-colors">
                  {/* Apuesta description */}
                  <td className="py-3.5 pr-4 text-[var(--text)] font-medium text-[12px] leading-relaxed max-w-sm sm:max-w-md">
                    {b.event}
                  </td>

                  {/* Hora */}
                  <td className="py-3.5 px-3 text-[var(--text-muted)] text-[12px] whitespace-nowrap">
                    {b.time || '—'}
                  </td>

                  {/* Resultado dropdown matching exact chart color */}
                  <td className="py-3.5 px-3 whitespace-nowrap relative">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenStatusDropdownId(
                            openStatusDropdownId === b.id ? null : b.id
                          )
                        }
                        style={{
                          backgroundColor: STATUS_COLORS[b.status].hex,
                          color: STATUS_COLORS[b.status].textColor,
                          textShadow:
                            STATUS_COLORS[b.status].textColor === '#ffffff'
                              ? '0 1px 2px rgba(0,0,0,0.3)'
                              : 'none',
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-opacity hover:opacity-90 shadow-2xs select-none"
                      >
                        <span>{b.status}</span>
                        <ChevronDown
                          className="w-3.5 h-3.5"
                          style={{ color: STATUS_COLORS[b.status].textColor }}
                        />
                      </button>

                      {openStatusDropdownId === b.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenStatusDropdownId(null)}
                          />
                          <div className="absolute left-0 mt-1.5 w-40 bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            {STATUSES.map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  onStatusChange(b.id, st);
                                  setOpenStatusDropdownId(null);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-zinc-500/10 transition-colors flex items-center gap-2 ${
                                  b.status === st
                                    ? 'text-[var(--text)] font-bold bg-zinc-500/10'
                                    : 'text-[var(--text-muted)]'
                                }`}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                  style={{ backgroundColor: STATUS_COLORS[st].hex }}
                                />
                                <span className="flex-1">{st}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Cuota */}
                  <td className="py-3.5 px-3 text-[var(--text)] text-[12px] whitespace-nowrap font-mono">
                    {formatOdds(b.odds)}
                  </td>

                  {/* Apostado */}
                  <td className="py-3.5 px-3 text-[var(--text)] text-[12px] whitespace-nowrap font-mono">
                    {formatNumber(b.stake)}
                  </td>

                  {/* Ganancia */}
                  <td className="py-3.5 px-3 text-[12px] whitespace-nowrap font-medium font-mono">
                    {b.status === 'Pendiente' ? (
                      <span className="text-[var(--text-muted)]">—</span>
                    ) : (
                      <span
                        style={{
                          color: isProfitPos
                            ? STATUS_COLORS['Verde'].hex
                            : isProfitNeg
                            ? STATUS_COLORS['Rojo'].hex
                            : 'var(--text-muted)',
                        }}
                        className="font-bold"
                      >
                        {formatNumber(profitVal)}
                      </span>
                    )}
                  </td>

                  {/* Row Actions: Pencil and Red Trash Can */}
                  <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(b)}
                        className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1"
                        title="Editar apuesta"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(b)}
                        className="text-rose-500 hover:text-rose-400 transition-colors p-1"
                        title="Eliminar apuesta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
