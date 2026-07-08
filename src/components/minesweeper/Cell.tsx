import { memo, useState } from "react";
import type { Cell as CellType } from "@/lib/minesweeper";
import { cn } from "@/lib/utils";
import { Flag } from "lucide-react";

interface Props {
  cell: CellType;
  r: number;
  c: number;
  size: number;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
  onChord: (r: number, c: number) => void;
  disabled: boolean;
}

const numColor = ["", "text-num-1", "text-num-2", "text-num-3", "text-num-4", "text-num-5", "text-num-6", "text-num-7", "text-num-8"];

function CellInner({ cell, r, c, size, onReveal, onFlag, onChord, disabled }: Props) {
  const [pulse, setPulse] = useState(0);
  const isLight = (r + c) % 2 === 0;
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    setPulse((v) => v + 1);
    if (e.shiftKey) { onFlag(r, c); return; }
    if (cell.state === "revealed") onChord(r, c);
    else onReveal(r, c);
  };
  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    setPulse((v) => v + 1);
    onFlag(r, c);
  };
  const handleAux = (e: React.MouseEvent) => {
    if (e.button === 1) { e.preventDefault(); onChord(r, c); }
  };

  const revealed = cell.state === "revealed";
  const flagged = cell.state === "flagged";

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContext}
      onMouseDown={handleAux}
      aria-label={`Cell ${r + 1}, ${c + 1}`}
      style={{ width: size, height: size, fontSize: size * 0.55 }}
      className={cn(
        "relative flex items-center justify-center font-display font-bold select-none transition-transform duration-100 will-change-transform",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:z-10",
        "overflow-hidden",
        !revealed && !flagged && (isLight ? "bg-tile-unrevealed-1" : "bg-tile-unrevealed-2"),
        !revealed && !flagged && !disabled && "hover:bg-tile-hover active:scale-95 cursor-pointer",
        revealed && (isLight ? "bg-tile-revealed-1" : "bg-tile-revealed-2"),
        revealed && "tile-reveal",
        cell.exploded && "mine-explode !bg-mine",
        flagged && (isLight ? "bg-tile-unrevealed-1" : "bg-tile-unrevealed-2"),
      )}
    >
      {pulse > 0 && <span key={pulse} className="tile-click-blast" />}
      {cell.exploded && <span className="mine-shockwave" />}
      {cell.exploded && <span className="mine-fireball" />}
      {cell.exploded && <span className="mine-sparks" />}
      {revealed && cell.isMine && (
        <span className="relative z-10" style={{ fontSize: size * 0.66 }}>💣</span>
      )}
      {revealed && !cell.isMine && cell.adjacent > 0 && (
        <span className={cn(numColor[cell.adjacent], "drop-shadow-sm")}>{cell.adjacent}</span>
      )}
      {flagged && (
        <Flag className="text-flag fill-flag tile-pop" style={{ width: size * 0.55, height: size * 0.55 }} />
      )}
    </button>
  );
}

function visualCellKey(cell: CellType) {
  if (cell.state !== "revealed") return `${cell.state}:${cell.exploded ? 1 : 0}`;
  return `${cell.state}:${cell.isMine ? 1 : 0}:${cell.adjacent}:${cell.exploded ? 1 : 0}`;
}

export const Cell = memo(CellInner, (prev, next) => (
  prev.r === next.r &&
  prev.c === next.c &&
  prev.size === next.size &&
  prev.disabled === next.disabled &&
  visualCellKey(prev.cell) === visualCellKey(next.cell)
));