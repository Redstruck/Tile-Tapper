import { memo } from "react";
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
  const isLight = (r + c) % 2 === 0;
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    if (e.shiftKey) { onFlag(r, c); return; }
    if (cell.state === "revealed") onChord(r, c);
    else onReveal(r, c);
  };
  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
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
        "relative flex items-center justify-center font-display font-bold select-none transition-all duration-100",
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
      {cell.exploded && <span className="mine-shockwave" />}
      {revealed && cell.isMine && (
        <span style={{ fontSize: size * 0.6 }}>💣</span>
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

export const Cell = memo(CellInner);