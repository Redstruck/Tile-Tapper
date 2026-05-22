export type CellState = "hidden" | "revealed" | "flagged";

export interface Cell {
  isMine: boolean;
  adjacent: number;
  state: CellState;
  exploded?: boolean;
}

export type Board = Cell[][];

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: Record<Difficulty, { rows: number; cols: number; mines: number; label: string }> = {
  easy: { rows: 9, cols: 9, mines: 10, label: "Easy" },
  medium: { rows: 16, cols: 16, mines: 40, label: "Medium" },
  hard: { rows: 16, cols: 30, mines: 99, label: "Hard" },
};

export function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ isMine: false, adjacent: 0, state: "hidden" as CellState }))
  );
}

export function placeMines(board: Board, mines: number, safeR: number, safeC: number): Board {
  const rows = board.length;
  const cols = board[0].length;
  const safe = new Set<number>();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = safeR + dr, c = safeC + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) safe.add(r * cols + c);
    }
  }
  const positions: number[] = [];
  for (let i = 0; i < rows * cols; i++) if (!safe.has(i)) positions.push(i);
  // Fisher-Yates partial shuffle
  for (let i = 0; i < mines; i++) {
    const j = i + Math.floor(Math.random() * (positions.length - i));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  const newBoard = board.map((row) => row.map((c) => ({ ...c })));
  for (let i = 0; i < mines; i++) {
    const p = positions[i];
    newBoard[Math.floor(p / cols)][p % cols].isMine = true;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine) continue;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) n++;
        }
      newBoard[r][c].adjacent = n;
    }
  }
  return newBoard;
}

export function revealFlood(board: Board, r: number, c: number): Board {
  const rows = board.length;
  const cols = board[0].length;
  const nb = board.map((row) => row.map((c) => ({ ...c })));
  const stack: [number, number][] = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    const cell = nb[cr][cc];
    if (cell.state !== "hidden") continue;
    cell.state = "revealed";
    if (cell.adjacent === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = cr + dr, nc = cc + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && nb[nr][nc].state === "hidden") {
            stack.push([nr, nc]);
          }
        }
    }
  }
  return nb;
}

export function chord(board: Board, r: number, c: number): { board: Board; hitMine: boolean } {
  const rows = board.length;
  const cols = board[0].length;
  const cell = board[r][c];
  if (cell.state !== "revealed" || cell.adjacent === 0) return { board, hitMine: false };
  let flags = 0;
  const toReveal: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const n = board[nr][nc];
      if (n.state === "flagged") flags++;
      else if (n.state === "hidden") toReveal.push([nr, nc]);
    }
  if (flags !== cell.adjacent) return { board, hitMine: false };
  let nb = board;
  let hitMine = false;
  for (const [nr, nc] of toReveal) {
    if (nb[nr][nc].state !== "hidden") continue;
    if (nb[nr][nc].isMine) {
      hitMine = true;
      nb = nb.map((row) => row.map((c) => ({ ...c })));
      nb[nr][nc].state = "revealed";
      nb[nr][nc].exploded = true;
    } else {
      nb = revealFlood(nb, nr, nc);
    }
  }
  return { board: nb, hitMine };
}

export function revealAllMines(board: Board): Board {
  return board.map((row) =>
    row.map((c) => ({
      ...c,
      state: c.isMine && c.state !== "flagged" ? "revealed" : c.state,
    }))
  );
}

export function flagAllMines(board: Board): Board {
  return board.map((row) =>
    row.map((c) => ({ ...c, state: c.isMine ? "flagged" : c.state }))
  );
}

export function checkWin(board: Board): boolean {
  for (const row of board)
    for (const cell of row) {
      if (!cell.isMine && cell.state !== "revealed") return false;
    }
  return true;
}

export function countFlags(board: Board): number {
  let n = 0;
  for (const row of board) for (const c of row) if (c.state === "flagged") n++;
  return n;
}