import React, { useState, useEffect } from 'react';
import { X, Wallet } from 'lucide-react';

interface InitialBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBank: number;
  currency: string;
  onSave: (newAmount: number) => void;
}

export const InitialBankModal: React.FC<InitialBankModalProps> = ({
  isOpen,
  onClose,
  currentBank,
  currency,
  onSave,
}) => {
  const [val, setVal] = useState(String(currentBank));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVal(String(currentBank));
    setError(null);
  }, [currentBank, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(val);
    if (!Number.isFinite(num) || num < 0) {
      setError('Por favor ingresá un monto de bank válido (mayor o igual a 0).');
      return;
    }
    onSave(num);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-[var(--text)]">
              Editar Bank Inicial
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Capital base {currency ? `(${currency})` : ''}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-xl px-3.5 py-2.5 text-base font-mono font-bold focus:outline-hidden focus:border-zinc-500"
              autoFocus
            />
          </div>

          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Este importe es la base inicial para calcular el bank al inicio de cada día, el bank actual y el rendimiento general de tu cuenta.
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
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--text)] text-[var(--bg)] hover:opacity-90 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
