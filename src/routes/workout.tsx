import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { PLANS, planById, type WorkoutPlan, type WorkoutStep } from "@/lib/workout-plans";
import { useWorkouts, xpForWorkout } from "@/lib/tracker-store";
import type { Workout } from "@/lib/tracker-types";

export const Route = createFileRoute("/workout")({
  head: () => ({
    meta: [
      { title: "Workout · Ascent" },
      { name: "description", content: "Guided calisthenics workouts with timers, form cues, and auto-logged results." },
    ],
  }),
  component: WorkoutPage,
});

interface SetResult {
  stepId: string;
  exerciseKey: string;
  exerciseLabel: string;
  kind: "hold" | "reps" | "checklist";
  target: number;
  actual: number;
  difficulty: "Easy" | "Normal" | "Hard";
  logSkill?: Workout["skill"];
  setNumber?: number;
}

const PROGRESS_KEY = "ascent-workout-progress-v1";

interface SavedProgress {
  planId: string;
  stepIndex: number;
  results: SetResult[];
  startedAt: string;
  elapsedAtPause: number; // seconds
}

function WorkoutPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [resume, setResume] = useState<SavedProgress | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(PROGRESS_KEY);
      if (raw) setResume(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  if (activeId) {
    return (
      <Player
        planId={activeId}
        initial={resume && resume.planId === activeId ? resume : null}
        onExit={() => {
          setActiveId(null);
          setResume(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10 max-w-5xl mx-auto">
      <Toaster theme="dark" position="top-right" />
      <header className="flex items-center justify-between mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
            <Zap className="size-4 text-background" />
          </div>
          <span className="font-display font-bold tracking-wide">WORKOUT</span>
        </div>
      </header>

      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Pick your battle</h1>
        <p className="text-muted-foreground text-sm">Three guided sessions. Timers, form cues, auto-logged results.</p>
      </div>

      {resume ? (
        <div className="mb-6 rounded-2xl border border-border bg-card/60 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">In progress</div>
            <div className="font-semibold">{planById(resume.planId)?.title}</div>
            <div className="text-xs text-muted-foreground">
              Step {resume.stepIndex + 1} · {resume.results.length} sets logged
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              window.localStorage.removeItem(PROGRESS_KEY);
              setResume(null);
            }}>Discard</Button>
            <Button size="sm" onClick={() => setActiveId(resume.planId)}>Resume</Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className="text-left rounded-2xl border border-border bg-card/60 p-5 hover:border-foreground/30 transition-colors hover-scale"
          >
            <div className="text-2xl mb-2">{p.emoji}</div>
            <div className="font-display font-bold text-lg leading-tight">{p.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{p.subtitle}</div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{p.durationMin}</span>
              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: accentColor(p.accent) }}>
                Start <ArrowRight className="size-3.5" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function accentColor(a: "purple" | "cyan" | "gold") {
  if (a === "purple") return "var(--neon-purple)";
  if (a === "cyan") return "var(--neon-cyan)";
  return "var(--neon-gold)";
}

function Player({
  planId,
  initial,
  onExit,
}: {
  planId: string;
  initial: SavedProgress | null;
  onExit: () => void;
}) {
  const plan = planById(planId)!;
  const { add } = useWorkouts();
  const [stepIndex, setStepIndex] = useState(initial?.stepIndex ?? 0);
  const [results, setResults] = useState<SetResult[]>(initial?.results ?? []);
  const [done, setDone] = useState(false);
  const startedAtRef = useRef<number>(initial ? +new Date(initial.startedAt) : Date.now());
  const [elapsed, setElapsed] = useState(initial?.elapsedAtPause ?? 0);

  // total wall clock
  useEffect(() => {
    if (done) return;
    const start = Date.now() - elapsed * 1000;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Persist progress
  useEffect(() => {
    if (done) return;
    const payload: SavedProgress = {
      planId: plan.id,
      stepIndex,
      results,
      startedAt: new Date(startedAtRef.current).toISOString(),
      elapsedAtPause: elapsed,
    };
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(payload));
    } catch {
      /* noop */
    }
  }, [stepIndex, results, elapsed, plan.id, done]);

  // wake lock
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } };
    if (nav.wakeLock?.request) {
      nav.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => undefined);
    }
    return () => { lock?.release().catch(() => undefined); };
  }, []);

  const step = plan.steps[stepIndex];
  const total = plan.steps.length;

  function recordResult(r: SetResult) {
    setResults((prev) => [...prev, r]);
  }

  function advance() {
    if (stepIndex >= total - 1) {
      finish();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  function finish() {
    setDone(true);
    confetti({ particleCount: 220, spread: 110, origin: { y: 0.5 }, colors: ["#7DD3FC", "#C4B5FD", "#FCD34D"] });
    try { window.localStorage.removeItem(PROGRESS_KEY); } catch { /* noop */ }
  }

  if (done) {
    return (
      <FinishScreen
        plan={plan}
        results={results}
        elapsed={elapsed}
        onLog={(notes) => {
          // Aggregate per logSkill: take best set value
          const map = new Map<string, { skill: Workout["skill"]; type: Workout["type"]; value: number }>();
          for (const r of results) {
            if (!r.logSkill) continue;
            const type: Workout["type"] = r.kind === "hold" ? "hold" : "reps";
            const key = `${r.logSkill}-${type}`;
            const existing = map.get(key);
            if (!existing || r.actual > existing.value) {
              map.set(key, { skill: r.logSkill, type, value: r.actual });
            }
          }
          const dateISO = new Date().toISOString();
          let logged = 0;
          for (const entry of map.values()) {
            if (entry.value <= 0) continue;
            add({
              skill: entry.skill,
              type: entry.type,
              value: entry.value,
              date: dateISO,
              notes: notes || `From ${plan.title}`,
            });
            logged++;
          }
          toast.success(`Logged ${logged} skill result${logged === 1 ? "" : "s"}`);
          onExit();
        }}
        onDiscard={onExit}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-5 md:px-8 md:py-8 max-w-6xl mx-auto">
      <Toaster theme="dark" position="top-right" />
      <header className="flex items-center justify-between mb-5 gap-3">
        <button onClick={onExit} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <X className="size-4" /> Exit
        </button>
        <div className="text-center min-w-0">
          <div className="font-display font-bold text-sm md:text-base truncate">{plan.title}</div>
          <div className="text-xs text-muted-foreground">Step {stepIndex + 1} / {total} · {fmt(elapsed)}</div>
        </div>
        <div className="w-12" />
      </header>

      <div className="mb-5">
        <Progress value={Math.round(((stepIndex) / total) * 100)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block rounded-2xl border border-border bg-card/40 p-3 max-h-[70vh] overflow-y-auto">
          <ExerciseList plan={plan} stepIndex={stepIndex} onJump={(i) => setStepIndex(i)} />
        </aside>

        <div className="space-y-4">
          <StepCard
            key={step.id}
            step={step}
            onComplete={(actual, difficulty) => {
              if (step.kind !== "rest") {
                recordResult({
                  stepId: step.id,
                  exerciseKey: step.exerciseKey,
                  exerciseLabel: step.exerciseLabel,
                  kind: step.kind,
                  target: step.targetSeconds ?? step.targetReps ?? 0,
                  actual,
                  difficulty,
                  logSkill: step.logSkill,
                  setNumber: step.setNumber,
                });
                if (step.logSkill && step.targetReps !== undefined && actual >= (step.targetReps ?? 0)) {
                  // small celebratory tick
                }
              }
              advance();
            }}
            onSkip={() => advance()}
          />

          <div className="lg:hidden">
            <details className="rounded-2xl border border-border bg-card/40 p-3">
              <summary className="cursor-pointer text-sm font-semibold">Workout outline</summary>
              <div className="mt-3"><ExerciseList plan={plan} stepIndex={stepIndex} onJump={(i) => setStepIndex(i)} /></div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseList({ plan, stepIndex, onJump }: { plan: WorkoutPlan; stepIndex: number; onJump: (i: number) => void }) {
  // Group by exerciseKey preserving order
  const groups: { phase: string; key: string; label: string; indices: number[] }[] = [];
  plan.steps.forEach((s, i) => {
    const last = groups[groups.length - 1];
    if (last && last.key === s.exerciseKey) last.indices.push(i);
    else groups.push({ phase: s.phase, key: s.exerciseKey, label: s.exerciseLabel, indices: [i] });
  });
  let lastPhase = "";
  return (
    <div className="space-y-1 text-sm">
      {groups.map((g) => {
        const showPhase = g.phase !== lastPhase;
        lastPhase = g.phase;
        const allDone = g.indices.every((i) => i < stepIndex);
        const active = g.indices.some((i) => i === stepIndex);
        return (
          <div key={g.key}>
            {showPhase ? <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3 mb-1 px-1">{g.phase}</div> : null}
            <button
              onClick={() => onJump(g.indices[0]!)}
              className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${active ? "bg-foreground/10 text-foreground" : allDone ? "text-muted-foreground" : "hover:bg-foreground/5"}`}
            >
              <span className={`grid place-items-center size-4 rounded-full border ${allDone ? "bg-foreground/80 text-background border-foreground/80" : active ? "border-foreground/60" : "border-border"}`}>
                {allDone ? <Check className="size-3" /> : null}
              </span>
              <span className="truncate">{g.label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Step cards ----------

function StepCard({ step, onComplete, onSkip }: {
  step: WorkoutStep;
  onComplete: (actual: number, difficulty: "Easy" | "Normal" | "Hard") => void;
  onSkip: () => void;
}) {
  if (step.kind === "rest") return <RestStep step={step} onComplete={() => onComplete(0, "Normal")} onSkip={onSkip} />;
  if (step.kind === "hold") return <HoldStep step={step} onComplete={onComplete} onSkip={onSkip} />;
  if (step.kind === "reps") return <RepsStep step={step} onComplete={onComplete} onSkip={onSkip} />;
  return <ChecklistStep step={step} onComplete={() => onComplete(1, "Normal")} onSkip={onSkip} />;
}

function beep(freq = 880, ms = 160) {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.type = "sine";
    g.gain.value = 0.08;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close().catch(() => undefined); }, ms);
  } catch { /* noop */ }
}

function HoldStep({ step, onComplete, onSkip }: { step: WorkoutStep; onComplete: (n: number, d: "Easy"|"Normal"|"Hard") => void; onSkip: () => void }) {
  const target = step.targetSeconds ?? 0;
  const [sec, setSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [reached, setReached] = useState(false);
  const [difficulty, setDifficulty] = useState<"Easy"|"Normal"|"Hard">("Normal");
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (sec > 0 && target > 0 && sec === target - 5 && !warnedRef.current) {
      warnedRef.current = true;
      beep(660, 100);
    }
    if (sec >= target && target > 0 && !reached) {
      setReached(true);
      beep(990, 220);
    }
  }, [sec, target, reached]);

  const pct = target > 0 ? Math.min(100, Math.round((sec / target) * 100)) : 0;

  return (
    <div className="rounded-3xl border border-border bg-card/60 p-5 md:p-7">
      <Header step={step} kindLabel="HOLD" />
      <div className="mt-6 text-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Target {target}s</div>
        <div className={`font-display font-bold leading-none my-2 tabular-nums text-7xl md:text-8xl transition-colors ${reached ? "text-emerald-400" : "text-foreground"}`}>
          {sec}
          <span className="text-2xl md:text-3xl text-muted-foreground">s</span>
        </div>
        <div className="max-w-md mx-auto">
          <Progress value={pct} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button size="lg" onClick={() => setRunning((r) => !r)}>
          {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start</>}
        </Button>
        <Button size="lg" variant="outline" onClick={() => { setSec(0); setReached(false); warnedRef.current = false; }}>
          <RotateCcw className="size-4" /> Reset
        </Button>
        <Button size="lg" variant="secondary" onClick={() => onComplete(sec, difficulty)}>
          <Check className="size-4" /> Done
        </Button>
      </div>

      <DifficultyRow value={difficulty} onChange={setDifficulty} />
      <FormCues cues={step.cues} />
      <SkipRow onSkip={onSkip} />
    </div>
  );
}

function RepsStep({ step, onComplete, onSkip }: { step: WorkoutStep; onComplete: (n: number, d: "Easy"|"Normal"|"Hard") => void; onSkip: () => void }) {
  const target = step.targetReps ?? 0;
  const [reps, setReps] = useState(0);
  const [difficulty, setDifficulty] = useState<"Easy"|"Normal"|"Hard">("Normal");
  const pct = target > 0 ? Math.min(100, Math.round((reps / target) * 100)) : 0;
  const reached = reps >= target && target > 0;

  return (
    <div className="rounded-3xl border border-border bg-card/60 p-5 md:p-7">
      <Header step={step} kindLabel="REPS" />
      <div className="mt-6 text-center">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Target {target} reps</div>
        <div className={`font-display font-bold leading-none my-2 tabular-nums text-7xl md:text-8xl ${reached ? "text-emerald-400" : "text-foreground"}`}>
          {reps}<span className="text-2xl md:text-3xl text-muted-foreground"> / {target}</span>
        </div>
        <div className="max-w-md mx-auto"><Progress value={pct} /></div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button size="lg" variant="outline" onClick={() => setReps((r) => Math.max(0, r - 1))}>
          <Minus className="size-4" />
        </Button>
        <Button size="lg" onClick={() => { setReps((r) => r + 1); beep(720, 80); }}>
          <Plus className="size-4" /> Add rep
        </Button>
        <Button size="lg" variant="secondary" onClick={() => onComplete(reps, difficulty)}>
          <Check className="size-4" /> Done
        </Button>
      </div>

      <DifficultyRow value={difficulty} onChange={setDifficulty} />
      <FormCues cues={step.cues} />
      <SkipRow onSkip={onSkip} />
    </div>
  );
}

function RestStep({ step, onComplete, onSkip }: { step: WorkoutStep; onComplete: () => void; onSkip: () => void }) {
  const target = step.restSeconds ?? 60;
  const [left, setLeft] = useState(target);
  const [running, setRunning] = useState(true);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (left === 0 && !firedRef.current) {
      firedRef.current = true;
      beep(990, 260);
      setTimeout(onComplete, 400);
    }
  }, [left, onComplete]);

  const pct = Math.round(((target - left) / target) * 100);

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5 md:p-7">
      <div className="text-xs uppercase tracking-widest text-amber-400 font-semibold">Rest</div>
      <div className="text-sm text-muted-foreground mt-1">Recover before · {step.exerciseLabel}</div>

      <div className="mt-6 text-center">
        <div className="font-display font-bold leading-none my-2 tabular-nums text-7xl md:text-8xl text-amber-300">
          {fmt(left)}
        </div>
        <div className="max-w-md mx-auto"><Progress value={pct} /></div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button size="lg" onClick={() => setRunning((r) => !r)}>
          {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Resume</>}
        </Button>
        <Button size="lg" variant="outline" onClick={() => setLeft(target)}>
          <RotateCcw className="size-4" /> Reset
        </Button>
        <Button size="lg" variant="secondary" onClick={onComplete}>
          <SkipForward className="size-4" /> Skip rest
        </Button>
      </div>
      <SkipRow onSkip={onSkip} />
    </div>
  );
}

function ChecklistStep({ step, onComplete, onSkip }: { step: WorkoutStep; onComplete: () => void; onSkip: () => void }) {
  return (
    <div className="rounded-3xl border border-border bg-card/60 p-5 md:p-7">
      <Header step={step} kindLabel="WARM-UP" />
      <div className="mt-6 text-center">
        <div className="text-lg md:text-xl text-muted-foreground">{step.instruction}</div>
      </div>
      <div className="mt-6 flex justify-center">
        <Button size="lg" onClick={onComplete}>
          <Check className="size-4" /> Mark complete
        </Button>
      </div>
      <SkipRow onSkip={onSkip} />
    </div>
  );
}

function Header({ step, kindLabel }: { step: WorkoutStep; kindLabel: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{step.phase} · {kindLabel}</div>
        <h2 className="font-display font-bold text-2xl md:text-3xl leading-tight mt-1 truncate">{step.exerciseLabel}</h2>
      </div>
      {step.totalSets ? (
        <div className="shrink-0 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-semibold">
          Set {step.setNumber} / {step.totalSets}
        </div>
      ) : null}
    </div>
  );
}

function DifficultyRow({ value, onChange }: { value: "Easy"|"Normal"|"Hard"; onChange: (v: "Easy"|"Normal"|"Hard") => void }) {
  return (
    <div className="mt-5 flex items-center justify-center gap-2 text-xs">
      <span className="text-muted-foreground mr-1">Difficulty:</span>
      {(["Easy","Normal","Hard"] as const).map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-3 py-1 rounded-full border transition-colors ${value === d ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground"}`}
        >{d}</button>
      ))}
    </div>
  );
}

function FormCues({ cues }: { cues?: string[] }) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  if (!cues || cues.length === 0) return null;
  return (
    <div className="mt-5 rounded-2xl border border-border bg-background/40">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between p-3 text-sm font-semibold">
        <span>Form cues</span>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {open ? (
        <ul className="px-3 pb-3 space-y-1.5">
          {cues.map((c, i) => {
            const on = checked.has(i);
            return (
              <li key={i}>
                <button
                  onClick={() => setChecked((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                  className={`w-full text-left flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 ${on ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <span className={`grid place-items-center size-4 rounded border ${on ? "bg-emerald-500 border-emerald-500 text-background" : "border-border"}`}>
                    {on ? <Check className="size-3" /> : null}
                  </span>
                  <span>{c}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function SkipRow({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="mt-4 text-center">
      <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground">Skip exercise →</button>
    </div>
  );
}

function FinishScreen({ plan, results, elapsed, onLog, onDiscard }: {
  plan: WorkoutPlan;
  results: SetResult[];
  elapsed: number;
  onLog: (notes: string) => void;
  onDiscard: () => void;
}) {
  const [notes, setNotes] = useState("");
  const xpEarned = useMemo(() => {
    return results.reduce((sum, r) => {
      if (r.kind === "checklist") return sum + 2;
      const fake: Workout = {
        id: "x", skill: r.logSkill ?? "Push-ups", type: r.kind === "hold" ? "hold" : "reps", value: r.actual, date: new Date().toISOString(),
      };
      return sum + xpForWorkout(fake);
    }, 0);
  }, [results]);

  const exercisesCompleted = new Set(results.map((r) => r.exerciseKey)).size;

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 max-w-2xl mx-auto">
      <Toaster theme="dark" position="top-right" />
      <div className="text-center mb-8">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl mb-4" style={{ background: "var(--gradient-hero)" }}>
          <Trophy className="size-8 text-background" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Workout complete</h1>
        <p className="text-muted-foreground mt-1">{plan.title}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Time" value={fmt(elapsed)} />
        <Stat label="Exercises" value={String(exercisesCompleted)} />
        <Stat label="XP earned" value={`+${xpEarned}`} />
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4 mb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Session log</div>
        <ul className="space-y-1 text-sm max-h-56 overflow-y-auto">
          {results.filter((r) => r.kind !== "checklist").map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3">
              <span className="truncate">
                {r.exerciseLabel} {r.setNumber ? `· Set ${r.setNumber}` : ""}
                {r.logSkill ? <span className="ml-1 text-[10px] uppercase tracking-widest text-muted-foreground">logged</span> : null}
              </span>
              <span className="tabular-nums font-semibold">
                {r.actual}{r.kind === "hold" ? "s" : ""} <span className="text-muted-foreground font-normal">/ {r.target}{r.kind === "hold" ? "s" : ""}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes — pain, energy, how it felt…"
        className="w-full rounded-2xl border border-border bg-background/60 p-3 text-sm mb-4 min-h-20"
      />

      <div className="flex flex-wrap gap-2 justify-end">
        <Button variant="outline" onClick={onDiscard}>Quit & discard</Button>
        <Button onClick={() => onLog(notes)}><Check className="size-4" /> Log results</Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-xl mt-1">{value}</div>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}