import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import { getGardenReminder } from '../../../utils/claudeService';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useAiConsent } from '../../../context/AiConsentContext';
import { clampProgress, progressToStage, readPlantProgress } from '../../../utils/solaceMemory';

interface Stone {
  text: string;
  date: string;
}

type PlantStage = 0 | 1 | 2 | 3 | 4;

const STAGE_NAMES = ['seed', 'sprout', 'small plant', 'growing', 'full bloom'];

function PlantSVG({ stage, drooping }: { stage: PlantStage; drooping: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 200 260"
      className="w-48 h-64 sm:w-56 sm:h-72"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Pot stays grounded */}
      <path d="M70 230 Q100 255 130 230 L140 200 H60 Z" fill="#8B6914" opacity="0.7" />
      <rect x="58" y="195" width="84" height="12" rx="5" fill="#A07820" opacity="0.6" />

      <g transform={drooping ? 'rotate(6, 100, 195)' : undefined}>

      {/* Stem */}
      {stage >= 1 && (
        <motion.path
          d={drooping ? "M100 195 Q100 160 98 130 Q96 110 95 90" : "M100 195 Q100 160 100 130 Q100 110 100 90"}
          stroke="#5C8A5E"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      )}

      {/* Small leaves — stage 2+ */}
      {stage >= 2 && (
        <>
          <motion.ellipse cx="82" cy="155" rx="15" ry="8" fill="#A8C5A0" transform="rotate(-30 82 155)"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} />
          <motion.ellipse cx="118" cy="145" rx="15" ry="8" fill="#5C8A5E" transform="rotate(30 118 145)"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} />
        </>
      )}

      {/* More leaves — stage 3+ */}
      {stage >= 3 && (
        <>
          <motion.ellipse cx="75" cy="115" rx="18" ry="9" fill="#A8C5A0" transform="rotate(-45 75 115)"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }} />
          <motion.ellipse cx="122" cy="108" rx="18" ry="9" fill="#5C8A5E" transform="rotate(45 122 108)"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} />
          <motion.ellipse cx="100" cy="95" rx="20" ry="10" fill="#7DB87F" transform="rotate(-10 100 95)"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} />
        </>
      )}

      {/* Flower — stage 4 */}
      {stage >= 4 && (
        <>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <motion.ellipse
              key={angle}
              cx={100 + 14 * Math.cos((angle * Math.PI) / 180)}
              cy={85 + 14 * Math.sin((angle * Math.PI) / 180)}
              rx="8" ry="5"
              fill="#F9A8D4"
              transform={`rotate(${angle} ${100 + 14 * Math.cos((angle * Math.PI) / 180)} ${85 + 14 * Math.sin((angle * Math.PI) / 180)})`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.6 }}
            />
          ))}
          <motion.circle cx="100" cy="85" r="9" fill="#FDE68A"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7, duration: 0.5, type: 'spring' }} />
        </>
      )}

      {/* Seed / seedling — stage 0 */}
      {stage === 0 && (
        <motion.ellipse cx="100" cy="198" rx="5" ry="4" fill="#8B6914" opacity="0.6"
          animate={{ opacity: [0.6, 0.9, 0.6] }} transition={{ repeat: Infinity, duration: 3 }} />
      )}

      {/* Droop effect */}
      {drooping && stage >= 2 && (
        <motion.path d="M100 160 Q90 175 85 190" stroke="#A8C5A0" strokeWidth="2" fill="none"
          strokeLinecap="round" opacity="0.5" />
      )}
      </g>
    </motion.svg>
  );
}

type BreathPhase = 'idle' | 'in' | 'hold' | 'out';

let gardenVisitAppliedFor = '';

