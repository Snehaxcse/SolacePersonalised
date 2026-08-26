interface Props {
  total: number;
  current: number;
}

export default function QuizProgress({ total, current }: Props) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="w-full max-w-sm mx-auto">
      <p className="text-white/70 text-xs text-center tracking-wide mb-3">
        {current + 1} of {total}
      </p>
      <div
        className="h-px bg-white/20 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-label={`Question ${current + 1} of ${total}`}
      >
        <div
          className="h-full bg-white/70 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
