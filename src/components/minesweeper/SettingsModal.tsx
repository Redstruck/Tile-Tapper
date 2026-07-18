import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sound: boolean;
  setSound: (v: boolean) => void;
  chording: boolean;
  setChording: (v: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  bestTimes: Record<string, number>;
}

const THEMES = [
  { v: "light" as const, label: "Light" },
  { v: "dark" as const, label: "Dark" },
  { v: "system" as const, label: "System" },
];

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

function formatTime(seconds: number | undefined) {
  if (!seconds) return "—";
  return `${seconds}s`;
}

export function SettingsModal({
  open,
  onOpenChange,
  sound,
  setSound,
  chording,
  setChording,
  theme,
  setTheme,
  bestTimes,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="font-display text-xl tracking-tight">Settings</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Sound, play style, and your best clears.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 space-y-5">
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Preferences
            </h3>
            <div className="rounded-lg bg-muted divide-y divide-border overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-3.5 py-3">
                <div className="min-w-0 space-y-0.5">
                  <Label htmlFor="sound" className="text-sm font-semibold cursor-pointer">
                    Sound effects
                  </Label>
                  <p className="text-xs text-muted-foreground leading-snug">Clicks, flags, and win fanfare</p>
                </div>
                <Switch id="sound" checked={sound} onCheckedChange={setSound} />
              </div>
              <div className="flex items-center justify-between gap-4 px-3.5 py-3">
                <div className="min-w-0 space-y-0.5">
                  <Label htmlFor="chording" className="text-sm font-semibold cursor-pointer">
                    Chording
                  </Label>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Click a number to clear neighbors when flags match
                  </p>
                </div>
                <Switch id="chording" checked={chording} onCheckedChange={setChording} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Appearance
            </h3>
            <div className="flex gap-1 p-1 rounded-full bg-muted" role="group" aria-label="Theme">
              {THEMES.map(({ v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTheme(v)}
                  aria-pressed={theme === v}
                  className={cn(
                    "flex-1 rounded-full px-3 py-2 font-display text-sm font-semibold transition-all",
                    theme === v
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Best times
            </h3>
            <div className="rounded-lg bg-muted overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {DIFFICULTIES.map((d, i) => (
                    <tr
                      key={d}
                      className={cn(i < DIFFICULTIES.length - 1 && "border-b border-border")}
                    >
                      <td className="px-3.5 py-2.5 capitalize font-medium">{d}</td>
                      <td className="px-3.5 py-2.5 text-right font-display tabular-nums">
                        {formatTime(bestTimes[d])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
