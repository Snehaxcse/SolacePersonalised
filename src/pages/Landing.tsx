import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { readSuggestedSanctuary } from '../utils/solaceMemory';
import {
  SANCTUARY_LABELS,
  SANCTUARY_NEEDS,
  SANCTUARY_TYPES,
  sanctuaryRoute,
  type SanctuaryType,
} from '../utils/sanctuaries';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const gradientColors = [
  ['#C4622D', '#1A1F3A'],
  ['#1A1F3A', '#5C8A5E'],
  ['#5C8A5E', '#7C5CBF'],
  ['#7C5CBF', '#C4622D'],
];

export default function Landing() {
  const navigate = useNavigate();
  const reduceMotion = usePrefersReducedMotion();
  const [colorIndex, setColorIndex] = useState(0);
  const [suggested] = useState<SanctuaryType | null>(() => readSuggestedSanctuary());
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setColorIndex(i => (i + 1) % gradientColors.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  const [from, to] = gradientColors[colorIndex];
  const enter = reduceMotion
    ? { initial: false as const, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
    : undefined;

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 30% 40%, ${from}22 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, ${to}22 0%, transparent 60%), #0e0e12`,
        transition: reduceMotion ? undefined : 'background 6s ease',
      }}
    >
      {!reduceMotion && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              `radial-gradient(ellipse at 30% 40%, ${from}18 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, ${to}18 0%, transparent 55%)`,
              `radial-gradient(ellipse at 35% 45%, ${from}28 0%, transparent 65%), radial-gradient(ellipse at 65% 55%, ${to}28 0%, transparent 65%)`,
              `radial-gradient(ellipse at 30% 40%, ${from}18 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, ${to}18 0%, transparent 55%)`,
            ],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <main id="main" className="relative z-10 flex flex-col items-center text-center px-8 max-w-md">
        <motion.h1
          initial={enter ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.2 }}
          className="text-7xl sm:text-8xl font-light text-white tracking-tight mb-3"
          style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300 }}
        >
          Solace
        </motion.h1>

        {suggested ? (
          <>
            <motion.p
              initial={enter ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.5 }}
              className="text-lg sm:text-xl font-light text-white/80 mb-2"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              welcome back.
            </motion.p>
            <motion.p
              initial={enter ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.75 }}
              className="text-sm font-light text-white/70 mb-10 tracking-wide"
            >
              your space is still here.
            </motion.p>

            {!choosing ? (
              <>
                <motion.button
                  type="button"
                  initial={enter ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 1 }}
                  onClick={() => navigate(sanctuaryRoute(suggested))}
                  className="relative px-10 py-3.5 rounded-full border border-white/30 text-white text-sm font-light tracking-widest uppercase hover:border-white/60 hover:text-white transition-all duration-500"
                  style={{ letterSpacing: '0.15em' }}
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                >
                  return to {SANCTUARY_LABELS[suggested]}
                </motion.button>
                <motion.button
                  type="button"
                  initial={enter ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 1.2 }}
                  onClick={() => setChoosing(true)}
                  className="mt-5 text-xs font-light text-white/70 hover:text-white tracking-wide transition-colors duration-300 rounded-sm"
                >
                  I need something else today
                </motion.button>
              </>
            ) : (
              <motion.div
                initial={enter ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col gap-2 text-left"
              >
                {SANCTUARY_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => navigate(sanctuaryRoute(type))}
                    className="rounded-2xl px-4 py-3 border border-white/25 text-white hover:border-white/50 hover:bg-white/5 transition-colors duration-300"
                  >
                    <span className="block text-sm font-light">{SANCTUARY_NEEDS[type]}</span>
                    <span className="block text-[10px] text-white/65 mt-1 tracking-wide">
                      {SANCTUARY_LABELS[type]}
                      {type === suggested ? ' · your suggested space' : ''}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}

            <motion.button
              type="button"
              initial={enter ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 1.5 }}
              onClick={() => navigate('/quiz')}
              className="mt-8 text-[11px] font-light text-white/65 hover:text-white tracking-wide transition-colors duration-300 rounded-sm"
            >
              take the questions again
            </motion.button>
          </>
        ) : (
          <>
            <motion.p
              initial={enter ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.6 }}
              className="text-lg sm:text-xl font-light tracking-[0.2em] uppercase text-white/75 mb-2"
              style={{ letterSpacing: '0.25em' }}
            >
              find your calm.
            </motion.p>
            <motion.p
              initial={enter ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 1.0 }}
              className="text-sm font-light text-white/70 mb-14 tracking-wide"
            >
              a space built around you.
            </motion.p>
            <motion.button
              type="button"
              initial={enter ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 1.4 }}
              onClick={() => navigate('/quiz')}
              className="relative px-10 py-3.5 rounded-full border border-white/30 text-white text-sm font-light tracking-widest uppercase hover:border-white/60 group"
              style={{ letterSpacing: '0.15em' }}
              whileHover={reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              <span className="relative z-10">Begin</span>
            </motion.button>
          </>
        )}

        <motion.p
          initial={enter ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 2 }}
          className="mt-12 text-[10px] font-light text-white/60 tracking-wider text-center leading-relaxed"
        >
          not therapy. not a diagnosis.
          <br />
          just a place that feels like yours.
        </motion.p>
      </main>
    </motion.div>
  );
}
