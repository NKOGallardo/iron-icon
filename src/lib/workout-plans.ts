import type { Skill } from "./tracker-types";

export type StepKind = "checklist" | "reps" | "hold" | "rest";

export interface WorkoutStep {
  id: string;
  kind: StepKind;
  name: string;
  // For sets-based exercises
  setNumber?: number;
  totalSets?: number;
  // Targets
  targetReps?: number;
  targetSeconds?: number;
  // For rest
  restSeconds?: number;
  // For checklist
  instruction?: string;
  // Form cues used for hold/reps
  cues?: string[];
  // Logging mapping
  logSkill?: Skill;
  // Grouping label for the left sidebar
  exerciseKey: string;
  exerciseLabel: string;
  phase: "Warm-up" | "Main" | "Supplementary";
}

export interface WorkoutPlan {
  id: "day1" | "day2" | "day3";
  title: string;
  subtitle: string;
  durationMin: string;
  accent: "purple" | "cyan" | "gold";
  emoji: string;
  steps: WorkoutStep[];
}

let _id = 0;
const nextId = () => `s${++_id}`;

function setsHold(opts: {
  key: string;
  label: string;
  phase: WorkoutStep["phase"];
  sets: number;
  seconds: number;
  restSeconds: number;
  cues?: string[];
  logSkill?: Skill;
}): WorkoutStep[] {
  const out: WorkoutStep[] = [];
  for (let i = 1; i <= opts.sets; i++) {
    out.push({
      id: nextId(),
      kind: "hold",
      name: opts.label,
      setNumber: i,
      totalSets: opts.sets,
      targetSeconds: opts.seconds,
      cues: opts.cues,
      logSkill: opts.logSkill,
      exerciseKey: opts.key,
      exerciseLabel: opts.label,
      phase: opts.phase,
    });
    if (i < opts.sets) {
      out.push({
        id: nextId(),
        kind: "rest",
        name: `Rest`,
        restSeconds: opts.restSeconds,
        exerciseKey: opts.key,
        exerciseLabel: opts.label,
        phase: opts.phase,
      });
    }
  }
  return out;
}

function setsReps(opts: {
  key: string;
  label: string;
  phase: WorkoutStep["phase"];
  sets: number;
  reps: number;
  restSeconds: number;
  cues?: string[];
  logSkill?: Skill;
}): WorkoutStep[] {
  const out: WorkoutStep[] = [];
  for (let i = 1; i <= opts.sets; i++) {
    out.push({
      id: nextId(),
      kind: "reps",
      name: opts.label,
      setNumber: i,
      totalSets: opts.sets,
      targetReps: opts.reps,
      cues: opts.cues,
      logSkill: opts.logSkill,
      exerciseKey: opts.key,
      exerciseLabel: opts.label,
      phase: opts.phase,
    });
    if (i < opts.sets) {
      out.push({
        id: nextId(),
        kind: "rest",
        name: "Rest",
        restSeconds: opts.restSeconds,
        exerciseKey: opts.key,
        exerciseLabel: opts.label,
        phase: opts.phase,
      });
    }
  }
  return out;
}

function checklist(opts: {
  key: string;
  label: string;
  phase: WorkoutStep["phase"];
  instruction: string;
}): WorkoutStep {
  return {
    id: nextId(),
    kind: "checklist",
    name: opts.label,
    instruction: opts.instruction,
    exerciseKey: opts.key,
    exerciseLabel: opts.label,
    phase: opts.phase,
  };
}

const PLANCHE_CUES = [
  "Shoulders depressed (not shrugged)",
  "Elbows locked (no bending)",
  "Core braced (hollow body)",
  "Push hard into ground",
  "No sagging hips or arched back",
];
const HS_CUES = [
  "Neutral neck, gaze between hands",
  "Scapulae engaged, push tall",
  "Squeeze glutes & ribs down",
  "Active fingers for balance",
];
const PUSH_CUES = [
  "Full body tight, plank position",
  "Elbows ~45° from torso",
  "Lock out at the top",
  "Controlled tempo, full ROM",
];

