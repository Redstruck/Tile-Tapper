import type { Board as BoardType } from "@/lib/minesweeper";
import { Cell } from "./Cell";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  board: BoardType;
  onReveal: (r: number, c: number) => void;
  onFlag: (r: number, c: number) => void;
  onChord: (r: number, c: number) => void;
  disabled: boolean;
}

interface BoardLayout {
  cols: number;
  rows: number;
  w: number;
  h: number;
  size: number;
}

/** Padding from `p-2` on each side of the shell. */
const SHELL_PAD = 16;
const RESIZE_MS = 280;

function targetCellSize(cols: number, rows: number) {
  const maxW = Math.min(window.innerWidth - 32, 1100);
  const maxH = window.innerHeight - 300;
  return Math.max(22, Math.floor(Math.min(maxW / cols, maxH / rows, 44)));
}

function shellPixels(cols: number, rows: number, size: number) {
  return {
    w: cols * size + SHELL_PAD,
    h: rows * size + SHELL_PAD,
  };
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function layoutFor(cols: number, rows: number, size = targetCellSize(cols, rows)): BoardLayout {
  const box = shellPixels(cols, rows, size);
  return { cols, rows, w: box.w, h: box.h, size };
}

export function GameBoard({ board, onReveal, onFlag, onChord, disabled }: Props) {
  const rows = board.length;
  const cols = board[0].length;
  const [animating, setAnimating] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevLayoutRef = useRef<BoardLayout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const liveRef = useRef<BoardLayout>(layoutFor(cols, rows));
  const skippedResizeRef = useRef(false);

  useEffect(() => {
    function onResize() {
      if (cleanupRef.current) {
        // Defer applying until the morph finishes (or the next difficulty change).
        skippedResizeRef.current = true;
        return;
      }
      const next = layoutFor(cols, rows);
      const shell = shellRef.current;
      const grid = gridRef.current;
      if (!shell || !grid) return;
      shell.style.width = `${next.w}px`;
      shell.style.height = `${next.h}px`;
      grid.style.setProperty("--cell-size", `${next.size}px`);
      liveRef.current = next;
      prevLayoutRef.current = next;
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [rows, cols]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const grid = gridRef.current;
    if (!shell || !grid) return;

    cleanupRef.current?.();
    cleanupRef.current = null;

    const apply = (layout: BoardLayout) => {
      shell.style.width = `${layout.w}px`;
      shell.style.height = `${layout.h}px`;
      grid.style.setProperty("--cell-size", `${layout.size}px`);
      liveRef.current = layout;
    };

    const snapTo = (layout: BoardLayout) => {
      let finalLayout = layout;
      // Apply any window resize that was deferred while a morph was running.
      if (skippedResizeRef.current) {
        skippedResizeRef.current = false;
        finalLayout = layoutFor(layout.cols, layout.rows);
      }
      apply(finalLayout);
      setAnimating(false);
      prevLayoutRef.current = finalLayout;
    };

    const next = layoutFor(cols, rows);
    const prev = prevLayoutRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Difficulty change while a resize was deferred: keep the on-screen footprint as
    // the morph origin, but clear the flag — `next` already uses the current window.
    if (skippedResizeRef.current) {
      skippedResizeRef.current = false;
    }

    if (!prev || (prev.cols === cols && prev.rows === rows)) {
      snapTo(next);
      return;
    }

    if (reduced) {
      snapTo(next);
      return;
    }

    // Fit the new grid inside the previous shell, then grow/shrink cell size.
    // Shell size is always derived from cell size so the white frame and tiles stay locked.
    const origin = prev.w > 0 && prev.h > 0 ? prev : layoutFor(prev.cols, prev.rows, prev.size);
    const fromSize = Math.max(
      12,
      Math.min((origin.w - SHELL_PAD) / cols, (origin.h - SHELL_PAD) / rows),
    );
    const from = layoutFor(cols, rows, fromSize);

    setAnimating(true);
    apply(from);

    const t0 = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / RESIZE_MS);
      const e = easeOutCubic(t);
      const cellSize = fromSize + (next.size - fromSize) * e;
      apply(layoutFor(cols, rows, cellSize));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        cleanupRef.current = null;
        snapTo(next);
      }
    };

    raf = requestAnimationFrame(tick);

    cleanupRef.current = () => {
      cancelAnimationFrame(raf);
      const live = liveRef.current;
      // Never persist zero/invalid geometry if apply() never ran.
      prevLayoutRef.current =
        live.w > 0 && live.h > 0 ? live : layoutFor(live.cols, live.rows, live.size);
    };
  }, [rows, cols]);

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <div
      ref={shellRef}
      className="game-board-shell rounded-2xl overflow-hidden shadow-soft bg-card p-2 mx-auto flex items-center justify-center"
    >
      <div
        ref={gridRef}
        className="game-board-grid grid rounded-xl overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${cols}, var(--cell-size))`,
          gridAutoRows: "var(--cell-size)",
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              cell={cell}
              r={r}
              c={c}
              onReveal={onReveal}
              onFlag={onFlag}
              onChord={onChord}
              disabled={disabled || animating}
            />
          ))
        )}
      </div>
    </div>
  );
}
