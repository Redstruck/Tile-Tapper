import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  Board,
  checkWin,
  chord,
  countFlags,
  createEmptyBoard,
  DIFFICULTIES,
  Difficulty,
  flagAllMines,
  placeMines,
  revealAllMines,
  revealFlood,
} from "@/lib/minesweeper";
import { GameBoard } from "./Board";
import { HUD } from "./HUD";
import { SettingsModal } from "./SettingsModal";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon } from "lucide-react";
import { setSoundEnabled, sounds } from "@/lib/sounds";

type GameStatus = "idle" | "playing" | "won" | "lost";
type Theme = "light" | "dark" | "system";

const BEST_KEY = "minesweeper:best";
const PREF_KEY = "minesweeper:prefs";

function fireConfetti() {
  const colors = ["#22c55e", "#eab308", "#3b82f6", "#ef4444", "#a855f7", "#f97316"];
  // Big center burst
  confetti({ particleCount: 180, spread: 100, startVelocity: 55, origin: { y: 0.6 }, colors, scalar: 1.1 });
  // Side cannons
  confetti({ particleCount: 120, angle: 60, spread: 80, startVelocity: 65, origin: { x: 0, y: 0.7 }, colors });
  confetti({ particleCount: 120, angle: 120, spread: 80, startVelocity: 65, origin: { x: 1, y: 0.7 }, colors });
  // Delayed follow-up bursts
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 120, startVelocity: 35, origin: { y: 0.5 }, colors, scalar: 0.9, ticks: 200 });
  }, 250);
  setTimeout(() => {
    confetti({ particleCount: 60, angle: 90, spread: 140, startVelocity: 45, origin: { x: 0.3, y: 0.4 }, colors, shapes: ["star"], scalar: 1.2 });
    confetti({ particleCount: 60, angle: 90, spread: 140, startVelocity: 45, origin: { x: 0.7, y: 0.4 }, colors, shapes: ["star"], scalar: 1.2 });
  }, 500);
  setTimeout(() => {
    confetti({ particleCount: 100, spread: 160, startVelocity: 30, origin: { y: 0.3 }, colors, scalar: 0.8 });
  }, 800);
}

function triggerShake() {
  const el = document.getElementById("minesweeper-root");
  if (!el) return;
  el.classList.remove("screen-shake");
  // force reflow so the animation can replay
  void el.offsetWidth;
  el.classList.add("screen-shake");
  setTimeout(() => el.classList.remove("screen-shake"), 600);
}

