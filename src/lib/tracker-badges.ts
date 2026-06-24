import type { Workout } from "./tracker-types";
import { currentStreak, workoutsThisWeek, personalRecord, totalForSkill } from "./tracker-store";

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress: number; // 0..1
  progressLabel: string;
}

export function computeBadges(workouts: Workout[]): Badge[] {
  const plancheBest = personalRecord(workouts, "Planche");
  const handstandBest = personalRecord(workouts, "Handstand");
  const pushupsBest = personalRecord(workouts, "Push-ups");
  const pushupsTotal = totalForSkill(workouts, "Push-ups");
  const anyHoldBest = Math.max(plancheBest, handstandBest);
  const streak = currentStreak(workouts);
  const week = workoutsThisWeek(workouts);
  const prCount = workouts.filter((w) => w.isNewPR).length;

  const def = (
    id: string,
    name: string,
    description: string,
    emoji: string,
    current: number,
    target: number,
    unit = "",
  ): Badge => ({
    id,
    name,
    description,
    emoji,
    unlocked: current >= target,
    progress: Math.min(1, current / target),
    progressLabel: `${Math.min(current, target)}${unit} / ${target}${unit}`,
  });

  return [
    def("first-planche", "First Planche Hold", "Log any planche hold", "🤸", plancheBest > 0 ? 1 : 0, 1),
    def("ten-second-club", "10 Second Club", "Hold any static skill for 10s", "⏱️", anyHoldBest, 10, "s"),
    def("twenty-master", "20 Second Master", "Hold any static skill for 20s", "🔥", anyHoldBest, 20, "s"),
    def("consistency-king", "Consistency King", "10 consecutive training days", "👑", streak, 10),
    def("strong-week", "Strong Week", "3+ workouts in 7 days", "💥", week, 3),
    def("pr-breaker", "PR Breaker", "Set a new personal record", "🏆", prCount, 1),
    def("hundred-reps", "100 Reps", "Hit 100 push-ups in one set", "💪", pushupsBest, 100),
    def("push-grind", "Push Grinder", "500 total push-ups logged", "🛠️", pushupsTotal, 500),
    def("handstand-30", "Handstand Veteran", "30s handstand hold", "🙆", handstandBest, 30, "s"),
    def("planche-15", "Planche Veteran", "15s planche hold", "🦅", plancheBest, 15, "s"),
  ];
}