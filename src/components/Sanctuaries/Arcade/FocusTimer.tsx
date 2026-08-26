import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

export default function FocusTimer() {
  const [mode, setMode] = useState<'focus' | 'rest'>('focus');
  const [seconds, setSeconds] = useState(25 * 60);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('');
  const [streak, setStreak] = useLocalStorage<number>('solace_arcade_streak', 0);
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
          } else {
            setMode('focus');
            setSeconds(25 * 60);
            setMessage('');
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
    // Timer is keyed to active/mode; setStreak is a storage setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mode]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-[#F0E6FF]/30 text-xs tracking-widest uppercase mb-2">{mode === 'focus' ? 'deep dive' : 'surface'}</p>
        <p className="text-[#C084FC] font-light" style={{ fontSize: '4rem', fontFamily: 'Cormorant Garamond, serif', lineHeight: 1 }}>
          {fmt(seconds)}
        </p>
      </div>

      {!active ? (
        <button onClick={() => setActive(true)}
          className="text-xs text-[#C084FC]/60 hover:text-[#C084FC] uppercase tracking-widest transition-colors duration-300 border border-[#C084FC]/20 rounded-full px-6 py-2">
          {seconds === (mode === 'focus' ? 25 * 60 : 5 * 60) ? 'begin' : 'continue'}
        </button>
      ) : (
        <button onClick={() => setActive(false)} className="text-xs text-[#F0E6FF]/30 hover:text-[#F0E6FF]/50 transition-colors duration-300">
          pause
        </button>
      )}

      {message && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#F0E6FF]/50 text-sm italic text-center max-w-xs"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {message}
        </motion.p>
      )}

      <p className="text-[#F0E6FF]/20 text-xs">focus sessions today: {streak}</p>
    </div>
  );
}
