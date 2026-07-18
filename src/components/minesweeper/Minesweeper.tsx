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
import { HowToPlayModal } from "./HowToPlayModal";
import { Button } from "@/components/ui/button";
import { CircleHelp, Settings as SettingsIcon } from "lucide-react";
import { setSoundEnabled, sounds } from "@/lib/sounds";

type GameStatus = "idle" | "playing" | "won" | "lost";
type Theme = "light" | "dark" | "system";

type GameEvent =
  | { id: number; type: "reveal" | "flag" | "chord" | "restart" }
  | { id: number; type: "explosion" }
  | { id: number; type: "win"; difficulty: Difficulty; elapsed: number };

interface GameState {
  difficulty: Difficulty;
  board: Board;
  status: GameStatus;
  time: number;
  startedAt: number | null;
  event: GameEvent | null;
}

type GameAction =
  | { type: "restart"; difficulty: Difficulty; eventId: number }
  | { type: "reveal"; r: number; c: number; now: number; eventId: number }
  | { type: "flag"; r: number; c: number; eventId: number }
  | { type: "chord"; r: number; c: number; now: number; eventId: number }
  | { type: "tick"; now: number };

const BEST_KEY = "minesweeper:best";
const PREF_KEY = "minesweeper:prefs";

function createGameState(difficulty: Difficulty, event: GameEvent | null = null): GameState {
  const cfg = DIFFICULTIES[difficulty];
  return {
    difficulty,
    board: createEmptyBoard(cfg.rows, cfg.cols),
    status: "idle",
    time: 0,
    startedAt: null,
    event,
  };
}

