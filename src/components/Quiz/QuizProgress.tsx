interface Props {
  total: number;
  current: number;
}

export default function QuizProgress({ total, current }: Props) {
  const pct = (current / total) * 100;
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="h-px bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-white/50 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
