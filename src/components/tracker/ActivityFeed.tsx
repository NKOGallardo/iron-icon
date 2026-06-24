import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Workout } from "@/lib/tracker-types";
import { SKILL_META } from "@/lib/tracker-types";

export function ActivityFeed({
  workouts,
  onUpdate,
  onRemove,
  limit,
}: {
  workouts: Workout[];
  onUpdate: (id: string, patch: Partial<Workout>) => void;
  onRemove: (id: string) => void;
  limit?: number;
}) {
  const sorted = [...workouts].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const list = limit ? sorted.slice(0, limit) : sorted;

  if (list.length === 0) {
    return (
      <div className="card-elevated rounded-3xl p-8 text-center text-sm text-muted-foreground">
        No workouts yet. Log your first one to start earning XP. ⚡
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {list.map((w) => (
        <FeedItem key={w.id} w={w} onUpdate={onUpdate} onRemove={onRemove} />
      ))}
    </ul>
  );
}

function FeedItem({ w, onUpdate, onRemove }: { w: Workout; onUpdate: (id: string, patch: Partial<Workout>) => void; onRemove: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(w.value));
  const meta = SKILL_META[w.skill];
  const color = `var(--neon-${meta.accent})`;

  return (
    <li
      className="card-elevated rounded-2xl p-3 flex items-center gap-3"
      style={{ borderColor: w.isNewPR ? "var(--neon-gold)" : undefined }}
    >
      <div className="size-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: `color-mix(in oklab, ${color} 15%, transparent)` }}>
        {meta.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display font-semibold text-sm truncate">{w.skill}</p>
          {w.isNewPR && <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md" style={{ background: "var(--gradient-gold)", color: "var(--color-primary-foreground)" }}>PR</span>}
        </div>
        <p className="text-xs text-muted-foreground">{new Date(w.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
        {w.notes && !editing && <p className="text-xs mt-1 text-muted-foreground/90 italic">"{w.notes}"</p>}
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            className="w-20 h-8"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button size="sm" variant="ghost" onClick={() => { onUpdate(w.id, { value: Number(value) || w.value }); setEditing(false); }}>Save</Button>
        </div>
      ) : (
        <p className="font-display font-bold text-lg shrink-0" style={{ color }}>{w.value}{meta.unit}</p>
      )}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button size="icon" variant="ghost" className="size-8" onClick={() => setEditing((v) => !v)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={() => onRemove(w.id)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}