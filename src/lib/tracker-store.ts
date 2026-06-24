import { useEffect, useState, useCallback } from "react";
import type { Workout, Skill } from "./tracker-types";
import { SKILL_META } from "./tracker-types";

const STORAGE_KEY = "calisthenics-tracker-v1";

function load(): Workout[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Workout[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items: Workout[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const listeners = new Set<() => void>();
let cache: Workout[] | null = null;

function getAll(): Workout[] {
  if (cache === null) cache = load();
  return cache;
}

function setAll(items: Workout[]) {
  cache = items;
  save(items);
  listeners.forEach((l) => l());
}

export function useWorkouts() {
  const [items, setItems] = useState<Workout[]>(() => (typeof window === "undefined" ? [] : getAll()));
  useEffect(() => {
    setItems(getAll());
    const l = () => setItems([...getAll()]);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const add = useCallback((w: Omit<Workout, "id" | "isNewPR">) => {
    const current = getAll();
    const prevBest = Math.max(0, ...current.filter((x) => x.skill === w.skill).map((x) => x.value));
    const isNewPR = w.value > prevBest;
    const full: Workout = { ...w, id: crypto.randomUUID(), isNewPR };
    setAll([full, ...current]);
    return full;
  }, []);

  const update = useCallback((id: string, patch: Partial<Workout>) => {
    setAll(getAll().map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const remove = useCallback((id: string) => {
    setAll(getAll().filter((w) => w.id !== id));
  }, []);

  const reset = useCallback(() => setAll([]), []);

  return { workouts: items, add, update, remove, reset };
}

// ----- Stats helpers -----

export function personalRecord(workouts: Workout[], skill: Skill): number {
  return workouts.filter((w) => w.skill === skill).reduce((m, w) => Math.max(m, w.value), 0);
}

export function totalForSkill(workouts: Workout[], skill: Skill): number {
  return workouts.filter((w) => w.skill === skill).reduce((s, w) => s + w.value, 0);
}

export function lastWorkoutForSkill(workouts: Workout[], skill: Skill): Workout | undefined {
  return workouts.filter((w) => w.skill === skill).sort((a, b) => +new Date(b.date) - +new Date(a.date))[0];
}

export function xpForWorkout(w: Workout): number {
  // Holds: 5 base + value (1 per second). Reps: 2 base + 0.5 per rep. PR bonus +20.
  const base = w.type === "hold" ? 5 + w.value : 2 + w.value * 0.5;
  const pr = w.isNewPR ? 20 : 0;
  return Math.round(base + pr);
}

export function totalXP(workouts: Workout[]): number {
  return workouts.reduce((s, w) => s + xpForWorkout(w), 0);
}

// Level curve: level n requires n*100 cumulative XP (simple triangle-ish)
export function levelFromXP(xp: number) {
  // total xp to reach level L = 100 * L * (L+1) / 2
  let level = 1;
  while (100 * level * (level + 1) / 2 <= xp) level++;
  const currentLevelFloor = 100 * (level - 1) * level / 2;
  const nextLevelFloor = 100 * level * (level + 1) / 2;
  const into = xp - currentLevelFloor;
  const span = nextLevelFloor - currentLevelFloor;
  return {
    level,
    intoLevel: into,
    levelSpan: span,
    pctToNext: Math.min(100, Math.round((into / span) * 100)),
  };
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function currentStreak(workouts: Workout[]): number {
  if (workouts.length === 0) return 0;
  const days = new Set(workouts.map((w) => dayKey(new Date(w.date))));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // allow today missing if no workout yet today — start from yesterday
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function workoutsThisWeek(workouts: Workout[]): number {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return workouts.filter((w) => new Date(w.date) >= start).length;
}

export function weeklyTrendDelta(workouts: Workout[], skill: Skill): number {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = workouts.filter(
    (w) => w.skill === skill && now - +new Date(w.date) <= weekMs,
  );
  const lastWeek = workouts.filter(
    (w) => w.skill === skill && now - +new Date(w.date) > weekMs && now - +new Date(w.date) <= 2 * weekMs,
  );
  const avg = (arr: Workout[]) => (arr.length === 0 ? 0 : arr.reduce((s, w) => s + w.value, 0) / arr.length);
  return avg(thisWeek) - avg(lastWeek);
}

export function chartDataForSkill(workouts: Workout[], skill: Skill) {
  // last 14 days, best result per day
  const days: { date: string; value: number; label: string }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayWorkouts = workouts.filter(
      (w) => w.skill === skill && new Date(w.date) >= d && new Date(w.date) < next,
    );
    const best = dayWorkouts.reduce((m, w) => Math.max(m, w.value), 0);
    days.push({
      date: d.toISOString(),
      value: best,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    });
  }
  return days;
}

export function calendarHeatmap(workouts: Workout[]) {
  // last 12 weeks (84 days) — array of {date, count}
  const cells: { date: Date; count: number }[] = [];
  const counts = new Map<string, number>();
  for (const w of workouts) {
    const k = dayKey(new Date(w.date));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    cells.push({ date: d, count: counts.get(dayKey(d)) ?? 0 });
  }
  return cells;
}

export function monthComparison(workouts: Workout[], skill: Skill) {
  const now = new Date();
  const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
  const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisM = workouts.filter((w) => w.skill === skill && new Date(w.date) >= startThis);
  const prevM = workouts.filter(
    (w) => w.skill === skill && new Date(w.date) >= startPrev && new Date(w.date) < startThis,
  );
  const best = (arr: Workout[]) => arr.reduce((m, w) => Math.max(m, w.value), 0);
  return {
    thisMonth: { count: thisM.length, best: best(thisM) },
    prevMonth: { count: prevM.length, best: best(prevM) },
  };
}

export function exportCSV(workouts: Workout[]): string {
  const header = "id,skill,type,value,date,notes,isNewPR";
  const rows = workouts.map((w) =>
    [
      w.id,
      w.skill,
      w.type,
      w.value,
      w.date,
      (w.notes ?? "").replace(/"/g, '""'),
      w.isNewPR ? "true" : "false",
    ]
      .map((v) => `"${String(v)}"`)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

export function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function skillTitle(workouts: Workout[], skill: Skill): string {
  const pr = personalRecord(workouts, skill);
  const tiers = skill === "Push-ups" ? [0, 20, 50, 100, 200] : [0, 5, 15, 30, 60];
  const titles = SKILL_META[skill].titles;
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) if (pr >= tiers[i]) idx = i;
  return titles[idx] ?? titles[0] ?? "";
}