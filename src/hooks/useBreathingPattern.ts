import { useCallback, useEffect, useRef, useState } from 'react';

export type BreathAction = 'in' | 'hold' | 'out';

export interface BreathPhaseConfig {
  action: BreathAction;
  duration: number;
  label: string;
}

interface Options {
  phases: readonly BreathPhaseConfig[];
  onCycleComplete?: (cycles: number) => void;
}

export function useBreathingPattern({ phases, onCycleComplete }: Options) {
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCycleRef = useRef(onCycleComplete);
  onCycleRef.current = onCycleComplete;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (!active) return;

    const run = (index: number, cycleCount: number) => {
      const phase = phases[index];
      timerRef.current = setTimeout(() => {
        const next = (index + 1) % phases.length;
        const nextCycles = next === 0 ? cycleCount + 1 : cycleCount;
        if (next === 0) {
          setCycles(nextCycles);
          onCycleRef.current?.(nextCycles);
        }
        setPhaseIndex(next);
        run(next, nextCycles);
      }, phase.duration);
    };

    run(0, 0);
    return () => clearTimer();
  }, [active, phases]);

  const start = useCallback(() => {
    clearTimer();
    setPhaseIndex(0);
    setCycles(0);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setActive(false);
  }, []);

  useEffect(() => () => clearTimer(), []);

  const phase = phases[phaseIndex] ?? phases[0];

  return {
    active,
    phaseIndex,
    phase,
    cycles,
    start,
    stop,
  };
}