export const PLANS: WorkoutPlan[] = [
  {
    id: "day1",
    title: "Day 1 · Planche Heavy",
    subtitle: "Hold strength + push power",
    durationMin: "30–35 min",
    accent: "purple",
    emoji: "🔴",
    steps: [
      checklist({ key: "wu1", label: "Arm circles & shoulder rotations", phase: "Warm-up", instruction: "10 each direction" }),
      checklist({ key: "wu2", label: "Cat-cow stretches", phase: "Warm-up", instruction: "8 slow reps" }),
      checklist({ key: "wu3", label: "Wrist circles", phase: "Warm-up", instruction: "10 each direction" }),
      ...setsReps({ key: "wu4", label: "Pseudo planche push-ups", phase: "Warm-up", sets: 1, reps: 5, restSeconds: 0, cues: PLANCHE_CUES }),
      ...setsHold({ key: "wu5", label: "High planche leans", phase: "Warm-up", sets: 2, seconds: 18, restSeconds: 30, cues: PLANCHE_CUES }),
      ...setsHold({ key: "m1", label: "Planche Hold (Tuck/Straddle)", phase: "Main", sets: 4, seconds: 14, restSeconds: 135, cues: PLANCHE_CUES, logSkill: "Planche" }),
      ...setsReps({ key: "m2", label: "Planche Push-ups", phase: "Main", sets: 3, reps: 4, restSeconds: 90, cues: PLANCHE_CUES }),
      ...setsHold({ key: "m3", label: "Planche Leans (low)", phase: "Main", sets: 2, seconds: 18, restSeconds: 60, cues: PLANCHE_CUES }),
      ...setsHold({ key: "s1", label: "Hollow Body Hold", phase: "Supplementary", sets: 3, seconds: 30, restSeconds: 30 }),
      ...setsReps({ key: "s2", label: "Band Pull-Aparts / Snow Angels", phase: "Supplementary", sets: 2, reps: 15, restSeconds: 45 }),
    ],
  },
  {
    id: "day2",
    title: "Day 2 · Handstand Skill",
    subtitle: "Balance + shoulder endurance",
    durationMin: "30–35 min",
    accent: "cyan",
    emoji: "🟢",
    steps: [
      checklist({ key: "wu1", label: "Shoulder dislocations", phase: "Warm-up", instruction: "10 reps with band or pole" }),
      checklist({ key: "wu2", label: "Cat-cow stretches", phase: "Warm-up", instruction: "8 reps" }),
      checklist({ key: "wu3", label: "Wall walks", phase: "Warm-up", instruction: "3 slow reps" }),
      checklist({ key: "wu4", label: "Wrist mobility", phase: "Warm-up", instruction: "10 circles each direction" }),
      ...setsHold({ key: "m1", label: "Wall Handstand Hold", phase: "Main", sets: 4, seconds: 25, restSeconds: 75, cues: HS_CUES, logSkill: "Handstand" }),
      ...setsHold({ key: "m2", label: "Handstand Balance Drills", phase: "Main", sets: 5, seconds: 12, restSeconds: 60, cues: HS_CUES }),
      ...setsReps({ key: "m3", label: "Handstand Shoulder Taps", phase: "Main", sets: 3, reps: 12, restSeconds: 50, cues: HS_CUES }),
      ...setsReps({ key: "s1", label: "YTW Raises", phase: "Supplementary", sets: 3, reps: 24, restSeconds: 45 }),
      ...setsReps({ key: "s2", label: "Wrist push-ups (on knees)", phase: "Supplementary", sets: 2, reps: 8, restSeconds: 30 }),
    ],
  },
  {
    id: "day3",
    title: "Day 3 · Push Strength",
    subtitle: "Volume push hypertrophy",
    durationMin: "35–40 min",
    accent: "gold",
    emoji: "🔵",
    steps: [
      checklist({ key: "wu1", label: "Arm circles", phase: "Warm-up", instruction: "10 each direction" }),
      checklist({ key: "wu2", label: "Cat-cow", phase: "Warm-up", instruction: "8 reps" }),
      checklist({ key: "wu3", label: "Standard push-ups (easy)", phase: "Warm-up", instruction: "8 reps" }),
      checklist({ key: "wu4", label: "Scapular push-ups", phase: "Warm-up", instruction: "6 reps" }),
      ...setsReps({ key: "m1", label: "Pseudo Planche Push-ups", phase: "Main", sets: 4, reps: 7, restSeconds: 90, cues: PUSH_CUES, logSkill: "Push-ups" }),
      ...setsReps({ key: "m2", label: "Wide Grip Push-ups", phase: "Main", sets: 3, reps: 10, restSeconds: 60, cues: PUSH_CUES, logSkill: "Push-ups" }),
      ...setsReps({ key: "m3", label: "Diamond Push-ups", phase: "Main", sets: 3, reps: 10, restSeconds: 60, cues: PUSH_CUES, logSkill: "Push-ups" }),
      ...setsReps({ key: "m4", label: "Decline Push-ups", phase: "Main", sets: 3, reps: 9, restSeconds: 60, cues: PUSH_CUES, logSkill: "Push-ups" }),
      ...setsHold({ key: "s1", label: "Plank Hold", phase: "Supplementary", sets: 2, seconds: 40, restSeconds: 45 }),
      ...setsReps({ key: "s2", label: "Inverted Rows / Superman Holds", phase: "Supplementary", sets: 3, reps: 10, restSeconds: 45 }),
      ...setsReps({ key: "s3", label: "Ab Wheel Rollouts / Leg Raises", phase: "Supplementary", sets: 2, reps: 10, restSeconds: 45 }),
    ],
  },
];

export function planById(id: string): WorkoutPlan | undefined {
  return PLANS.find((p) => p.id === id);
}