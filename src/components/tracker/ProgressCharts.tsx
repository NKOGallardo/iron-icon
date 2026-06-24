import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { Workout } from "@/lib/tracker-types";
import { SKILLS, SKILL_META } from "@/lib/tracker-types";
import { chartDataForSkill, monthComparison } from "@/lib/tracker-store";

export function ProgressCharts({ workouts }: { workouts: Workout[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {SKILLS.map((skill) => {
        const meta = SKILL_META[skill];
        const data = chartDataForSkill(workouts, skill);
        const cmp = monthComparison(workouts, skill);
        const color = `var(--neon-${meta.accent})`;
        const delta = cmp.thisMonth.best - cmp.prevMonth.best;
        return (
          <div key={skill} className="card-elevated rounded-3xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{skill} • 14d</p>
                <h3 className="font-display font-bold text-lg">Best per day</h3>
              </div>
              <span className="text-2xl" aria-hidden>{meta.emoji}</span>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${skill}`} x1="0" x2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--color-muted-foreground)" }}
                    formatter={(v: number) => [`${v}${meta.unit}`, "Best"]}
                  />
                  <Line type="monotone" dataKey="value" stroke={`url(#grad-${skill})`} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-background/40 border border-border/60 p-2.5">
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">This month</p>
                <p className="font-display font-bold text-base">{cmp.thisMonth.best || 0}{meta.unit}</p>
                <p className="text-[10px] text-muted-foreground">{cmp.thisMonth.count} sessions</p>
              </div>
              <div className="rounded-xl bg-background/40 border border-border/60 p-2.5">
                <p className="text-[10px] uppercase text-muted-foreground tracking-widest">Last month</p>
                <p className="font-display font-bold text-base">{cmp.prevMonth.best || 0}{meta.unit}</p>
                <p className="text-[10px]" style={{ color: delta > 0 ? "var(--neon-cyan)" : delta < 0 ? "var(--color-destructive)" : "var(--color-muted-foreground)" }}>
                  {delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta}${meta.unit}`}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}