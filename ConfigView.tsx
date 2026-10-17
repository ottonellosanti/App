import React, { useState } from 'react';
import { AppSettings, Bet } from '../types';
import { generateCSV, downloadFile } from '../utils/calculations';
import {
  Settings,
  Moon,
  Sun,
  Wallet,
  Download,
  Upload,
  Trash2,
  ShieldAlert,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface ConfigViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  allBets: Bet[];
  onImportDatabase: (importedBets: Bet[], importedSettings?: Partial<AppSettings>) => void;
  onResetDatabase: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  settings,
  onUpdateSettings,
  allBets,
  onImportDatabase,
  onResetDatabase,
}) => {
  const [bankInput, setBankInput] = useState(String(settings.initialBank));
  const [currencyInput, setCurrencyInput] = useState(settings.currency || '');
  const [isSaved, setIsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBank = parseFloat(bankInput);
    if (!Number.isFinite(parsedBank) || parsedBank < 0) {
      alert('Ingresá un bank inicial válido.');
      return;
    }
    onUpdateSettings({
      initialBank: parsedBank,
      currency: currencyInput.trim(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDownloadBackup = () => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      bets: allBets,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    downloadFile(
      jsonStr,
      `QuantBet_backup_${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!Array.isArray(parsed.bets)) {
          throw new Error('El archivo no contiene un arreglo de apuestas válido.');
        }

        const confirmMsg = `Se importarán ${parsed.bets.length} apuestas. Esto actualizará tus datos locales. ¿Continuar?`;
        if (window.confirm(confirmMsg)) {
          onImportDatabase(parsed.bets, parsed.settings);
          alert('¡Copia de seguridad importada con éxito!');
        }
      } catch {
        setImportError(
          'Error al procesar el archivo JSON: formato inválido o datos corruptos.'
        );
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportFullCSV = () => {
    const csv = generateCSV(allBets);
    downloadFile(
      csv,
      `QuantBet_Exportacion_Total_${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8'
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Title */}
      <div className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-xs transition-colors">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Configuración y Datos
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Ajustá tu bank base, moneda, apariencia y gestioná tus respaldos de datos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Apariencia */}
        <section className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                {settings.theme === 'dark' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </div>
              <h2 className="text-sm font-bold text-[var(--text)]">
                Apariencia del Sistema
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
              Alterná entre el modo oscuro de alta fidelidad o el modo claro.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                  settings.theme === 'dark'
                    ? 'bg-zinc-800 text-white border-zinc-600 shadow-xs'
                    : 'bg-[var(--panel2)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                Modo Oscuro
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                  settings.theme === 'light'
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                    : 'bg-[var(--panel2)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                Modo Claro
              </button>
            </div>
          </div>
        </section>

        {/* Bank & Currency */}
        <section className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 shadow-xs transition-colors">
          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-[var(--text)]">
                Bankroll y Moneda
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Define tu capital base inicial y la divisa que se mostrará en todas las planillas.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Bank Inicial Base
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={bankInput}
                  onChange={(e) => setBankInput(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-hidden focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  Símbolo
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={currencyInput}
                  onChange={(e) => setCurrencyInput(e.target.value)}
                  placeholder="Opcional"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-lg px-3 py-2 text-sm font-mono font-bold text-center focus:outline-hidden focus:border-zinc-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {isSaved ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-in fade-in">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Configuración guardada
                </span>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-[var(--text)] text-[var(--bg)] rounded-lg text-xs font-semibold hover:opacity-90 transition-colors"
              >
                Guardar Parámetros
              </button>
            </div>
          </form>
        </section>

        {/* Respaldo y Exportación */}
        <section className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400">
              <Download className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-[var(--text)]">
              Copia de Seguridad y Exportación
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Descargá tu historial completo en formato JSON para respaldar tus datos o importarlo en otro dispositivo. También podés exportar a CSV para Excel/Sheets.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="flex-1 py-2.5 px-3 bg-[var(--panel2)] hover:opacity-85 text-[var(--text)] border border-[var(--border)] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar Respaldo JSON
            </button>

            <button
              type="button"
              onClick={handleExportFullCSV}
              className="flex-1 py-2.5 px-3 border border-[var(--border)] hover:opacity-85 text-[var(--text)] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Exportar Todo a CSV
            </button>
          </div>
        </section>

        {/* Restaurar Respaldo */}
        <section className="bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
              <Upload className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-[var(--text)]">
              Restaurar Copia de Seguridad
            </h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Subí un archivo <code className="font-mono text-[var(--text)] font-semibold">.json</code> descargado previamente de QuantBet para restaurar tus apuestas y balances.
          </p>

          {importError && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300">
              {importError}
            </div>
          )}

          <label className="cursor-pointer block">
            <div className="w-full py-2.5 px-3 border border-dashed border-[var(--border)] hover:border-zinc-500 rounded-lg text-center text-xs text-[var(--text)] font-medium hover:bg-zinc-500/5 transition-colors flex items-center justify-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              Seleccionar archivo de respaldo (.json)
            </div>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </section>
      </div>

      {/* Zona de Peligro / Reset */}
      <section className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4 flex-col sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
              Zona de Seguridad: Eliminar Todos los Datos Locales
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
              QuantBet almacena tus apuestas localmente en este navegador. Al presionar este botón se borrarán permanentemente todas las planillas, cuotas, notas y configuraciones guardadas en este dispositivo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            Borrar todos los datos
          </button>
        </div>
      </section>

      {/* Security Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--panel)] border border-rose-500/40 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-500/20 rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text)]">
                ¿Confirmás la eliminación permanente?
              </h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Esta acción no se puede deshacer. Se eliminarán todas las apuestas registradas ({allBets.length}) y el bankroll se reiniciará a los valores de fábrica.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onResetDatabase();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
              >
                Sí, eliminar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
