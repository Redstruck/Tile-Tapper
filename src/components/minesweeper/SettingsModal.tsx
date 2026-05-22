import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Monitor, Moon, Sun, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sound: boolean;
  setSound: (v: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  bestTimes: Record<string, number>;
}

export function SettingsModal({ open, onOpenChange, sound, setSound, theme, setTheme, bestTimes }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound" className="flex items-center gap-2 text-base">
              <Volume2 className="w-4 h-4" /> Sound effects
            </Label>
            <Switch id="sound" checked={sound} onCheckedChange={setSound} />
          </div>
          <div>
            <Label className="text-base mb-2 block">Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: "light", icon: Sun, label: "Light" },
                { v: "dark", icon: Moon, label: "Dark" },
                { v: "system", icon: Monitor, label: "Auto" },
              ] as const).map(({ v, icon: Icon, label }) => (
                <Button key={v} variant={theme === v ? "default" : "outline"} onClick={() => setTheme(v)} className="flex flex-col h-auto py-3 gap-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-base mb-2 block">Best times</Label>
            <div className="space-y-2">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <div key={d} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                  <span className="capitalize font-medium">{d}</span>
                  <span className="font-display tabular-nums">{bestTimes[d] ? `${bestTimes[d]}s` : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}