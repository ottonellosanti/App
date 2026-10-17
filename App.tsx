/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bet, BetStatus, AppSettings, AppDatabase } from './types';
import {
  getTodayString,
  formatDate,
  getBankMetrics,
  getStatsForBets,
} from './utils/calculations';
import { loadDatabase, saveDatabase, clearDatabase } from './utils/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { BankGrid } from './components/BankGrid';
import { StatsGrid } from './components/StatsGrid';
import { ResultChart } from './components/ResultChart';
import { BetTable } from './components/BetTable';
import { BetModal } from './components/BetModal';
import { PhotoOcrModal } from './components/PhotoOcrModal';
import { InitialBankModal } from './components/InitialBankModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { HistoryView } from './components/HistoryView';
import { ConfigView } from './components/ConfigView';
import { Sun, Moon, Camera, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'config'>('home');
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayString());
  const [historySelectedDate, setHistorySelectedDate] = useState<string>(() => getTodayString());

  // Modals state
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [betModalDefaultDate, setBetModalDefaultDate] = useState<string>(getTodayString());

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [deletingBet, setDeletingBet] = useState<Bet | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(
    null
  );

  const showToast = useCallback((text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Theme synchronization
  useEffect(() => {
    const isLight = db.settings.theme === 'light';
    if (isLight) {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isLight ? '#f4f5f8' : '#09090b');
    }
  }, [db.settings.theme]);

  // Persist DB changes
  const updateDb = useCallback(
    (updater: (prev: AppDatabase) => AppDatabase) => {
      setDb((prev) => {
        const next = updater(prev);
        saveDatabase(next);
        return next;
      });
    },
    []
  );

  // Midnight rollover check
  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayString();
      if (today !== currentDate) {
        setCurrentDate(today);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [currentDate]);

  // Today's bets
  const todayBets = useMemo(() => {
    return db.bets
      .filter((b) => b.date === currentDate)
      .sort((a, b) => (b.time || '').localeCompare(a.time || ''));
  }, [db.bets, currentDate]);

  // Financial calculations for today
  const todayStats = useMemo(() => getStatsForBets(todayBets), [todayBets]);
  const todayBankMetrics = useMemo(
    () => getBankMetrics(db.bets, db.settings.initialBank, currentDate),
    [db.bets, db.settings.initialBank, currentDate]
  );

  // Status changer handler
  const handleStatusChange = useCallback(
    (betId: string, newStatus: BetStatus) => {
      updateDb((prev) => ({
        ...prev,
        bets: prev.bets.map((b) =>
          b.id === betId ? { ...b, status: newStatus, updatedAt: new Date().toISOString() } : b
        ),
      }));
      showToast(`Estado actualizado: ${newStatus}`);
    },
    [updateDb, showToast]
  );

  // Save or Edit bet
  const handleSaveBet = useCallback(
    (betData: Omit<Bet, 'id' | 'createdAt'>, existingId?: string) => {
      updateDb((prev) => {
        if (existingId) {
          return {
            ...prev,
            bets: prev.bets.map((b) =>
              b.id === existingId
                ? {
                    ...b,
                    ...betData,
                    updatedAt: new Date().toISOString(),
                  }
                : b
            ),
          };
        } else {
          const newBet: Bet = {
            id: crypto.randomUUID
              ? crypto.randomUUID()
              : Date.now().toString(36) + Math.random().toString(36).substring(2),
            ...betData,
            createdAt: new Date().toISOString(),
          };
          return {
            ...prev,
            bets: [newBet, ...prev.bets],
          };
        }
      });

      showToast(existingId ? 'Apuesta actualizada' : 'Apuesta registrada');
    },
    [updateDb, showToast]
  );

  // Delete bet
  const handleConfirmDelete = useCallback(() => {
    if (!deletingBet) return;
    updateDb((prev) => ({
      ...prev,
      bets: prev.bets.filter((b) => b.id !== deletingBet.id),
    }));
    showToast('Apuesta eliminada');
    setDeletingBet(null);
  }, [deletingBet, updateDb, showToast]);

  // Update Settings
  const handleUpdateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      updateDb((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...newSettings,
        },
      }));
      showToast('Configuración guardada');
    },
    [updateDb, showToast]
  );

  // Import database backup
  const handleImportDatabase = useCallback(
    (importedBets: Bet[], importedSettings?: Partial<AppSettings>) => {
      updateDb((prev) => ({
        bets: importedBets,
        settings: {
          ...prev.settings,
          ...(importedSettings || {}),
        },
      }));
      showToast(`Se importaron ${importedBets.length} apuestas.`);
    },
    [updateDb, showToast]
  );

  // Reset database
  const handleResetDatabase = useCallback(() => {
    clearDatabase();
    setDb({
      bets: [],
      settings: {
        theme: 'dark',
        initialBank: 1000,
        currency: '',
      },
    });
    showToast('Base de datos reiniciada');
  }, [showToast]);

  const handleToggleTheme = useCallback(() => {
    handleUpdateSettings({
      theme: db.settings.theme === 'dark' ? 'light' : 'dark',
    });
  }, [db.settings.theme, handleUpdateSettings]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24 font-sans selection:bg-emerald-500/30 transition-colors">
      {/* Top Bar with QuantBet branding */}
      <Navbar theme={db.settings.theme} onToggleTheme={handleToggleTheme} />

      {/* Main Container */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-5 pb-8 space-y-4">
        {/* VIEW 1: HOME (Hoy) */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header: Planilla del DD/MM/YYYY + Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-sm font-bold text-[var(--text)]">
                  Planilla del {formatDate(currentDate)}
                </h1>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Resultados, ganancias y bank.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Theme toggle button */}
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:opacity-80 transition-colors"
                  title={db.settings.theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  aria-label="Cambiar tema"
                >
                  {db.settings.theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                </button>

                {/* Cargar Ticket button */}
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] text-[var(--text)] hover:opacity-85 text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Camera className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Cargar Ticket</span>
                </button>

                {/* + Carga Manual button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingBet(null);
                    setBetModalDefaultDate(currentDate);
                    setIsBetModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--text)] text-[var(--bg)] hover:opacity-90 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Carga Manual</span>
                </button>
              </div>
            </div>

            {/* Row 1: Summary Counts (6 cards) */}
            <StatsGrid stats={todayStats} />

            {/* Row 2: Middle Split (Table ~65% + Donut Chart ~35%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
              <div className="lg:col-span-8">
                <BetTable
                  bets={todayBets}
                  onEdit={(b) => {
                    setEditingBet(b);
                    setIsBetModalOpen(true);
                  }}
                  onDelete={(b) => setDeletingBet(b)}
                  onStatusChange={handleStatusChange}
                  onAddNew={() => {
                    setEditingBet(null);
                    setBetModalDefaultDate(currentDate);
                    setIsBetModalOpen(true);
                  }}
                />
              </div>

              <div className="lg:col-span-4">
                <ResultChart bets={todayBets} />
              </div>
            </div>

            {/* Row 3: Bottom Bankroll Grid (7 cards) */}
            <BankGrid
              metrics={todayBankMetrics}
              onEditInitialBank={() => setIsBankModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW 2: HISTORIAL */}
        {activeTab === 'history' && (
          <HistoryView
            allBets={db.bets}
            selectedDate={historySelectedDate}
            onSelectDate={setHistorySelectedDate}
            initialBank={db.settings.initialBank}
            currency={db.settings.currency}
            onEditBet={(b) => {
              setEditingBet(b);
              setIsBetModalOpen(true);
            }}
            onDeleteBet={(b) => setDeletingBet(b)}
            onStatusChange={handleStatusChange}
            onAddNewBetForDate={(date) => {
              setEditingBet(null);
              setBetModalDefaultDate(date);
              setIsBetModalOpen(true);
            }}
          />
        )}

        {/* VIEW 3: CONFIGURACIÓN */}
        {activeTab === 'config' && (
          <ConfigView
            settings={db.settings}
            onUpdateSettings={handleUpdateSettings}
            allBets={db.bets}
            onImportDatabase={handleImportDatabase}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Modal: New / Edit Bet */}
      <BetModal
        isOpen={isBetModalOpen}
        onClose={() => {
          setIsBetModalOpen(false);
          setEditingBet(null);
        }}
        onSave={handleSaveBet}
        editingBet={editingBet}
        defaultDate={betModalDefaultDate}
        currency={db.settings.currency}
      />

      {/* Modal: Photo Ticket Scanner with OCR */}
      <PhotoOcrModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSaveBet={(newBet) => {
          handleSaveBet(newBet);
          if (newBet.date !== currentDate) {
            setActiveTab('history');
            setHistorySelectedDate(newBet.date);
          }
        }}
        defaultDate={activeTab === 'history' ? historySelectedDate : currentDate}
        currency={db.settings.currency}
      />

      {/* Modal: Initial Bank Quick Edit */}
      <InitialBankModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        currentBank={db.settings.initialBank}
        currency={db.settings.currency}
        onSave={(newAmount) => handleUpdateSettings({ initialBank: newAmount })}
      />

      {/* Modal: Delete Bet Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deletingBet}
        onClose={() => setDeletingBet(null)}
        onConfirm={handleConfirmDelete}
        bet={deletingBet}
        currency={db.settings.currency}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
            toastMessage.isError
              ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              : 'bg-[var(--panel)] border-[var(--border)] text-[var(--text)]'
          }`}
        >
          {toastMessage.isError ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
