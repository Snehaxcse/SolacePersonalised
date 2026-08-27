import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

/** Key solace_gratitude_stones remains { text, date }[]. Copy changed; existing stones are preserved as-is. */

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

  const stemEnd = stage === 0 ? 195 : stage === 1 ? 150 : stage === 2 ? 118 : stage === 3 ? 88 : 72;
  const stemPath = drooping
    ? `M100 195 Q102 ${Math.round((195 + stemEnd) / 2)} 96 ${stemEnd}`
    : `M100 195 Q100 ${Math.round((195 + stemEnd) / 2)} 100 ${stemEnd}`;

  return (
    <motion.svg
      viewBox="0 0 200 260"
      className="w-48 h-64 sm:w-56 sm:h-72"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 1 }}
      aria-hidden="true"
    >
      <ellipse cx="100" cy="228" rx="48" ry="10" fill="#8B6914" opacity="0.25" />
      <path d="M62 222 Q100 248 138 222 L146 198 H54 Z" fill="#8B6914" opacity="0.75" />
      <rect x="54" y="192" width="92" height="14" rx="6" fill="#A07820" opacity="0.65" />

      <g transform={drooping ? 'rotate(5, 100, 195)' : undefined}>
        {stage === 0 && (
          <motion.ellipse
            cx="100" cy="196" rx="7" ry="5" fill="#6B4F16"
            animate={reduceMotion ? { opacity: 0.9 } : { opacity: [0.65, 1, 0.65] }}
            transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 3 }}
          />
        )}

        {stage >= 1 && (
          <motion.path
            d={stemPath}
            stroke={stage >= 3 ? '#3d6b40' : '#5C8A5E'}
            strokeWidth={stage >= 3 ? 4 : 3}
            fill="none"
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduceMotion ? 0 : 1.2, ease: 'easeOut' }}
          />
        )}

        {stage === 1 && (
          <motion.ellipse cx="100" cy={stemEnd - 4} rx="4" ry="6" fill="#7DB87F" {...appear(0.4, 0.5)} />
        )}

        {stage >= 2 && (
          <>
            <motion.ellipse cx="78" cy="158" rx={stage >= 3 ? 18 : 13} ry={stage >= 3 ? 9 : 7} fill="#A8C5A0" transform="rotate(-32 78 158)" {...appear(0.25)} />
            <motion.ellipse cx="122" cy="150" rx={stage >= 3 ? 18 : 13} ry={stage >= 3 ? 9 : 7} fill="#5C8A5E" transform="rotate(28 122 150)" {...appear(0.4)} />
          </>
        )}

        {stage >= 3 && (
          <>
            <motion.ellipse cx="70" cy="118" rx="20" ry="10" fill="#A8C5A0" transform="rotate(-48 70 118)" {...appear(0.2)} />
            <motion.ellipse cx="128" cy="110" rx="20" ry="10" fill="#5C8A5E" transform="rotate(42 128 110)" {...appear(0.35)} />
            <motion.ellipse cx="92" cy="98" rx="16" ry="8" fill="#7DB87F" transform="rotate(-18 92 98)" {...appear(0.5)} />
            <motion.ellipse cx="112" cy="96" rx="15" ry="8" fill="#4A7C4D" transform="rotate(20 112 96)" {...appear(0.55)} />
            {stage === 3 && (
              <motion.ellipse cx="100" cy="78" rx="6" ry="8" fill="#F9A8D4" opacity="0.85" {...appear(0.6, 0.5)} />
            )}
          </>
        )}

        {stage >= 4 && (
          <>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <motion.ellipse
                key={angle}
                cx={100 + 18 * Math.cos((angle * Math.PI) / 180)}
                cy={68 + 18 * Math.sin((angle * Math.PI) / 180)}
                rx="11" ry="6"
                fill={i % 2 === 0 ? '#F9A8D4' : '#FBCFE8'}
                transform={`rotate(${angle} ${100 + 18 * Math.cos((angle * Math.PI) / 180)} ${68 + 18 * Math.sin((angle * Math.PI) / 180)})`}
                {...appear(0.08 * i, 0.55)}
              />
            ))}
            <motion.circle
              cx="100" cy="68" r="11" fill="#FDE68A"
              initial={reduceMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={reduceMotion ? { duration: 0 } : { delay: 0.7, duration: 0.5, type: 'spring' }}
            />
          </>
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
  const navigate = useNavigate();
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
  const growthStatus = STAGE_NAMES[displayStage];

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#E8F0E9' }}
      animate={{ opacity: dimmed ? 0.6 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 2 }}
    >
      <SanctuaryHeader sanctuary="garden" textColor="text-[#5C8A5E]" />

      <main id="main" className="flex-1 pt-20 pb-8 px-4 sm:px-8 flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto w-full">
        <div className="flex flex-col items-center gap-4 lg:w-1/2">
          <div className="relative flex flex-col items-center">
            <PlantSVG stage={displayStage} drooping={softDroop} reduceMotion={reduceMotion} />
            <h1 className="sr-only">the garden</h1>
            <p className="text-[#5C8A5E] text-sm tracking-wide text-center mt-2">
              {growthStatus}
            </p>
            {keptPlace && (
              <p
                aria-live="polite"
                className="text-[#3d6b40] text-base font-light text-center mt-3 max-w-xs leading-6"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
              >
                the garden kept your place.
              </p>
            )}
            <p className="text-[#6B4F16] text-xs tracking-wide text-center mt-2 max-w-xs">
              you've returned {visitCount} time{visitCount === 1 ? '' : 's'}.
            </p>
            {softDroop && (
              <p className="text-[#6B4F16] text-xs text-center mt-1">resting. nothing was lost.</p>
            )}
            {typeof firstVisit === 'string' && firstVisit && (
              <p className="text-[#6B4F16] text-xs text-center mt-1">here since {firstVisit}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:w-1/2">
          <div className="bg-white/50 rounded-2xl p-5">
            <label htmlFor="garden-stone" className="block text-[#3d6b40] text-sm font-light mb-1">
              leave something here.
            </label>
            <p id="garden-stone-hint" className="text-[#6B4F16] text-xs font-light mb-3 leading-5">
              something you noticed. something that hurt. something you want to remember. something small that was okay. something you're carrying.
            </p>
            <div className="flex gap-2">
              <input
                id="garden-stone"
                value={stoneInput}
                onChange={e => setStoneInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addStone()}
                placeholder="whatever is true right now"
                aria-describedby="garden-stone-hint"
                className="flex-1 bg-transparent text-[#3d6b40] text-sm font-light outline-none placeholder-[#5C8A5E]/55 border-b border-[#5C8A5E]/30 pb-1"
              />
              <button
                type="button"
                onClick={addStone}
                className="text-[#3d6b40] transition-colors duration-300 text-xs tracking-wide"
              >
                leave it
              </button>
            </div>
          </div>

          {safeStones.length > 0 && (
            <div className="bg-white/30 rounded-2xl p-5">
              <h2 className="text-[#6B4F16] text-xs tracking-widest uppercase mb-4">what you left</h2>
              <ul className="flex flex-wrap gap-2" aria-label="Things left in the garden">
                {safeStones.map((stone, i) => {
                  const opacity = safeStones.length > 15 && i < safeStones.length - 15 ? 0.55 : 1;
                  return (
                    <li key={`${stone.date}-${i}`}>
                      <motion.button
                        type="button"
                        aria-pressed={selectedStone === i}
                        aria-label={`${stone.text}, ${stone.date}`}
                        className={`w-11 h-11 rounded-full text-[10px] text-[#1a3a1c]/80 ${selectedStone === i ? 'ring-2 ring-[#5C8A5E] ring-offset-2 ring-offset-[#E8F0E9]' : ''}`}
                        style={{ backgroundColor: `hsl(${90 + i * 15}, 30%, ${55 + (i % 3) * 8}%)`, opacity }}
                        onClick={() => setSelectedStone(selectedStone === i ? null : i)}
                        initial={reduceMotion ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: reduceMotion ? 0 : i * 0.05, type: reduceMotion ? undefined : 'spring' }}
                      >
                        <span aria-hidden="true">{stone.text.trim().slice(0, 1).toUpperCase() || '·'}</span>
                      </motion.button>
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
                  <p className="text-[#6B4F16] text-xs">choose one to read it.</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 pt-2">
            <p className="text-[#6B4F16] text-xs font-light text-center">if you want to breathe</p>
            <div className="relative flex items-center justify-center w-32 h-32" aria-hidden="true">
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ width: 8, height: 20, borderRadius: '50%', backgroundColor: '#A8C5A0', opacity: 0.5 }}
                  animate={reduceMotion ? { rotate: i * 90 } : { rotate: 360 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 20, repeat: Infinity, ease: 'linear', delay: i * 5 }}
                  initial={{ rotate: i * 90, transformOrigin: '4px 64px' }}
                />
              ))}
              <motion.div
                className="rounded-full flex items-center justify-center"
                style={{ width: 64, height: 64, backgroundColor: '#5C8A5E' }}
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
              {breathActive ? breathLabel : ''}
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
                you can stop whenever you want.
              </p>
            )}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/companion')}
              className="text-[#3d6b40] text-xs tracking-wide"
            >
              keep talking
            </button>
            <p className="text-[#6B4F16] text-[10px] font-light mt-1">
              this does not take what you left here with it.
            </p>
          </div>

          {(reminder || preference !== 'enabled') && (
            <motion.p
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 1, duration: reduceMotion ? 0 : 1 }}
              className="text-[#3d6b40] text-xs font-light italic text-center mt-auto pt-2"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              {reminder || 'your space is still here.'}
            </motion.p>
          )}
        </div>
      </main>
    </motion.div>
  );
}