export default function GardenSanctuary() {
  const { preference } = useAiConsent();
  const [stage, setStage] = useLocalStorage<PlantStage>('solace_plant_stage', 0);
  const [progress, setProgress] = useLocalStorage<number>('solace_plant_progress', readPlantProgress());
  const [visits, setVisits] = useLocalStorage<number>('solace_plant_visits', 0);
  const [firstVisit, setFirstVisit] = useLocalStorage<string>('solace_plant_first_visit', '');
  const [lastVisit, setLastVisit] = useLocalStorage<string>('solace_plant_last_visit', '');
  const [stones, setStones] = useLocalStorage<Stone[]>('solace_gratitude_stones', []);
  const [reminder, setReminder] = useLocalStorage<string>('solace_garden_reminder', '');
  const [stoneInput, setStoneInput] = useState('');
  const [hoveredStone, setHoveredStone] = useState<number | null>(null);
  const [showPlantTooltip, setShowPlantTooltip] = useState(false);
  const [softDroop, setSoftDroop] = useState(false);
  const [keptPlace, setKeptPlace] = useState(false);

  // Breathing
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('idle');
  const [breathCycles, setBreathCycles] = useState(0);
  const [dimmed, setDimmed] = useState(false);
  const breathTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayStage = progressToStage(typeof progress === 'number' ? progress : 0);
  const safeStones = Array.isArray(stones) ? stones : [];

  useEffect(() => {
    const today = new Date().toDateString();
    let previous = typeof lastVisit === 'string' ? lastVisit : '';
    try {
      const raw = window.localStorage.getItem('solace_plant_last_visit');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'string') previous = parsed;
        } catch {
          previous = raw;
        }
      }
    } catch {
      // private mode
    }

    let awayMs = 0;
    if (previous && previous !== today) {
      const prevTime = new Date(previous).getTime();
      if (Number.isFinite(prevTime)) awayMs = Date.now() - prevTime;
    }

    if (awayMs > 3 * 24 * 60 * 60 * 1000) {
      setSoftDroop(true);
      setKeptPlace(true);
    }

    if (previous !== today && gardenVisitAppliedFor !== today) {
      gardenVisitAppliedFor = today;
      const current = clampProgress(
        typeof progress === 'number' ? progress : readPlantProgress(stage)
      );
      const next = Math.min(4, current + 0.25);
      const nextStage = progressToStage(next);
      const nextVisits = (typeof visits === 'number' && Number.isFinite(visits) && visits >= 0 ? visits : 0) + 1;
      const nextFirst = !firstVisit || typeof firstVisit !== 'string' ? today : firstVisit;
      try {
        window.localStorage.setItem('solace_plant_last_visit', JSON.stringify(today));
        window.localStorage.setItem('solace_plant_progress', JSON.stringify(next));
        window.localStorage.setItem('solace_plant_stage', JSON.stringify(nextStage));
        window.localStorage.setItem('solace_plant_visits', JSON.stringify(nextVisits));
        window.localStorage.setItem('solace_plant_first_visit', JSON.stringify(nextFirst));
      } catch {
        // private mode
      }
      setVisits(nextVisits);
      setLastVisit(today);
      setFirstVisit(nextFirst);
      setProgress(next);
      setStage(nextStage);
    }
    // Once per mount/calendar day. Reading lastVisit from storage is the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!softDroop) return;
    const timer = setTimeout(() => setSoftDroop(false), 6000);
    return () => clearTimeout(timer);
  }, [softDroop]);

  useEffect(() => {
    if (preference !== 'enabled') return;
    if (!reminder) {
      getGardenReminder().then(r => setReminder(r));
    }
  }, [preference]);

  const addStone = () => {
    if (!stoneInput.trim()) return;
    const newStone: Stone = { text: stoneInput.trim(), date: new Date().toLocaleDateString() };
    const updated = [...safeStones, newStone].slice(-20);
    setStones(updated);
    setStoneInput('');
  };

  const runBreath = useCallback((phase: BreathPhase, cycles: number) => {
    const durations: { [k in BreathPhase]: number } = { idle: 0, in: 4000, hold: 4000, out: 6000 };
    if (phase === 'idle') return;
    breathTimer.current = setTimeout(() => {
      let next: BreathPhase;
      let nextCycles = cycles;
      if (phase === 'in') next = 'hold';
      else if (phase === 'hold') next = 'out';
      else {
        next = 'in';
        nextCycles = cycles + 1;
        setBreathCycles(nextCycles);
        if (nextCycles >= 3) {
          setDimmed(true);
          setTimeout(() => setDimmed(false), 5000);
        }
      }
      setBreathPhase(next);
      runBreath(next, nextCycles);
    }, durations[phase]);
  }, []);

  const startBreath = () => {
    setBreathPhase('in');
    setBreathCycles(0);
    setDimmed(false);
    runBreath('in', 0);
  };

  const stopBreath = () => {
    setBreathPhase('idle');
    if (breathTimer.current) clearTimeout(breathTimer.current);
    setDimmed(false);
  };

  useEffect(() => () => { if (breathTimer.current) clearTimeout(breathTimer.current); }, []);

  const circleScale = breathPhase === 'in' ? 1.4 : breathPhase === 'out' ? 0.9 : breathPhase === 'hold' ? 1.4 : 1;
  const breathLabel = breathPhase === 'in' ? 'breathe in' : breathPhase === 'hold' ? 'hold' : breathPhase === 'out' ? 'breathe out' : '';

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#E8F0E9' }}
      animate={{ opacity: dimmed ? 0.6 : 1 }}
      transition={{ duration: 2 }}
    >
      <SanctuaryHeader sanctuaryName="the garden" textColor="text-[#5C8A5E]" />

      <div className="flex-1 pt-20 pb-8 px-4 sm:px-8 flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto w-full">
        {/* Left: Plant + Breathing */}
        <div className="flex flex-col items-center gap-6 lg:w-1/2">
          {/* Plant */}
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setShowPlantTooltip(true)}
            onMouseLeave={() => setShowPlantTooltip(false)}
          >
            <PlantSVG stage={displayStage} drooping={softDroop} />
            <AnimatePresence>
              {showPlantTooltip && (
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 text-xs text-[#5C8A5E] whitespace-nowrap shadow-sm"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  you've visited {typeof visits === 'number' && visits > 0 ? visits : 1} time{(typeof visits === 'number' && visits === 1) ? '' : 's'}. thank you for coming back.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-[#8B6914]/50 text-xs tracking-wide text-center">
            {STAGE_NAMES[displayStage]}
            {keptPlace && <span className="block mt-1">the garden kept your place.</span>}
            {typeof firstVisit === 'string' && firstVisit && <span className="block mt-1">growing since {firstVisit}</span>}
          </p>

          {/* Breathing circle */}
          <div className="flex flex-col items-center gap-4 mt-4">
            <div className="relative flex items-center justify-center w-40 h-40">
              {/* Rotating leaves */}
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ width: 10, height: 24, borderRadius: '50%', backgroundColor: '#A8C5A0', opacity: 0.5 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear', delay: i * 5 }}
                  initial={{ rotate: i * 90, transformOrigin: '5px 80px' }}
                />
              ))}
              <motion.div
                className="rounded-full flex items-center justify-center"
                style={{ width: 80, height: 80, backgroundColor: '#5C8A5E' }}
                animate={{ scale: circleScale }}
                transition={{ duration: breathPhase === 'in' ? 4 : breathPhase === 'out' ? 6 : 0.3, ease: 'easeInOut' }}
              >
                <AnimatePresence mode="wait">
                  <motion.p key={breathPhase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-white/90 text-[10px] text-center font-light tracking-wide px-2">
                    {breathLabel}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            </div>

            {breathPhase === 'idle' ? (
              <button onClick={startBreath} className="text-[#5C8A5E]/60 hover:text-[#5C8A5E] text-xs tracking-widest uppercase transition-colors duration-300 border border-[#5C8A5E]/20 rounded-full px-6 py-2">
                breathe
              </button>
            ) : (
              <button onClick={stopBreath} className="text-[#5C8A5E]/40 hover:text-[#5C8A5E]/70 text-xs tracking-wide transition-colors duration-300">
                rest
              </button>
            )}

            {breathCycles >= 3 && breathPhase !== 'idle' && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#5C8A5E]/50 text-xs italic text-center">
                you can rest now.
              </motion.p>
            )}
          </div>
        </div>

        {/* Right: Gratitude stones + reminder */}
        <div className="flex flex-col gap-6 lg:w-1/2">
          {/* Stone input */}
          <div className="bg-white/50 rounded-2xl p-5">
            <p className="text-[#5C8A5E]/70 text-xs tracking-wide mb-3 font-light">one small thing you noticed today:</p>
            <div className="flex gap-2">
              <input
                value={stoneInput}
                onChange={e => setStoneInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addStone()}
                placeholder="a flower. the smell of rain. a kind word."
                className="flex-1 bg-transparent text-[#5C8A5E] text-sm font-light outline-none placeholder-[#5C8A5E]/30 border-b border-[#5C8A5E]/20 pb-1"
              />
              <button onClick={addStone} className="text-[#5C8A5E]/50 hover:text-[#5C8A5E] transition-colors duration-300 text-xs tracking-wide">
                place
              </button>
            </div>
          </div>

          {/* Stones path */}
          {safeStones.length > 0 && (
            <div className="bg-white/30 rounded-2xl p-5">
              <p className="text-[#8B6914]/50 text-xs tracking-widest uppercase mb-4">your path</p>
              <div className="flex flex-wrap gap-2">
                {safeStones.map((stone, i) => {
                  const opacity = safeStones.length > 15 && i < safeStones.length - 15 ? 0.35 : 1;
                  return (
                    <div
                      key={i}
                      className="relative"
                      onMouseEnter={() => setHoveredStone(i)}
                      onMouseLeave={() => setHoveredStone(null)}
                    >
                      <motion.div
                        className="w-10 h-10 rounded-full cursor-pointer flex items-center justify-center"
                        style={{ backgroundColor: `hsl(${90 + i * 15}, 30%, ${55 + (i % 3) * 8}%)`, opacity }}
                        whileHover={{ scale: 1.1 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.05, type: 'spring' }}
                      />
                      <AnimatePresence>
                        {hoveredStone === i && (
                          <motion.div
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/90 rounded-xl px-3 py-2 text-xs text-[#5C8A5E] whitespace-nowrap shadow-md z-10 max-w-[160px] text-center"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                          >
                            <span className="block font-medium">{stone.text}</span>
                            <span className="block text-[#5C8A5E]/50 text-[10px]">{stone.date}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gentle reminder */}
          {(reminder || preference !== 'enabled') && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="text-[#5C8A5E]/50 text-xs font-light italic text-center mt-auto pt-4"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              {reminder || 'You do not have to earn rest.'}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
