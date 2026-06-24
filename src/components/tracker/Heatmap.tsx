import type { Workout } from "@/lib/tracker-types";
import { calendarHeatmap } from "@/lib/tracker-store";

export function Heatmap({ workouts }: { workouts: Workout[] }) {
  const cells = calendarHeatmap(workouts);
  const max = Math.max(1, ...cells.map((c) => c.count));

  // group into columns of 7 days
  const cols: { date: Date; count: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));

  return (
    <section className="card-elevated rounded-3xl p-5 md:p-6 space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-display font-bold text-lg">Training calendar</h2>
          <p className="text-xs text-muted-foreground">Last 12 weeks</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0.15, 0.35, 0.6, 1].map((o) => (
            <span key={o} className="size-3 rounded-sm" style={{ background: `color-mix(in oklab, var(--neon-cyan) ${o * 100}%, var(--color-muted))` }} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((cell) => {
              const intensity = cell.count === 0 ? 0 : 0.15 + (cell.count / max) * 0.85;
              return (
                <span
                  key={cell.date.toISOString()}
                  title={`${cell.date.toLocaleDateString()} • ${cell.count} workout${cell.count === 1 ? "" : "s"}`}
                  className="size-3.5 rounded-sm shrink-0"
                  style={{
                    background: cell.count === 0
                      ? "var(--color-muted)"
                      : `color-mix(in oklab, var(--neon-cyan) ${intensity * 100}%, var(--color-muted))`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}