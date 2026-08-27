import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

/** Kept for compatibility. Hidden from Arcade entry in Phase 4B. Key solace_arcade_streak is left untouched. */
export default function FocusTimer() {
  const [mode, setMode] = useState<'focus' | 'rest'>('focus');
  const [seconds, setSeconds] = useState(25 * 60);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('');
  const [streak, setStreak] = useLocalStorage<number>('solace_arcade_streak', 0);
  const [status, setStatus] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;
    timer.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timer.current!);
          setActive(false);
          if (mode === 'focus') {
            setStreak(n => n + 1);
            setMode('rest');
            setSeconds(5 * 60);
            setMessage('Something worth noticing was built in that quiet.');
            setStatus('Focus session complete. Rest period ready.');
          } else {
            setMode('focus');
            setSeconds(25 * 60);
            setMessage('');
            setStatus('Rest complete. Focus period ready.');
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mode]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const reset = () => {
    setActive(false);
    setMode('focus');
    setSeconds(25 * 60);
    setMessage('');
    setStatus('Timer reset.');
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-[#F0E6FF]/70 text-xs tracking-widest uppercase mb-2">{mode === 'focus' ? 'deep dive' : 'surface'}</p>
        <p
          className="text-[#C084FC] font-light"
          style={{ fontSize: '4rem', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1 }}
          aria-hidden="true"
        >
          {fmt(seconds)}
        </p>
        <p className="sr-only">{mode === 'focus' ? 'Focus' : 'Rest'} timer, {fmt(seconds)} remaining, {active ? 'running' : 'paused'}.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {!active ? (
          <button
            type="button"
            onClick={() => { setActive(true); setStatus(''); }}
            className="text-xs text-[#C084FC] uppercase tracking-widest border border-[#C084FC]/40 rounded-full px-6 py-2"
          >
            {seconds === (mode === 'focus' ? 25 * 60 : 5 * 60) ? 'Start' : 'Continue'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActive(false)}
            className="text-xs text-[#F0E6FF]/80 uppercase tracking-widest border border-[#F0E6FF]/30 rounded-full px-6 py-2"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="text-xs text-[#F0E6FF]/80 uppercase tracking-widest border border-[#F0E6FF]/25 rounded-full px-6 py-2"
        >
          Reset
        </button>
      </div>

      <div aria-live="polite" className="min-h-[1.5rem] text-center">
        {status && <span className="sr-only">{status}</span>}
        {message && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#F0E6FF]/80 text-sm italic max-w-xs"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {message}
          </motion.p>
        )}
      </div>

      <p className="text-[#F0E6FF]/65 text-xs">focus sessions today: {streak}</p>
    </div>
  );
}
