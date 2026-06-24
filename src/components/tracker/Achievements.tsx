import type { Workout } from "@/lib/tracker-types";
import { computeBadges } from "@/lib/tracker-badges";

export function Achievements({ workouts }: { workouts: Workout[] }) {
  const badges = computeBadges(workouts);
  const unlocked = badges.filter((b) => b.unlocked);
  const upcoming = badges.filter((b) => !b.unlocked).sort((a, b) => b.progress - a.progress);

  return (
    <section className="card-elevated rounded-3xl p-5 md:p-6 space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display font-bold text-xl">Achievements</h2>
        <span className="text-sm text-muted-foreground">{unlocked.length} / {badges.length}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...unlocked, ...upcoming].map((b) => (
          <div
            key={b.id}
            className="rounded-2xl border p-4 flex gap-3 items-center transition"
            style={{
              borderColor: b.unlocked ? "var(--neon-gold)" : "var(--color-border)",
              background: b.unlocked
                ? "linear-gradient(135deg, color-mix(in oklab, var(--neon-gold) 18%, transparent), transparent)"
                : "var(--color-background)",
              opacity: b.unlocked ? 1 : 0.85,
            }}
          >
            <div
              className="size-12 shrink-0 rounded-xl flex items-center justify-center text-2xl"
              style={{
                background: b.unlocked ? "var(--gradient-gold)" : "var(--color-muted)",
                filter: b.unlocked ? "none" : "grayscale(0.8)",
              }}
            >
              {b.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-sm leading-tight">{b.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{b.description}</p>
              {!b.unlocked && (
                <div className="mt-1.5 space-y-1">
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${b.progress * 100}%`, background: "var(--neon-cyan)" }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{b.progressLabel}</p>
                </div>
              )}
              {b.unlocked && <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--neon-gold)" }}>Unlocked</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}