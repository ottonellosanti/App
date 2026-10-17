import React, { useState, useEffect } from 'react';
import { Bet, BetStatus } from '../types';
import { STATUSES, getTodayString, getNowTimeString, formatMoney } from '../utils/calculations';
import { X, Calculator, Plus, Calendar, Clock } from 'lucide-react';

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (betData: Omit<Bet, 'id' | 'createdAt'>, existingId?: string) => void;
  editingBet?: Bet | null;
  defaultDate?: string;
  currency: string;
}

export const BetModal: React.FC<BetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBet,
  defaultDate,
  currency,
}) => {
  const [event, setEvent] = useState('');
  const [market, setMarket] = useState('');
  const [odds, setOdds] = useState('');
  const [stake, setStake] = useState('');
  const [status, setStatus] = useState<BetStatus>('Pendiente');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingBet) {
      setEvent(editingBet.event);
      setMarket(editingBet.market || '');
      setOdds(String(editingBet.odds));
      setStake(String(editingBet.stake));
      setStatus(editingBet.status);
      setDate(editingBet.date);
      setTime(editingBet.time || getNowTimeString());
      setNotes(editingBet.notes || '');
    } else {
      setEvent('');
      setMarket('');
      setOdds('1.85');
      setStake('100');
      setStatus('Pendiente');
      setDate(defaultDate || getTodayString());
      setTime(getNowTimeString());
      setNotes('');
    }
    setError(null);
  }, [editingBet, defaultDate, isOpen]);

  if (!isOpen) return null;

  const numOdds = parseFloat(odds) || 0;
  const numStake = parseFloat(stake) || 0;
  const potentialProfit = numOdds >= 1 ? numStake * (numOdds - 1) : 0;
  const potentialTotal = numOdds >= 1 ? numStake * numOdds : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!event.trim()) {
      setError('Por favor ingresá el nombre del evento o partido.');
      return;
    }
    if (!(numOdds >= 1.01)) {
      setError('La cuota decimal debe ser mayor o igual a 1.01.');
      return;
    }
    if (!(numStake > 0)) {
      setError('El importe apostado debe ser mayor a 0.');
      return;
    }
    if (!date) {
      setError('Por favor seleccioná una fecha.');
      return;
    }

    onSave(
      {
        event: event.trim(),
        market: market.trim(),
        odds: numOdds,
        stake: numStake,
        status,
        date,
        time: time || getNowTimeString(),
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      },
      editingBet ? editingBet.id : undefined
    );

    onClose();
  };

  const handleQuickStake = (amount: number) => {
    const current = parseFloat(stake) || 0;
    setStake(String(current + amount));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-2xl p-5 sm:p-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text)]">
              {editingBet ? 'Editar Apuesta' : 'Carga Manual'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {editingBet
                ? 'Modificá los detalles de la apuesta registrada'
                : 'Ingresá los datos de la apuesta manualmente para sumarla a la planilla'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Event Name */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1.5">
              Evento / Partido <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={180}
              placeholder="Ej. Liverpool vs Arsenal, LeBron James +25.5 pts..."
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-hidden focus:border-zinc-500"
            />
          </div>

          {/* Market */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1.5">
              Mercado / Selección
            </label>
            <input
              type="text"
              maxLength={150}
              placeholder="Ej. Más de 2.5 goles, Hándicap -1.5, Ganador local"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-hidden focus:border-zinc-500"
            />
          </div>

          {/* Odds & Stake grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1.5">
                Cuota decimal <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-400 font-mono font-bold text-xs">
                  @
                </span>
                <input
                  type="number"
                  step="0.001"
                  min="1.01"
                  required
                  placeholder="1.85"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono font-semibold text-[var(--text)] focus:outline-hidden focus:border-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1.5">
                Importe apostado <span className="text-emerald-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="100"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3.5 py-2.5 text-sm font-mono font-semibold text-[var(--text)] focus:outline-hidden focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Quick stake increment buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider shrink-0 mr-1">
              Rápido:
            </span>
            {[10, 25, 50, 100, 250].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickStake(amt)}
                className="px-2.5 py-1 bg-[var(--panel2)] border border-[var(--border)] text-[var(--text)] rounded-md font-mono text-[11px] transition-colors hover:opacity-85"
              >
                +{amt}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setStake('100')}
              className="px-2 py-1 text-[var(--text-dim)] hover:text-[var(--text)] text-[11px]"
            >
              Reset
            </button>
          </div>

          {/* Potential Return Calculator Strip */}
          {numOdds >= 1.01 && numStake > 0 && (
            <div className="bg-[var(--panel2)] border border-[var(--border)] rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Ganancia neta estimada (Verde):</span>
              </div>
              <div className="font-mono font-bold text-emerald-400">
                +{formatMoney(potentialProfit, currency)}{' '}
                <span className="text-[var(--text-dim)] text-[11px] font-normal">
                  (Retorno {formatMoney(potentialTotal, currency)})
                </span>
              </div>
            </div>
          )}

          {/* Status & Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1.5">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BetStatus)}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-hidden focus:border-zinc-500"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st} className="bg-[var(--panel)] text-[var(--text)]">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1.5">
                Fecha de registro <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-hidden focus:border-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1.5">
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-hidden focus:border-zinc-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              maxLength={500}
              rows={2}
              placeholder="Estrategia, casa de apuestas, tipster o análisis..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-xl px-3.5 py-2 text-xs placeholder:text-[var(--text-dim)] focus:outline-hidden focus:border-zinc-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[var(--text)] text-[var(--bg)] hover:opacity-90 transition-colors shadow-xs"
            >
              {editingBet ? 'Guardar Cambios' : 'Registrar Apuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
