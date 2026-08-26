import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import SanctuaryHeader from '../../shared/SanctuaryHeader';
import { getGardenReminder } from '../../../utils/claudeService';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useAiConsent } from '../../../context/AiConsentContext';
import { clampProgress, progressToStage, readPlantProgress } from '../../../utils/solaceMemory';
import { useBreathingPattern, type BreathPhaseConfig } from '../../../hooks/useBreathingPattern';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

interface Stone {
  text: string;
  date: string;
}

type PlantStage = 0 | 1 | 2 | 3 | 4;

const STAGE_NAMES = ['seed', 'sprout', 'small plant', 'growing', 'full bloom'];

const GARDEN_BREATH: readonly BreathPhaseConfig[] = [
  { label: 'breathe in', duration: 4000, action: 'in' },
  { label: 'hold', duration: 4000, action: 'hold' },
  { label: 'breathe out', duration: 6000, action: 'out' },
];

function PlantSVG({ stage, drooping, reduceMotion }: { stage: PlantStage; drooping: boolean; reduceMotion: boolean }) {
  const appear = (delay: number, duration = 0.8) =>
    reduceMotion
      ? { initial: false as const, animate: { scale: 1, opacity: 1 }, transition: { duration: 0 } }
      : { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { delay, duration } };

  return (
    <motion.svg
      viewBox="0 0 200 260"
      className="w-48 h-64 sm:w-56 sm:h-72"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 1 }}
      aria-hidden="true"
    >
      <path d="M70 230 Q100 255 130 230 L140 200 H60 Z" fill="#8B6914" opacity="0.7" />
      <rect x="58" y="195" width="84" height="12" rx="5" fill="#A07820" opacity="0.6" />

      <g transform={drooping ? 'rotate(6, 100, 195)' : undefined}>
        {stage >= 1 && (
          <motion.path
            d={drooping ? 'M100 195 Q100 160 98 130 Q96 110 95 90' : 'M100 195 Q100 160 100 130 Q100 110 100 90'}
            stroke="#5C8A5E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduceMotion ? 0 : 1.2, ease: 'easeOut' }}
          />
        )}

        {stage >= 2 && (
          <>
            <motion.ellipse cx="82" cy="155" rx="15" ry="8" fill="#A8C5A0" transform="rotate(-30 82 155)" {...appear(0.3)} />
            <motion.ellipse cx="118" cy="145" rx="15" ry="8" fill="#5C8A5E" transform="rotate(30 118 145)" {...appear(0.5)} />
          </>
        )}

        {stage >= 3 && (
          <>
            <motion.ellipse cx="75" cy="115" rx="18" ry="9" fill="#A8C5A0" transform="rotate(-45 75 115)" {...appear(0.2)} />
            <motion.ellipse cx="122" cy="108" rx="18" ry="9" fill="#5C8A5E" transform="rotate(45 122 108)" {...appear(0.4)} />
            <motion.ellipse cx="100" cy="95" rx="20" ry="10" fill="#7DB87F" transform="rotate(-10 100 95)" {...appear(0.6)} />
          </>
        )}

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
                {...appear(0.1 * i, 0.6)}
              />
            ))}
            <motion.circle
              cx="100" cy="85" r="9" fill="#FDE68A"
              initial={reduceMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={reduceMotion ? { duration: 0 } : { delay: 0.7, duration: 0.5, type: 'spring' }}
            />
          </>
        )}

        {stage === 0 && (
          <motion.ellipse
            cx="100" cy="198" rx="5" ry="4" fill="#8B6914" opacity="0.8"
            animate={reduceMotion ? { opacity: 0.8 } : { opacity: [0.6, 0.9, 0.6] }}
            transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 3 }}
          />
        )}

        {drooping && stage >= 2 && (
          <path d="M100 160 Q90 175 85 190" stroke="#A8C5A0" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
        )}
      </g>
    </motion.svg>
  );
}

let gardenVisitAppliedFor = '';

