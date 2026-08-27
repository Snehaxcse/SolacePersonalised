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

  return (
    <motion.svg
      viewBox="0 0 200 260"
      className="w-48 h-64 sm:w-56 sm:h-72"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 1 }}
      aria-hidden="true"
    >
      <ellipse cx="100" cy="228" rx="52" ry="11" fill="#8B6914" opacity="0.22" />
      <path d="M58 220 Q100 250 142 220 L150 196 H50 Z" fill="#8B6914" opacity="0.8" />
      <rect x="50" y="190" width="100" height="16" rx="7" fill="#A07820" opacity="0.7" />

      <g transform={drooping && stage > 0 ? 'rotate(5, 100, 190)' : undefined}>
        {stage === 0 && (
          <motion.ellipse
            cx="100" cy="192" rx="9" ry="6" fill="#5C4310"
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.7, 1, 0.7] }}
            transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 3 }}
          />
        )}

        {stage === 1 && (
          <>
            <motion.path
              d="M100 190 Q101 175 100 158"
              stroke="#9CB88A"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduceMotion ? 0 : 1 }}
            />
            <motion.ellipse cx="100" cy="152" rx="5" ry="8" fill="#C5D9B4" {...appear(0.4, 0.45)} />
          </>
        )}

        {stage === 2 && (
          <>
            <motion.path
              d="M100 190 Q100 160 100 128"
              stroke="#6B9A62"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduceMotion ? 0 : 1.1 }}
            />
            <motion.ellipse cx="76" cy="138" rx="16" ry="9" fill="#B7D4A8" transform="rotate(-28 76 138)" {...appear(0.25)} />
            <motion.ellipse cx="124" cy="134" rx="16" ry="9" fill="#7DA86F" transform="rotate(26 124 134)" {...appear(0.4)} />
          </>
        )}

        {stage === 3 && (
          <>
            <motion.path
              d="M100 190 Q100 140 100 92"
              stroke="#3d6b40"
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduceMotion ? 0 : 1.2 }}
            />
            <motion.ellipse cx="68" cy="155" rx="14" ry="8" fill="#8FBF84" transform="rotate(-40 68 155)" {...appear(0.15)} />
            <motion.ellipse cx="132" cy="148" rx="14" ry="8" fill="#5C8A5E" transform="rotate(38 132 148)" {...appear(0.22)} />
            <motion.ellipse cx="64" cy="118" rx="22" ry="11" fill="#A8C5A0" transform="rotate(-50 64 118)" {...appear(0.3)} />
            <motion.ellipse cx="138" cy="110" rx="22" ry="11" fill="#4A7C4D" transform="rotate(46 138 110)" {...appear(0.38)} />
            <motion.ellipse cx="88" cy="96" rx="18" ry="10" fill="#7DB87F" transform="rotate(-16 88 96)" {...appear(0.46)} />
            <motion.ellipse cx="116" cy="92" rx="17" ry="10" fill="#3d6b40" transform="rotate(18 116 92)" {...appear(0.52)} />
            <motion.ellipse cx="100" cy="78" rx="7" ry="10" fill="#6B8F4E" {...appear(0.6, 0.5)} />
          </>
        )}

        {stage === 4 && (
          <>
            <motion.path
              d="M100 190 Q100 130 100 78"
              stroke="#2F5A32"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              initial={reduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduceMotion ? 0 : 1.2 }}
            />
            <motion.ellipse cx="62" cy="150" rx="16" ry="9" fill="#7DA86F" transform="rotate(-42 62 150)" {...appear(0.1)} />
            <motion.ellipse cx="140" cy="142" rx="16" ry="9" fill="#4A7C4D" transform="rotate(40 140 142)" {...appear(0.16)} />
            <motion.ellipse cx="58" cy="108" rx="24" ry="12" fill="#A8C5A0" transform="rotate(-52 58 108)" {...appear(0.22)} />
            <motion.ellipse cx="144" cy="100" rx="24" ry="12" fill="#3d6b40" transform="rotate(48 144 100)" {...appear(0.28)} />
            <motion.ellipse cx="84" cy="88" rx="18" ry="10" fill="#5C8A5E" transform="rotate(-20 84 88)" {...appear(0.34)} />
            <motion.ellipse cx="120" cy="84" rx="18" ry="10" fill="#2F5A32" transform="rotate(22 120 84)" {...appear(0.4)} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <motion.ellipse
                key={angle}
                cx={100 + 22 * Math.cos((angle * Math.PI) / 180)}
                cy={58 + 22 * Math.sin((angle * Math.PI) / 180)}
                rx="13" ry="7"
                fill={i % 2 === 0 ? '#F9A8D4' : '#FBCFE8'}
                transform={`rotate(${angle} ${100 + 22 * Math.cos((angle * Math.PI) / 180)} ${58 + 22 * Math.sin((angle * Math.PI) / 180)})`}
                {...appear(0.08 * i, 0.5)}
              />
            ))}
            <motion.circle
              cx="100" cy="58" r="13" fill="#FDE68A"
              initial={reduceMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={reduceMotion ? { duration: 0 } : { delay: 0.7, duration: 0.5, type: 'spring' }}
            />
          </>
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
  const [longAbsence, setLongAbsence] = useState(false);
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

    const day = 24 * 60 * 60 * 1000;
    if (awayMs > 3 * day) {
      setSoftDroop(true);
      setKeptPlace(true);
    }
    if (awayMs > 10 * day) {
      setLongAbsence(true);
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
            <PlantSVG key={displayStage} stage={displayStage} drooping={softDroop} reduceMotion={reduceMotion} />
            <h1 className="sr-only">the garden</h1>
            <p className="text-[#5C8A5E] text-sm tracking-wide text-center mt-2">
              {growthStatus}
            </p>
            {keptPlace && (
              <div aria-live="polite" className="mt-3 max-w-xs text-center">
                <p
                  className="text-[#3d6b40] text-base font-light leading-6"
                  style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                >
                  the garden kept your place.
                </p>
                {longAbsence && (
                  <p className="text-[#6B4F16] text-xs font-light mt-2 leading-5">
                    nothing was asked of you while you were away.
                  </p>
                )}
              </div>
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
          <div className="bg-white/50 rounded-2xl p-5 sm:p-6 shadow-sm">
            <label htmlFor="garden-stone" className="block text-[#3d6b40] text-sm font-light mb-1">
              leave something here.
            </label>
            <p id="garden-stone-hint" className="text-[#6B4F16] text-xs font-light mb-3 leading-5">
              something you noticed. something that hurt. something you want to remember. something small that was okay. something you're carrying.
            </p>
            <div className="flex items-end gap-2">
              <input
                id="garden-stone"
                value={stoneInput}
                onChange={e => setStoneInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addStone()}
                placeholder="whatever is true right now"
                aria-describedby="garden-stone-hint"
                className="flex-1 min-w-0 bg-transparent text-[#3d6b40] text-sm font-light outline-none placeholder-[#5C8A5E]/55 border-b border-[#5C8A5E]/30 pb-1.5"
              />
              <button
                type="button"
                onClick={addStone}
                className="shrink-0 min-h-9 px-3.5 py-1.5 rounded-full border border-[#5C8A5E]/35 text-[#3d6b40] text-xs tracking-wide"
              >
                leave it
              </button>
            </div>
            {safeStones.length === 0 && (
              <p className="text-[#6B4F16] text-xs font-light mt-3">nothing left here yet. that's okay.</p>
            )}
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
