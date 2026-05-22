import { Bomb, Clock } from "lucide-react";

interface Props {
  mines: number;
  time: number;
  face: string;
  onRestart: () => void;
  bouncing: boolean;
}

function pad(n: number, len = 3) {
  const s = Math.max(0, Math.min(999, n)).toString();
  return s.padStart(len, "0");
}

export function HUD({ mines, time, face, onRestart, bouncing }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 bg-card rounded-2xl shadow-soft p-3 sm:p-4 mb-4 max-w-md w-full mx-auto">
      <div className="flex items-center gap-2 bg-gradient-header text-primary-foreground rounded-xl px-3 py-2 font-display font-semibold tabular-nums">
        <Bomb className="w-4 h-4" />
        <span className="text-lg">{pad(mines)}</span>
      </div>
      <button
        onClick={onRestart}
        aria-label="Restart game"
        className={`text-3xl sm:text-4xl hover:scale-110 active:scale-95 transition-transform ${bouncing ? "face-bounce" : ""}`}
      >
        {face}
      </button>
      <div className="flex items-center gap-2 bg-gradient-header text-primary-foreground rounded-xl px-3 py-2 font-display font-semibold tabular-nums">
        <Clock className="w-4 h-4" />
        <span className="text-lg">{pad(time)}</span>
      </div>
    </div>
  );
}