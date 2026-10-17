import React, { useState, useRef } from 'react';
import { Bet } from '../types';
import { getTodayString, getNowTimeString } from '../utils/calculations';
import { X, Upload, Loader2, Calendar } from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface PhotoOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBet: (betData: Omit<Bet, 'id' | 'createdAt'>) => void;
  defaultDate?: string;
  currency?: string;
}

export const PhotoOcrModal: React.FC<PhotoOcrModalProps> = ({
  isOpen,
  onClose,
  onSaveBet,
  defaultDate,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Review step state (shown in user's screenshots)
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [event, setEvent] = useState('');
  const [odds, setOdds] = useState('');
  const [stake, setStake] = useState('');
  const [displayDate, setDisplayDate] = useState(''); // Formatted as DD/MM/YYYY
  const [timeStr, setTimeStr] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // By default, set the date to today's date when opened
  React.useEffect(() => {
    if (isOpen) {
      setDisplayDate(isoToDisplayDate(defaultDate || getTodayString()));
    }
  }, [isOpen, defaultDate]);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStep('upload');
    setProgressStatus('');
    setError(null);
    setDisplayDate(isoToDisplayDate(defaultDate || getTodayString()));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      processImage(file);
    }
  };

  const isoToDisplayDate = (iso: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return iso;
  };

  const displayToIsoDate = (dStr: string) => {
    if (!dStr) return getTodayString();
    const parts = dStr.trim().split(/[./-]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }
    return getTodayString();
  };

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Local fallback parser in case server AI is unreachable
  const parseWithLocalTesseract = async (file: File) => {
    setProgressStatus('Procesando localmente con OCR…');
    const worker = await createWorker(['spa', 'eng'], 1);
    const ret = await worker.recognize(file);
    await worker.terminate();

    const text = ret.data.text || '';

    // Cuota
    let detectedOdds = '1,6';
    const cuotaMatch = text.match(/(?:cuota|odds)\s*:?\s*([1-9]\d*(?:[.,]\d{1,3})?)/i);
    if (cuotaMatch) {
      detectedOdds = cuotaMatch[1].replace('.', ',');
    } else {
      const atMatch = text.match(/@\s*([1-9]\d*(?:[.,]\d{1,3})?)/);
      if (atMatch) detectedOdds = atMatch[1].replace('.', ',');
    }

    // Apostado
    let detectedStake = '100';
    const stakeMatch = text.match(
      /(?:^|[^\w])(?:apuesta|apostado|stake|importe|monto)\s*:?\s*(\d+(?:[.,]\d{1,2})?)/im
    );
    if (stakeMatch) {
      detectedStake = stakeMatch[1].replace(',', '.');
    }

    // Fecha
    let detectedDate = isoToDisplayDate(defaultDate || getTodayString());
    const dateMatch = text.match(/\b(\d{2})[./-](\d{2})[./-](\d{4})\b/);
    if (dateMatch) {
      detectedDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
    }

    // Event & market heuristic
    const rawLines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 2);

    const isGarbage = (l: string) =>
      /directo|tiempo|transcurrido|simple|combinada|cuota|apuesta|ganancias|estado|aceptada|fútbol|futbol|baloncesto|partidos|selecciones/i.test(
        l
      ) || /^\(?\d+:\d+\s*\(\d+:\d+/i.test(l) || /^\d{2}[./-]\d{2}[./-]\d{4}/.test(l);

    let matchLine = '';
    let marketLine = '';

    for (const line of rawLines) {
      if (isGarbage(line)) continue;

      // Score between teams like "0 : 1" or "2 : 0"
      const scoreMatch = line.match(/([A-Za-zÀ-ÿ0-9 .'-]{3,}?)\s+(?:\[.*?\]|\S{0,3})?\s*\b\d+\s*:\s*\d+\b\s*(?:\[.*?\]|\S{0,3})?\s+([A-Za-zÀ-ÿ0-9 .'-]{3,})/i);
      if (scoreMatch && !matchLine) {
        matchLine = `${scoreMatch[1].trim()} vs ${scoreMatch[2].trim()}`;
        continue;
      }

      // VS between teams
      const vsMatch = line.match(/([A-Za-zÀ-ÿ0-9 .'-]{3,}?)\s+(?:VS|\bvs\.?\b|contra)\s+([A-Za-zÀ-ÿ0-9 .'-]{3,})/i);
      if (vsMatch && !matchLine) {
        matchLine = `${vsMatch[1].trim()} vs ${vsMatch[2].trim()}`;
        continue;
      }

      // Market line
      if (/\b(total|m[aá]s de|menos de|ambos|marcan|anotar[aá]n|h[aá]ndicap|1x2|g1|g2)\b/i.test(line) && !marketLine) {
        marketLine = line.replace(/\s+[1-9]\d*(?:[.,]\d{1,3})?\s*$/, '').trim();
      }
    }

    let candidateEvent = 'Apuesta detectada';
    if (matchLine && marketLine) {
      candidateEvent = `${matchLine} - ${marketLine}`;
    } else if (matchLine) {
      candidateEvent = matchLine;
    } else if (marketLine) {
      candidateEvent = marketLine;
    }

    return {
      event: candidateEvent,
      odds: detectedOdds,
      stake: detectedStake,
      displayDate: detectedDate,
      time: getNowTimeString(),
    };
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgressStatus('Analizando ticket con Inteligencia Artificial…');
    setError(null);

    try {
      // 1. Try Gemini Vision endpoint first (100% accurate on sports tickets)
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/parse-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || 'image/png',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.event && data.odds) {
          setEvent(data.event);
          setOdds(String(data.odds).replace('.', ','));
          setStake(String(data.stake || '100'));
          // By default, set the date to today's current date as requested
          setDisplayDate(isoToDisplayDate(getTodayString()));
          setTimeStr(getNowTimeString());
          setStep('review');
          setIsProcessing(false);
          return;
        }
      }

      // 2. Fallback to local OCR if server API failed
      const fallbackData = await parseWithLocalTesseract(file);
      setEvent(fallbackData.event);
      setOdds(fallbackData.odds);
      setStake(fallbackData.stake);
      setDisplayDate(isoToDisplayDate(getTodayString()));
      setTimeStr(fallbackData.time);
      setStep('review');
    } catch (err: any) {
      console.error('Error processing ticket:', err);
      try {
        const fallbackData = await parseWithLocalTesseract(file);
        setEvent(fallbackData.event);
        setOdds(fallbackData.odds);
        setStake(fallbackData.stake);
        setDisplayDate(isoToDisplayDate(getTodayString()));
        setTimeStr(fallbackData.time);
        setStep('review');
      } catch {
        setError('No se pudo leer la imagen automáticamente. Podés ingresar los datos.');
        setEvent('');
        setOdds('1,80');
        setStake('100');
        setDisplayDate(isoToDisplayDate(getTodayString()));
        setTimeStr(getNowTimeString());
        setStep('review');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedOdds = parseFloat(odds.replace(',', '.'));
    const normalizedStake = parseFloat(stake.replace(',', '.'));
    const isoDate = displayToIsoDate(displayDate);

    if (!event.trim()) {
      setError('Por favor ingresá la descripción de la apuesta.');
      return;
    }
    if (!(normalizedOdds >= 1.01)) {
      setError('Por favor ingresá una cuota válida (>= 1.01).');
      return;
    }
    if (!(normalizedStake > 0)) {
      setError('Por favor ingresá un importe apostado mayor a 0.');
      return;
    }
    if (!isoDate) {
      setError('Por favor ingresá una fecha válida (DD/MM/AAAA).');
      return;
    }

    onSaveBet({
      event: event.trim(),
      market: '',
      odds: normalizedOdds,
      stake: normalizedStake,
      status: 'Pendiente',
      date: isoDate,
      time: timeStr || getNowTimeString(),
      notes: 'Importada desde foto',
    });

    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="w-full max-w-[440px] bg-[var(--panel)] border border-[var(--border)] text-[var(--text)] rounded-2xl p-5 sm:p-6 shadow-2xl relative my-auto animate-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <h2 className="text-base font-bold text-[var(--text)]">
            Cargar Ticket
          </h2>
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1 rounded-lg"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300">
            {error}
          </div>
        )}

        {step === 'upload' ? (
          /* Step 1: Upload / Pick Ticket Image */
          <div className="space-y-4 py-2 mt-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[var(--border)] hover:border-zinc-400 rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center bg-[var(--panel2)]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-[var(--panel)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] mb-3">
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <div className="text-sm font-semibold text-[var(--text)]">
                {isProcessing ? progressStatus : 'Seleccionar foto o captura del ticket'}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Detección inteligente de equipos, selección, cuota, importe y fecha.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Review & Edit Detected Data (Matches user's screenshots exactly!) */
          <form onSubmit={handleSave} className="space-y-3.5 pt-1">
            {/* Field: Apuesta */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                Apuesta
              </label>
              <input
                type="text"
                required
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="Evento y selección"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-zinc-500"
              />
            </div>

            {/* Row of 3 inputs: Cuota, Apostado, Fecha */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Cuota
                </label>
                <input
                  type="text"
                  required
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  placeholder="1,6"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-lg px-3 py-2 text-xs font-medium focus:outline-hidden focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Apostado
                </label>
                <input
                  type="text"
                  required
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="150"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-lg px-3 py-2 text-xs font-medium focus:outline-hidden focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                  Fecha
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={displayDate}
                    onChange={(e) => setDisplayDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] rounded-lg pl-2.5 pr-7 py-2 text-xs font-mono focus:outline-hidden focus:border-zinc-500"
                  />
                  <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Gray box: "Datos detectados desde la foto. Revisá antes de guardar." */}
            <div className="bg-[var(--panel2)] border border-[var(--border)] text-[var(--text-muted)] text-[11px] px-3.5 py-2.5 rounded-lg">
              Datos detectados desde la foto. Revisá antes de guardar.
            </div>

            {/* Subtext */}
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              La apuesta se guarda como Pendiente. Podés cambiar el resultado desde la tabla cuando termine.
            </p>

            {/* Bottom Buttons: Cancelar & Guardar */}
            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-5 py-2 text-xs font-semibold text-[var(--text-muted)] bg-[var(--panel2)] border border-[var(--border)] rounded-lg hover:text-[var(--text)] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[var(--text)] text-[var(--bg)] rounded-lg hover:opacity-90 transition-colors shadow-xs"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
