import { useState } from "react";
import confetti from "canvas-confetti";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Skill, Workout } from "@/lib/tracker-types";
import { SKILLS, SKILL_META } from "@/lib/tracker-types";

interface Props {
  defaultSkill?: Skill;
  trigger?: React.ReactNode;
  onAdd: (w: Omit<Workout, "id" | "isNewPR">) => Workout;
}

const QUICK_HOLD = [5, 10, 15, 20, 30, 45, 60];
const QUICK_REPS = [10, 20, 30, 50, 75, 100];

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddWorkoutDialog({ defaultSkill = "Planche", trigger, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [skill, setSkill] = useState<Skill>(defaultSkill);
  const [value, setValue] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => toLocalInput(new Date()));

  const meta = SKILL_META[skill];
  const quick = meta.type === "hold" ? QUICK_HOLD : QUICK_REPS;

  function reset() {
    setValue("");
    setNotes("");
    setDate(toLocalInput(new Date()));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      toast.error("Enter a value greater than 0");
      return;
    }
    const created = onAdd({
      skill,
      type: meta.type,
      value: num,
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined,
    });
    if (created.isNewPR) {
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
      toast.success(`🏆 New PR! ${skill} ${num}${meta.unit}`);
    } else {
      toast.success(`Workout logged: ${skill} ${num}${meta.unit}`);
    }
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg" className="font-display font-semibold" style={{ background: "var(--gradient-hero)", color: "var(--color-primary-foreground)" }}>
            <Plus className="size-4" /> Add Workout
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Log a workout</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label>Skill</Label>
            <div className="grid grid-cols-3 gap-2">
              {SKILLS.map((s) => {
                const m = SKILL_META[s];
                const active = s === skill;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSkill(s)}
                    className="rounded-xl border px-2 py-3 text-sm font-medium transition"
                    style={{
                      borderColor: active ? `var(--neon-${m.accent})` : "var(--color-border)",
                      background: active ? `color-mix(in oklab, var(--neon-${m.accent}) 15%, transparent)` : "transparent",
                      color: active ? `var(--neon-${m.accent})` : undefined,
                    }}
                  >
                    <div className="text-xl">{m.emoji}</div>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">{meta.type === "hold" ? "Hold duration (seconds)" : "Reps completed"}</Label>
            <Input
              id="value"
              type="number"
              min={0}
              step={meta.type === "hold" ? "0.5" : "1"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={meta.type === "hold" ? "e.g. 12" : "e.g. 25"}
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {quick.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setValue(String(q))}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 hover:bg-muted transition"
                >
                  {q}{meta.unit}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date & time</Label>
            <Input id="date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Felt strong, slight wrist tightness…" rows={2} />
          </div>

          <Button type="submit" size="lg" className="w-full font-display font-semibold" style={{ background: "var(--gradient-hero)", color: "var(--color-primary-foreground)" }}>
            Save workout
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}