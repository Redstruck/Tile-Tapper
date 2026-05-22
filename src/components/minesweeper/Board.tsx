import type { Board as BoardType } from "@/lib/minesweeper";
import { Cell } from "./Cell";
import { useEffect, useState } from "react";

interface Props {
  board: BoardType;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
  onChord: (r: number, c: number) => void;
  disabled: boolean;
}

export function GameBoard({ board, onReveal, onFlag, onChord, disabled }: Props) {
  const rows = board.length;
  const cols = board[0].length;
  const [size, setSize] = useState(36);

  useEffect(() => {
    function compute() {
      const maxW = Math.min(window.innerWidth - 32, 1100);
      const maxH = window.innerHeight - 300;
      const s = Math.floor(Math.min(maxW / cols, maxH / rows, 44));
      setSize(Math.max(s, 22));
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [rows, cols]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-soft bg-card p-2 mx-auto animate-scale-in" style={{ width: "fit-content" }}>
      <div className="grid rounded-xl overflow-hidden" style={{ gridTemplateColumns: `repeat(${cols}, ${size}px)` }}>
        {board.map((row, r) =>
          row.map((cell, c) => (
            <Cell key={`${r}-${c}`} cell={cell} r={r} c={c} size={size} onReveal={onReveal} onFlag={onFlag} onChord={onChord} disabled={disabled} />
          ))
        )}
      </div>
    </div>
  );
}