export default function GardenSanctuary() {
  const { preference } = useAiConsent();
  const reduceMotion = usePrefersReducedMotion();
  const [stage, setStage] = useLocalStorage<PlantStage>('solace_plant_stage', 0);
  const [progress, setProgress] = useLocalStorage<number>('solace_plant_progress', readPlantProgress());
  const [visits, setVisits] = useLocalStorage<number>('solace_plant_visits', 0);
  const [firstVisit, setFirstVisit] = useLocalStorage<string>('solace_plant_first_visit', '');
  const [lastVisit, setLastVisit] = useLocalStorage<string>('solace_plant_last_visit', '');
  const [stones, setStones] = useLocalStorage<Stone[]>('solace_gratitude_stones', []);
  const [reminder, setReminder] = useLocalStorage<string>('solace_garden_reminder', '');
  const [stoneInput, setStoneInput] = useState('');
  const [selectedStone, setSelectedStone] = useState<number | null>(null);
  const [softDroop, setSoftDroop] = useState(false);
  const [keptPlace, setKeptPlace] = useState(false);
  const [dimmed, setDimmed] = useState(false);

  const onCycleComplete = useCallback((n: number) => {
    if (n >= 3 && !reduceMotion) {
      setDimmed(true);
      setTimeout(() => setDimmed(false), 5000);
    }
  }, [reduceMotion]);

  const {
    active: breathActive,
    phase,
    cycles: breathCycles,
    start: startBreath,
    stop: stopBreathPattern,
  } = useBreathingPattern({ phases: GARDEN_BREATH, onCycleComplete });

  const breathPhase = breathActive ? phase.action : 'idle';

  const startBreathing = () => {
    setDimmed(false);
    startBreath();
  };

  const stopBreath = () => {
    stopBreathPattern();
    setDimmed(false);
  };

  const visitCount = typeof visits === 'number' && visits > 0 ? visits : 1;
  const displayStage = progressToStage(typeof progress === 'number' ? progress : 0);
  const safeStones = Array.isArray(stones) ? stones : [];
  const selected = selectedStone !== null ? safeStones[selectedStone] : null;

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
    const timer = setTimeout(() => setSoftDroop(false), reduceMotion ? 0 : 6000);
    return () => clearTimeout(timer);
  }, [softDroop, reduceMotion]);

  useEffect(() => {
    if (preference !== 'enabled') return;
    if (!reminder) {
      getGardenReminder().then(r => setReminder(r));
    }
    // Ambient reminder is fetched once when AI is enabled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference]);

  const addStone = () => {
    if (!stoneInput.trim()) return;
    const newStone: Stone = { text: stoneInput.trim(), date: new Date().toLocaleDateString() };
    const updated = [...safeStones, newStone].slice(-20);
    setStones(updated);
    setStoneInput('');
    setSelectedStone(updated.length - 1);
  };

  const circleScale = reduceMotion ? 1 : breathPhase === 'in' ? 1.4 : breathPhase === 'out' ? 0.9 : breathPhase === 'hold' ? 1.4 : 1;
  const breathLabel = breathPhase === 'in' ? 'breathe in' : breathPhase === 'hold' ? 'hold' : breathPhase === 'out' ? 'breathe out' : 'ready';
  const growthStatus = `${STAGE_NAMES[displayStage]}${softDroop ? ', resting after a long absence' : ''}`;

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#E8F0E9' }}
      animate={{ opacity: dimmed ? 0.6 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 2 }}
    >
      <SanctuaryHeader sanctuary="garden" textColor="text-[#5C8A5E]" />

      <main id="main" className="flex-1 pt-20 pb-8 px-4 sm:px-8 flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col items-center gap-6 lg:w-1/2">
          <div className="relative flex flex-col items-center">
            <PlantSVG stage={displayStage} drooping={softDroop} reduceMotion={reduceMotion} />
            <h1 className="sr-only">the garden</h1>
            <p className="text-[#5C8A5E] text-sm tracking-wide text-center mt-2">
              {growthStatus}
            </p>
            <p className="text-[#6B4F16] text-xs tracking-wide text-center mt-1 max-w-xs">
              you've visited {visitCount} time{visitCount === 1 ? '' : 's'}. thank you for coming back.
            </p>
            {keptPlace && (
              <p aria-live="polite" className="text-[#6B4F16] text-xs text-center mt-1">
                the garden kept your place.
              </p>
            )}
            {typeof firstVisit === 'string' && firstVisit && (
              <p className="text-[#6B4F16] text-xs text-center mt-1">growing since {firstVisit}</p>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 mt-4">
            <div className="relative flex items-center justify-center w-40 h-40" aria-hidden="true">
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ width: 10, height: 24, borderRadius: '50%', backgroundColor: '#A8C5A0', opacity: 0.5 }}
                  animate={reduceMotion ? { rotate: i * 90 } : { rotate: 360 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 20, repeat: Infinity, ease: 'linear', delay: i * 5 }}
                  initial={{ rotate: i * 90, transformOrigin: '5px 80px' }}
                />
              ))}
              <motion.div
                className="rounded-full flex items-center justify-center"
                style={{ width: 80, height: 80, backgroundColor: '#5C8A5E' }}
                animate={{ scale: circleScale }}
                transition={{
                  duration: reduceMotion ? 0 : breathPhase === 'in' ? 4 : breathPhase === 'out' ? 6 : 0.3,
                  ease: 'easeInOut',
                }}
              />
            </div>

            <p
              aria-live={breathActive ? 'polite' : 'off'}
              aria-atomic="true"
              className="text-[#3d6b40] text-sm font-light tracking-wide text-center"
            >
              {breathActive ? breathLabel : 'breathing ready'}
            </p>

            {breathPhase === 'idle' ? (
              <button
                type="button"
                onClick={startBreathing}
                className="text-[#3d6b40] text-xs tracking-widest uppercase transition-colors duration-300 border border-[#5C8A5E]/40 rounded-full px-6 py-2"
              >
                breathe
              </button>
            ) : (
              <button
                type="button"
                onClick={stopBreath}
                className="text-[#3d6b40] text-xs tracking-wide transition-colors duration-300"
              >
                rest
              </button>
            )}

            {breathCycles >= 3 && breathPhase !== 'idle' && (
              <p className="text-[#3d6b40] text-xs italic text-center">
                you can rest now.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:w-1/2">
          <div className="bg-white/50 rounded-2xl p-5">
            <label htmlFor="gratitude-stone" className="block text-[#3d6b40] text-xs tracking-wide mb-3 font-light">
              one small thing you noticed today:
            </label>
            <div className="flex gap-2">
              <input
                id="gratitude-stone"
                value={stoneInput}
                onChange={e => setStoneInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addStone()}
                placeholder="a flower. the smell of rain. a kind word."
                className="flex-1 bg-transparent text-[#3d6b40] text-sm font-light outline-none placeholder-[#5C8A5E]/55 border-b border-[#5C8A5E]/30 pb-1"
              />
              <button
                type="button"
                onClick={addStone}
                className="text-[#3d6b40] transition-colors duration-300 text-xs tracking-wide"
              >
                place
              </button>
            </div>
          </div>

          {safeStones.length > 0 && (
            <div className="bg-white/30 rounded-2xl p-5">
              <h2 className="text-[#6B4F16] text-xs tracking-widest uppercase mb-4">your path</h2>
              <ul className="flex flex-wrap gap-2" aria-label="Gratitude stones">
                {safeStones.map((stone, i) => {
                  const opacity = safeStones.length > 15 && i < safeStones.length - 15 ? 0.55 : 1;
                  return (
                    <li key={`${stone.date}-${i}`}>
                      <motion.button
                        type="button"
                        aria-pressed={selectedStone === i}
                        aria-label={`${stone.text}, ${stone.date}`}
                        className={`w-10 h-10 rounded-full ${selectedStone === i ? 'ring-2 ring-[#5C8A5E] ring-offset-2 ring-offset-[#E8F0E9]' : ''}`}
                        style={{ backgroundColor: `hsl(${90 + i * 15}, 30%, ${55 + (i % 3) * 8}%)`, opacity }}
                        onClick={() => setSelectedStone(selectedStone === i ? null : i)}
                        initial={reduceMotion ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: reduceMotion ? 0 : i * 0.05, type: reduceMotion ? undefined : 'spring' }}
                      />
                    </li>
                  );
                })}
              </ul>
              <div aria-live="polite" className="min-h-[2.5rem] mt-3 text-center">
                {selected && (
                  <p className="text-[#3d6b40] text-xs">
                    <span className="block font-medium">{selected.text}</span>
                    <span className="block text-[#6B4F16] text-[10px] mt-0.5">{selected.date}</span>
                  </p>
                )}
                {!selected && (
                  <p className="text-[#6B4F16] text-xs">Select a stone to read it.</p>
                )}
              </div>
            </div>
          )}

          {(reminder || preference !== 'enabled') && (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 1, duration: reduceMotion ? 0 : 1 }}
              className="text-[#3d6b40] text-xs font-light italic text-center mt-auto pt-4"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              {reminder || 'You do not have to earn rest.'}
            </motion.p>
          )}
        </div>
      </main>
    </motion.div>
  );
}
