import React from 'react';
import { Calendar, History, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'history' | 'config';
  onSelectTab: (tab: 'home' | 'history' | 'config') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--header-bg)] border-t border-[var(--border)] py-2 px-6 flex items-center justify-around transition-colors"
      aria-label="Navegación principal"
    >
      <button
        type="button"
        onClick={() => onSelectTab('home')}
        className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors min-h-[42px] px-6 ${
          activeTab === 'home' ? 'text-[var(--text)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
        }`}
      >
        <Calendar className="w-4 h-4" />
        <span>Hoy</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('history')}
        className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors min-h-[42px] px-6 ${
          activeTab === 'history' ? 'text-[var(--text)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
        }`}
      >
        <History className="w-4 h-4" />
        <span>Historial</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab('config')}
        className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors min-h-[42px] px-6 ${
          activeTab === 'config' ? 'text-[var(--text)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
        }`}
      >
        <Settings className="w-4 h-4" />
        <span>Config</span>
      </button>
    </nav>
  );
};
