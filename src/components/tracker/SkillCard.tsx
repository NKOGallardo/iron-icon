import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Skill, Workout } from "@/lib/tracker-types";
import { SKILL_META } from "@/lib/tracker-types";
import {
  lastWorkoutForSkill,
  personalRecord,
  skillTitle,
  weeklyTrendDelta,
} from "@/lib/tracker-store";

export function SkillCard({ skill, workouts }: { skill: Skill; workouts: Workout[] }) {
  const meta = SKILL_META[skill];
  const pr = personalRecord(workouts, skill);
  const last = lastWorkoutForSkill(workouts, skill);
  const trend = weeklyTrendDelta(workouts, skill);
  const title = skillTitle(workouts, skill);

  const color =
    meta.accent === "cyan"
      ? "var(--neon-cyan)"
      : meta.accent === "purple"
        ? "var(--neon-purple)"
        : "var(--neon-gold)";

  return (
    <article
      className="card-elevated rounded-3xl p-5 relative overflow-hidden group transition-transform hover:-translate-y-1"
      style={{ borderColor: `color-mix(in oklab, ${color} 35%, var(--color-border))` }}
    >
      <div
        className="absolute -top-16 -right-16 size-40 rounded-full opacity-30 blur-3xl"
        style={{ background: color }}
      />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{meta.type === "hold" ? "Static hold" : "Reps"}</p>
            <h3 className="text-xl font-bold font-display">{skill}</h3>
            <p className="text-xs mt-0.5" style={{ color }}>{title}</p>
          </div>
          <div className="text-4xl" aria-hidden>{meta.emoji}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Block label="Personal Record" value={pr ? `${pr}${meta.unit}` : "—"} highlight color={color} />
          <Block
            label="Latest"
            value={last ? `${last.value}${meta.unit}` : "—"}
            sub={last ? new Date(last.date).toLocaleDateString() : "No workouts yet"}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <span>Weekly trend</span>
          <span className="inline-flex items-center gap-1 font-medium" style={{ color: trend > 0 ? "var(--neon-cyan)" : trend < 0 ? "var(--color-destructive)" : undefined }}>
            {trend > 0 ? <ArrowUpRight className="size-3.5" /> : trend < 0 ? <ArrowDownRight className="size-3.5" /> : <ArrowRight className="size-3.5" />}
            {trend === 0 ? "Steady" : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}${meta.unit}`}
          </span>
        </div>
      </div>
    </article>
  );
}

function Block({ label, value, sub, highlight, color }: { label: string; value: string; sub?: string; highlight?: boolean; color?: string }) {
  return (
    <div className="rounded-2xl bg-background/40 border border-border/60 p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className="font-display font-bold text-2xl leading-tight"
        style={highlight && color ? { color } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}