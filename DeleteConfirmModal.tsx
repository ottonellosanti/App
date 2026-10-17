import React from 'react';
import { Bet } from '../types';
import { Trash2, X } from 'lucide-react';
import { formatNumber } from '../utils/calculations';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bet: Bet | null;
  currency: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bet,
}) => {
  if (!isOpen || !bet) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4"
        role="dialog"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-rose-500">
            <Trash2 className="w-4 h-4" />
            <h3 className="text-sm font-bold text-[var(--text)]">
              Eliminar Apuesta
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[var(--text)] leading-relaxed">
          ¿Estás seguro de que querés eliminar la apuesta para{' '}
          <strong className="font-bold">{bet.event}</strong> (
          {bet.market ? `${bet.market} · ` : ''}
          {formatNumber(bet.stake)} @{Number(bet.odds).toFixed(2)})?
        </p>

        <p className="text-[11px] text-[var(--text-muted)]">
          Esta acción recalculará inmediatamente el bankroll y no se puede deshacer.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
