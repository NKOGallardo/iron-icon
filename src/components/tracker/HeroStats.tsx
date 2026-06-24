import { Flame, Trophy, Zap } from "lucide-react";
import type { Workout } from "@/lib/tracker-types";
import { currentStreak, levelFromXP, totalXP } from "@/lib/tracker-store";

export function HeroStats({ workouts }: { workouts: Workout[] }) {
  const xp = totalXP(workouts);
  const { level, intoLevel, levelSpan, pctToNext } = levelFromXP(xp);
  const streak = currentStreak(workouts);

  return (
    <section className="card-elevated rounded-3xl p-6 md:p-8 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: "var(--gradient-hero)" }}
      />
      <div className="relative grid gap-6 md:grid-cols-[1fr_auto] items-center">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-14 rounded-2xl flex items-center justify-center font-display text-2xl font-bold animate-pulse-glow"
              style={{ background: "var(--gradient-hero)", color: "var(--color-primary-foreground)" }}>
              {level}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Current level</p>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient-hero">
                Level {level} Athlete
              </h1>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>{intoLevel} / {levelSpan} XP</span>
              <span>{pctToNext}% to Level {level + 1}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-700 relative"
                style={{ width: `${pctToNext}%`, background: "var(--gradient-hero)" }}
              >
                <div className="absolute inset-0 animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex md:flex-col gap-3 md:gap-2">
          <Stat icon={<Zap className="size-4" />} label="Total XP" value={xp.toLocaleString()} accent="cyan" />
          <Stat icon={<Flame className="size-4" />} label="Streak" value={`${streak}d`} accent="gold" />
          <Stat icon={<Trophy className="size-4" />} label="Workouts" value={workouts.length.toString()} accent="purple" />
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: "cyan" | "purple" | "gold" }) {
  const color =
    accent === "cyan" ? "var(--neon-cyan)" : accent === "purple" ? "var(--neon-purple)" : "var(--neon-gold)";
  return (
    <div className="flex-1 md:flex-none flex items-center gap-3 rounded-2xl bg-card/60 backdrop-blur border border-border px-4 py-3">
      <div className="size-9 rounded-xl flex items-center justify-center" style={{ color, background: `color-mix(in oklab, ${color} 15%, transparent)` }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="font-display font-bold text-lg leading-tight">{value}</p>
      </div>
    </div>
  );
}