export function Minesweeper() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [board, setBoard] = useState<Board>(() => createEmptyBoard(DIFFICULTIES.easy.rows, DIFFICULTIES.easy.cols));
  const [status, setStatus] = useState<GameStatus>("idle");
  const [time, setTime] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [theme, setTheme] = useState<Theme>("system");
  const [bestTimes, setBestTimes] = useState<Record<string, number>>({});
  const [faceBounce, setFaceBounce] = useState(false);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
      if (typeof p.sound === "boolean") setSound(p.sound);
      if (p.theme) setTheme(p.theme);
      const b = JSON.parse(localStorage.getItem(BEST_KEY) || "{}");
      setBestTimes(b);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ sound, theme }));
    setSoundEnabled(sound);
  }, [sound, theme]);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", dark);
    };
    apply();
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      if (startedAt.current) setTime(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => clearInterval(id);
  }, [status]);

  const config = DIFFICULTIES[difficulty];
  const flags = useMemo(() => countFlags(board), [board]);
  const mineCounter = config.mines - flags;

  const recordBest = useCallback((elapsed: number) => {
    setBestTimes((bt) => {
      const cur = bt[difficulty];
      if (!cur || elapsed < cur) {
        const next = { ...bt, [difficulty]: elapsed };
        localStorage.setItem(BEST_KEY, JSON.stringify(next));
        return next;
      }
      return bt;
    });
  }, [difficulty]);

  const restart = useCallback((d: Difficulty = difficulty) => {
    const cfg = DIFFICULTIES[d];
    setBoard(createEmptyBoard(cfg.rows, cfg.cols));
    setStatus("idle");
    setTime(0);
    startedAt.current = null;
    setFaceBounce(true);
    setTimeout(() => setFaceBounce(false), 300);
  }, [difficulty]);

  const changeDifficulty = (d: Difficulty) => { setDifficulty(d); restart(d); };

  const handleReveal = useCallback((r: number, c: number) => {
    if (status === "won" || status === "lost") return;
    setBoard((prev) => {
      let working = prev;
      if (status === "idle") {
        working = placeMines(prev, config.mines, r, c);
        startedAt.current = Date.now();
        setStatus("playing");
      }
      const cell = working[r][c];
      if (cell.state === "flagged" || cell.state === "revealed") return working;
      if (cell.isMine) {
        const nb = working.map((row) => row.map((c) => ({ ...c })));
        nb[r][c].state = "revealed";
        nb[r][c].exploded = true;
        setStatus("lost");
        sounds.lose();
        triggerShake();
        return revealAllMines(nb);
      }
      const nb = revealFlood(working, r, c);
      sounds.reveal();
      if (checkWin(nb)) {
        const finalBoard = flagAllMines(nb);
        setStatus("won");
        const elapsed = Math.floor((Date.now() - (startedAt.current || Date.now())) / 1000);
        setTime(elapsed);
        sounds.win();
        recordBest(elapsed);
        setTimeout(fireConfetti, 50);
        return finalBoard;
      }
      return nb;
    });
  }, [status, config.mines, recordBest]);

  const handleFlag = useCallback((r: number, c: number) => {
    if (status === "won" || status === "lost") return;
    setBoard((prev) => {
      const cell = prev[r][c];
      if (cell.state === "revealed") return prev;
      const nb = prev.map((row) => row.map((c) => ({ ...c })));
      nb[r][c].state = cell.state === "flagged" ? "hidden" : "flagged";
      sounds.flag();
      return nb;
    });
  }, [status]);

  const handleChord = useCallback((r: number, c: number) => {
    if (status !== "playing") return;
    setBoard((prev) => {
      const { board: nb, hitMine } = chord(prev, r, c);
      if (nb === prev) return prev;
      if (hitMine) {
        setStatus("lost");
        sounds.lose();
        triggerShake();
        return revealAllMines(nb);
      }
      sounds.click();
      if (checkWin(nb)) {
        const finalBoard = flagAllMines(nb);
        setStatus("won");
        const elapsed = Math.floor((Date.now() - (startedAt.current || Date.now())) / 1000);
        setTime(elapsed);
        sounds.win();
        recordBest(elapsed);
        setTimeout(fireConfetti, 50);
        return finalBoard;
      }
      return nb;
    });
  }, [status, recordBest]);

  const face = status === "won" ? "😎" : status === "lost" ? "😵" : "🙂";

  return (
    <div id="minesweeper-root" className="min-h-screen w-full flex flex-col items-center px-4 py-6 sm:py-10 animate-fade-in">
      <header className="w-full max-w-5xl flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-header bg-clip-text text-transparent">
            Minesweeper
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Clear the field. Trust the numbers.</p>
        </div>
        <Button variant="outline" size="icon" className="rounded-full shadow-soft" onClick={() => setSettingsOpen(true)} aria-label="Open settings">
          <SettingsIcon className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex gap-1 mb-5 p-1.5 bg-card rounded-full shadow-soft">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => changeDifficulty(d)}
            className={`px-4 py-1.5 rounded-full font-display font-semibold text-sm transition-all ${
              difficulty === d ? "bg-gradient-header text-primary-foreground shadow-md scale-105" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {DIFFICULTIES[d].label}
          </button>
        ))}
      </div>

      <HUD mines={mineCounter} time={time} face={face} onRestart={() => restart()} bouncing={faceBounce} />

      <GameBoard board={board} onReveal={handleReveal} onFlag={handleFlag} onChord={handleChord} disabled={status === "won" || status === "lost"} />

      <div className="mt-6 text-center text-sm text-muted-foreground max-w-md">
        <p>
          <span className="font-semibold text-foreground">Left click</span> reveal ·{" "}
          <span className="font-semibold text-foreground">Right click</span> flag ·{" "}
          <span className="font-semibold text-foreground">Click number</span> to chord
        </p>
        {status === "won" && (
          <p className="mt-2 text-primary font-display font-semibold text-lg animate-fade-in">You won in {time}s! 🎉</p>
        )}
        {status === "lost" && (
          <p className="mt-2 text-destructive font-display font-semibold text-lg animate-fade-in">Boom! Try again.</p>
        )}
      </div>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} sound={sound} setSound={setSound} theme={theme} setTheme={setTheme} bestTimes={bestTimes} />
    </div>
  );
}