function fireConfetti() {
  const colors = ["#4285F4", "#EA4335", "#FBBC04", "#34A853", "#a855f7", "#F97316"];
  confetti({ particleCount: 260, spread: 105, startVelocity: 64, gravity: 0.85, ticks: 260, origin: { y: 0.62 }, colors });
  confetti({ particleCount: 120, angle: 58, spread: 72, startVelocity: 72, origin: { x: 0, y: 0.82 }, colors });
  confetti({ particleCount: 120, angle: 122, spread: 72, startVelocity: 72, origin: { x: 1, y: 0.82 }, colors });

  const end = Date.now() + 1900;
  const rain = () => {
    confetti({
      particleCount: 12,
      spread: 80,
      startVelocity: 34,
      scalar: 1.15,
      origin: { x: Math.random(), y: Math.random() * 0.25 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(rain);
  };
  setTimeout(rain, 180);
}

function triggerExplosionEffects() {
  const el = document.getElementById("minesweeper-root");
  if (!el) return;
  el.classList.remove("screen-shake");
  el.classList.remove("blast-flash");
  // force reflow so the animation can replay
  void el.offsetWidth;
  el.classList.add("screen-shake");
  el.classList.add("blast-flash");
  setTimeout(() => {
    el.classList.remove("screen-shake");
    el.classList.remove("blast-flash");
  }, 900);
}

function reduceGame(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "restart":
      return createGameState(action.difficulty, { id: action.eventId, type: "restart" });
    case "tick": {
      if (state.status !== "playing" || !state.startedAt) return state;
      const time = Math.floor((action.now - state.startedAt) / 1000);
      return time === state.time ? state : { ...state, time };
    }
    case "flag": {
      if (state.status === "won" || state.status === "lost") return state;
      const cell = state.board[action.r][action.c];
      if (cell.state === "revealed") return state;
      const board = state.board.map((row) => row.map((item) => ({ ...item })));
      board[action.r][action.c].state = cell.state === "flagged" ? "hidden" : "flagged";
      return { ...state, board, event: { id: action.eventId, type: "flag" } };
    }
    case "reveal": {
      if (state.status === "won" || state.status === "lost") return state;
      const current = state.board[action.r][action.c];
      if (current.state === "flagged" || current.state === "revealed") return state;

      let board = state.board;
      let status: GameStatus = state.status;
      let startedAt = state.startedAt;

      if (state.status === "idle") {
        board = placeMines(state.board, DIFFICULTIES[state.difficulty].mines, action.r, action.c);
        status = "playing";
        startedAt = action.now;
      }

      const cell = board[action.r][action.c];
      if (cell.isMine) {
        const exploded = board.map((row) => row.map((item) => ({ ...item })));
        exploded[action.r][action.c].state = "revealed";
        exploded[action.r][action.c].exploded = true;
        return { ...state, board: revealAllMines(exploded), status: "lost", startedAt, event: { id: action.eventId, type: "explosion" } };
      }

      const revealed = revealFlood(board, action.r, action.c);
      if (checkWin(revealed)) {
        const elapsed = Math.floor((action.now - (startedAt || action.now)) / 1000);
        return {
          ...state,
          board: flagAllMines(revealed),
          status: "won",
          time: elapsed,
          startedAt,
          event: { id: action.eventId, type: "win", difficulty: state.difficulty, elapsed },
        };
      }
      return { ...state, board: revealed, status, startedAt, event: { id: action.eventId, type: "reveal" } };
    }
    case "chord": {
      if (state.status !== "playing") return state;
      const { board, hitMine } = chord(state.board, action.r, action.c);
      if (board === state.board) return state;
      if (hitMine) {
        return { ...state, board: revealAllMines(board), status: "lost", event: { id: action.eventId, type: "explosion" } };
      }
      if (checkWin(board)) {
        const elapsed = Math.floor((action.now - (state.startedAt || action.now)) / 1000);
        return {
          ...state,
          board: flagAllMines(board),
          status: "won",
          time: elapsed,
          event: { id: action.eventId, type: "win", difficulty: state.difficulty, elapsed },
        };
      }
      return { ...state, board, event: { id: action.eventId, type: "chord" } };
    }
    default:
      return state;
  }
}

export function Minesweeper() {
  const [game, setGame] = useState<GameState>(() => createGameState("easy"));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const [chording, setChording] = useState(true);
  const [theme, setTheme] = useState<Theme>("system");
  const [bestTimes, setBestTimes] = useState<Record<string, number>>({});
  const [faceBounce, setFaceBounce] = useState(false);
  const eventId = useRef(0);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
      if (typeof p.sound === "boolean") setSound(p.sound);
      if (typeof p.chording === "boolean") setChording(p.chording);
      if (p.theme) setTheme(p.theme);
      const b = JSON.parse(localStorage.getItem(BEST_KEY) || "{}");
      setBestTimes(b);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ sound, theme, chording }));
    setSoundEnabled(sound);
  }, [sound, theme, chording]);

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
    if (game.status !== "playing") return;
    const id = setInterval(() => {
      setGame((prev) => reduceGame(prev, { type: "tick", now: Date.now() }));
    }, 250);
    return () => clearInterval(id);
  }, [game.status]);

  const config = DIFFICULTIES[game.difficulty];
  const flags = useMemo(() => countFlags(game.board), [game.board]);
  const mineCounter = config.mines - flags;

  const recordBest = useCallback((diff: Difficulty, elapsed: number) => {
    setBestTimes((bt) => {
      const cur = bt[diff];
      if (!cur || elapsed < cur) {
        const next = { ...bt, [diff]: elapsed };
        localStorage.setItem(BEST_KEY, JSON.stringify(next));
        return next;
      }
      return bt;
    });
  }, []);

  useEffect(() => {
    const event = game.event;
    if (!event) return;
    if (event.type === "reveal") sounds.reveal();
    if (event.type === "flag") sounds.flag();
    if (event.type === "chord") sounds.click();
    if (event.type === "explosion") {
      sounds.explosion();
      triggerExplosionEffects();
    }
    if (event.type === "win") {
      sounds.win();
      recordBest(event.difficulty, event.elapsed);
      fireConfetti();
    }
  }, [game.event, recordBest]);

  const restart = useCallback((d: Difficulty = game.difficulty) => {
    setGame((prev) => reduceGame(prev, { type: "restart", difficulty: d, eventId: ++eventId.current }));
    setFaceBounce(true);
    setTimeout(() => setFaceBounce(false), 300);
  }, [game.difficulty]);

  const changeDifficulty = (d: Difficulty) => restart(d);

  const handleReveal = useCallback((r: number, c: number) => {
    sounds.prime();
    setGame((prev) => reduceGame(prev, { type: "reveal", r, c, now: Date.now(), eventId: ++eventId.current }));
  }, []);

  const handleFlag = useCallback((r: number, c: number) => {
    sounds.prime();
    setGame((prev) => reduceGame(prev, { type: "flag", r, c, eventId: ++eventId.current }));
  }, []);

  const handleChord = useCallback((r: number, c: number) => {
    if (!chording) return;
    sounds.prime();
    setGame((prev) => reduceGame(prev, { type: "chord", r, c, now: Date.now(), eventId: ++eventId.current }));
  }, [chording]);

  const face = game.status === "won" ? "😎" : game.status === "lost" ? "😵" : "🙂";

  return (
    <div id="minesweeper-root" className="min-h-screen w-full flex flex-col items-center px-4 py-6 sm:py-10 animate-fade-in">
      <header className="w-full max-w-5xl flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-header bg-clip-text text-transparent">
            Tile Tapper
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Clear the field. Trust the numbers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full shadow-soft" onClick={() => setHowToOpen(true)} aria-label="How to play">
            <CircleHelp className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full shadow-soft" onClick={() => setSettingsOpen(true)} aria-label="Open settings">
            <SettingsIcon className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex gap-1 mb-5 p-1.5 bg-card rounded-full shadow-soft">
        {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => changeDifficulty(d)}
            className={`px-4 py-1.5 rounded-full font-display font-semibold text-sm transition-all ${
              game.difficulty === d ? "bg-gradient-header text-primary-foreground shadow-md scale-105" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {DIFFICULTIES[d].label}
          </button>
        ))}
      </div>

      <HUD mines={mineCounter} time={game.time} face={face} onRestart={() => restart()} bouncing={faceBounce} />

      <GameBoard board={game.board} onReveal={handleReveal} onFlag={handleFlag} onChord={handleChord} disabled={game.status === "won" || game.status === "lost"} />

      <div className="mt-6 text-center text-sm text-muted-foreground max-w-md">
        <p>
          <span className="font-semibold text-foreground">Left click</span> reveal ·{" "}
          <span className="font-semibold text-foreground">Right click</span> flag
          {chording && (
            <>
              {" · "}
              <span className="font-semibold text-foreground">Click number</span> to chord
            </>
          )}
        </p>
        {game.status === "won" && (
          <p className="mt-2 text-primary font-display font-semibold text-lg animate-fade-in">You won in {game.time}s! 🎉</p>
        )}
        {game.status === "lost" && (
          <p className="mt-2 text-destructive font-display font-semibold text-lg animate-fade-in">Boom! Try again.</p>
        )}
      </div>

      <HowToPlayModal open={howToOpen} onOpenChange={setHowToOpen} />
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        sound={sound}
        setSound={setSound}
        chording={chording}
        setChording={setChording}
        theme={theme}
        setTheme={setTheme}
        bestTimes={bestTimes}
      />
    </div>
  );
}
