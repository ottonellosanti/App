import React from 'react';
import { Bet, BetStatus } from '../types';
import {
  formatDate,
  formatNumber,
  formatPct,
  getTodayString,
  getStatsForBets,
  getBankMetrics,
  generateCSV,
  downloadFile,
  STATUS_COLORS,
} from '../utils/calculations';
import { BetTable } from './BetTable';
import { Calendar, Download, Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface HistoryViewProps {
  allBets: Bet[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  initialBank: number;
  currency: string;
  onEditBet: (bet: Bet) => void;
  onDeleteBet: (bet: Bet) => void;
  onStatusChange: (betId: string, newStatus: BetStatus) => void;
  onAddNewBetForDate: (date: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  allBets,
  selectedDate,
  onSelectDate,
  initialBank,
  currency,
  onEditBet,
  onDeleteBet,
  onStatusChange,
  onAddNewBetForDate,
}) => {
  const today = getTodayString();
  const dayBets = allBets
    .filter((b) => b.date === selectedDate)
    .sort((a, b) => (b.time || '').localeCompare(a.time || ''));

  const stats = getStatsForBets(dayBets);
  const bank = getBankMetrics(allBets, initialBank, selectedDate);

  const handleShiftDay = (days: number) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + days);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    onSelectDate(`${y}-${m}-${d}`);
  };

  const handleExportDayCSV = () => {
    const csv = generateCSV(allBets, selectedDate);
    downloadFile(csv, `QuantBet_${selectedDate}.csv`, 'text/csv;charset=utf-8');
  };

  const handleExportAllCSV = () => {
    const csv = generateCSV(allBets);
    downloadFile(csv, `QuantBet_Historial_Completo.csv`, 'text/csv;charset=utf-8');
  };

  const distinctDates = Array.from(new Set(allBets.map((b) => b.date))).sort().reverse();

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* History Header & Date Picker Bar */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Historial de Planillas Diarias
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Consultá, editá y auditá apuestas y balances de cualquier fecha pasada.
          </p>
        </div>

        {/* Date Selector & Nav Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border border-[var(--border)] rounded-lg bg-[var(--panel2)] p-1">
            <button
              type="button"
              onClick={() => handleShiftDay(-1)}
              className="p-1.5 hover:bg-zinc-500/10 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              title="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => onSelectDate(e.target.value || today)}
              className="bg-transparent border-none text-xs font-mono font-medium px-2 py-1 text-[var(--text)] focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => handleShiftDay(1)}
              disabled={selectedDate >= today}
              className="p-1.5 hover:bg-zinc-500/10 disabled:opacity-30 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              title="Día siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSelectDate(today)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              selectedDate === today
                ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)] font-bold'
                : 'border-[var(--border)] bg-[var(--panel2)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={handleExportDayCSV}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:opacity-85 flex items-center gap-1.5 transition-colors"
            title="Descargar CSV del día seleccionado"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Date fast-pills for previous active days */}
      {distinctDates.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Días con apuestas:
          </span>
          {distinctDates.slice(0, 10).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onSelectDate(d)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] whitespace-nowrap transition-colors ${
                selectedDate === d
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-[var(--panel)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              {formatDate(d)} {d === today ? '(Hoy)' : ''}
            </button>
          ))}
        </div>
      )}

      {/* Historical Day Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-3.5 transition-colors shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Total Apuestas ({formatDate(selectedDate)})
          </span>
          <div className="mt-1.5 text-lg font-mono font-bold text-[var(--text)]">
            {stats.total}
          </div>
        </div>

        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-3.5 transition-colors shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Total Apostado
          </span>
          <div className="mt-1.5 text-lg font-mono font-bold text-[var(--text)]">
            {formatNumber(stats.staked)}
          </div>
        </div>

        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-3.5 transition-colors shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Profit del Día
          </span>
          <div
            style={{
              color: stats.profit >= 0 ? STATUS_COLORS['Verde'].hex : STATUS_COLORS['Rojo'].hex,
            }}
            className="mt-1.5 text-lg font-mono font-bold"
          >
            {formatNumber(stats.profit)}
          </div>
        </div>

        <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-3.5 transition-colors shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            ROI del Día
          </span>
          <div
            style={{
              color: bank.roi >= 0 ? STATUS_COLORS['Verde'].hex : STATUS_COLORS['Rojo'].hex,
            }}
            className="mt-1.5 text-lg font-mono font-bold"
          >
            {formatPct(bank.roi)}
          </div>
        </div>
      </div>

      {/* Historical Bank Status Banner */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors shadow-xs">
        <div className="text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text)]">Resumen de Bank al {formatDate(selectedDate)}:</span>{' '}
          Inicio del día:{' '}
          <b className="font-mono text-[var(--text)]">
            {formatNumber(bank.startOfDay)}
          </b>{' '}
          · Cierre calculado:{' '}
          <b className="font-mono text-[var(--text)]">
            {formatNumber(bank.current)}
          </b>{' '}
          {bank.inPlay > 0 && (
            <>
              · En juego:{' '}
              <b className="font-mono" style={{ color: STATUS_COLORS['Pendiente'].hex }}>
                {formatNumber(bank.inPlay)}
              </b>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAddNewBetForDate(selectedDate)}
          className="px-3 py-1.5 bg-[var(--text)] text-[var(--bg)] rounded-lg text-xs font-semibold hover:opacity-90 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Carga Manual en esta fecha
        </button>
      </div>

      {/* Bets Table for selected date */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-[var(--text)]">
            Apuestas registradas el {formatDate(selectedDate)}
          </h2>
          <button
            type="button"
            onClick={handleExportAllCSV}
            className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Descargar historial completo (CSV)
          </button>
        </div>

        <BetTable
          bets={dayBets}
          currency={currency}
          onEdit={onEditBet}
          onDelete={onDeleteBet}
          onStatusChange={onStatusChange}
          emptyMessage={`No hay apuestas registradas el ${formatDate(selectedDate)}.`}
          onAddNew={() => onAddNewBetForDate(selectedDate)}
        />
      </div>
    </div>
  );
};
