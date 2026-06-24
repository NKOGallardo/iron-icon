export type Skill = "Planche" | "Handstand" | "Push-ups";
export type WorkoutType = "hold" | "reps";

export interface Workout {
  id: string;
  skill: Skill;
  type: WorkoutType;
  value: number;
  date: string; // ISO
  notes?: string;
  isNewPR?: boolean;
}

export const SKILLS: Skill[] = ["Planche", "Handstand", "Push-ups"];

export const SKILL_META: Record<
  Skill,
  { type: WorkoutType; unit: string; emoji: string; accent: "cyan" | "purple" | "gold"; titles: string[] }
> = {
  Planche: {
    type: "hold",
    unit: "s",
    emoji: "🤸",
    accent: "purple",
    titles: ["Planche Novice", "Planche Apprentice", "Planche Adept", "Planche Warrior", "Planche Master"],
  },
  Handstand: {
    type: "hold",
    unit: "s",
    emoji: "🙆",
    accent: "cyan",
    titles: ["Handstand Novice", "Handstand Apprentice", "Handstand Adept", "Handstand Warrior", "Handstand Master"],
  },
  "Push-ups": {
    type: "reps",
    unit: "reps",
    emoji: "💪",
    accent: "gold",
    titles: ["Push-up Novice", "Push-up Apprentice", "Push-up Adept", "Push-up Warrior", "Push-up Master"],
  },
};