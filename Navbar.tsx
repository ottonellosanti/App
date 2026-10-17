import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface NavbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  return (
    <header className="w-full bg-[var(--header-bg)] border-b border-[var(--border)] px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        <div className="text-base font-extrabold tracking-tight text-[var(--text)] select-none">
          QuantBet
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--panel2)] text-[var(--text)] hover:opacity-85 transition-colors shadow-2xs"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </div>
    </header>
  );
};
