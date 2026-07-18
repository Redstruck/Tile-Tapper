import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const steps = [
  {
    title: "Reveal tiles",
    body: "Left-click a hidden tile to open it. Empty tiles flood outward. Numbers show how many mines sit in the eight neighboring tiles.",
    image: "/howto/reveal.png",
    alt: "Diagram showing hidden tiles becoming revealed with numbers",
    width: 1024,
    height: 581,
  },
  {
    title: "Flag mines",
    body: "Right-click (or Shift-click) to place a flag on a tile you think hides a mine. Flags protect tiles from accidental reveals and power chording.",
    image: "/howto/flag.png",
    alt: "Screenshot of flagged tiles on the board with a cursor pointing at a flag",
    width: 555,
    height: 337,
  },
  {
    title: "Chord clears",
    body: "When a revealed number has exactly that many flags around it, click the number (or middle-click) to clear every remaining neighbor at once. Wrong flags explode — turn chording off in Settings if you prefer.",
    image: "/howto/chord.png",
    alt: "Diagram of chording a number after matching flags to clear neighbors",
    width: 1024,
    height: 615,
  },
] as const;

export function HowToPlayModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-display text-2xl">How to play</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[min(70vh,560px)]">
          <div className="space-y-6 px-6 pb-6 pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Clear every safe tile without hitting a mine. Your first click is always safe — mines are placed after you start.
            </p>
            {steps.map((step) => (
              <section key={step.title} className="space-y-2">
                <h3 className="font-display font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                <img
                  src={step.image}
                  alt={step.alt}
                  className="w-full h-auto max-w-full rounded-xl border border-border shadow-soft object-contain"
                  loading="lazy"
                  width={step.width}
                  height={step.height}
                />
              </section>
            ))}
            <p className="text-xs text-muted-foreground pt-1 border-t border-border">
              Tip: chase best times on Easy, Medium, and Hard — your records are saved in Settings.
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
