import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { Download, FileJson, RotateCcw, Zap } from "lucide-react";
import { Achievements } from "@/components/tracker/Achievements";
import { ActivityFeed } from "@/components/tracker/ActivityFeed";
import { AddWorkoutDialog } from "@/components/tracker/AddWorkoutDialog";
import { Heatmap } from "@/components/tracker/Heatmap";
import { HeroStats } from "@/components/tracker/HeroStats";
import { ProgressCharts } from "@/components/tracker/ProgressCharts";
import { SkillCard } from "@/components/tracker/SkillCard";
import { SKILLS } from "@/lib/tracker-types";
import {
  downloadFile,
  exportCSV,
  levelFromXP,
  totalXP,
  useWorkouts,
} from "@/lib/tracker-store";
import { computeBadges } from "@/lib/tracker-badges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ascent — Gamified Calisthenics Tracker" },
      { name: "description", content: "Track planche, handstand & push-up progress with XP, levels, achievements, and streaks. All local, all yours." },
      { property: "og:title", content: "Ascent — Gamified Calisthenics Tracker" },
      { property: "og:description", content: "Train. Level up. Unlock badges. Your calisthenics journey, gamified." },
    ],
  }),
  component: Index,
});

function Index() {
  const { workouts, add, update, remove, reset } = useWorkouts();
  const [tab, setTab] = useState("dashboard");

  const xp = totalXP(workouts);
  const { level } = levelFromXP(xp);
  const prevLevelRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevLevelRef.current !== null && level > prevLevelRef.current) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ["#7DD3FC", "#C4B5FD", "#FCD34D"] });
    }
    prevLevelRef.current = level;
  }, [level]);

  const badgeSig = computeBadges(workouts).filter((b) => b.unlocked).map((b) => b.id).join(",");
  const prevBadgeSigRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevBadgeSigRef.current !== null && badgeSig !== prevBadgeSigRef.current) {
      const prev = new Set(prevBadgeSigRef.current.split(",").filter(Boolean));
      const now = badgeSig.split(",").filter(Boolean);
      if (now.some((id) => !prev.has(id))) {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.4 }, colors: ["#FCD34D", "#FBBF24"] });
      }
    }
    prevBadgeSigRef.current = badgeSig;
  }, [badgeSig]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 md:py-10 max-w-6xl mx-auto">
      <Toaster theme="dark" position="top-right" />

      <header className="flex items-center justify-between mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
            <Zap className="size-5 text-background" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-none">ASCENT</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Calisthenics RPG</p>
          </div>
        </div>
        <AddWorkoutDialog onAdd={add} />
      </header>

      <main className="space-y-6 md:space-y-8">
        <HeroStats workouts={workouts} />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-card/60 border border-border h-auto p-1 rounded-2xl flex-wrap">
            <TabsTrigger value="dashboard" className="rounded-xl px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Dashboard</TabsTrigger>
            <TabsTrigger value="progress" className="rounded-xl px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Progress</TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-xl px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">Achievements</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground">History</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {SKILLS.map((s) => (
                <SkillCard key={s} skill={s} workouts={workouts} />
              ))}
            </div>
            <Heatmap workouts={workouts} />
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display font-bold text-xl">Recent activity</h2>
                <button onClick={() => setTab("history")} className="text-xs text-muted-foreground hover:text-foreground">View all →</button>
              </div>
              <ActivityFeed workouts={workouts} onUpdate={update} onRemove={remove} limit={5} />
            </section>
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <ProgressCharts workouts={workouts} />
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <Achievements workouts={workouts} />
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-bold text-xl">Workout history</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadFile("workouts.csv", exportCSV(workouts), "text/csv")} disabled={workouts.length === 0}>
                  <Download className="size-3.5" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadFile("workouts.json", JSON.stringify(workouts, null, 2), "application/json")} disabled={workouts.length === 0}>
                  <FileJson className="size-3.5" /> JSON
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={workouts.length === 0}>
                      <RotateCcw className="size-3.5" /> Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Erase all workout data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes every workout, badge, level and streak from this browser. Export first if you want a copy.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => reset()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Erase everything</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <ActivityFeed workouts={workouts} onUpdate={update} onRemove={remove} />
          </TabsContent>
        </Tabs>

        <footer className="pt-6 pb-2 text-center text-xs text-muted-foreground">
          All data stored locally in your browser. Train hard.
        </footer>
      </main>
    </div>
  );
}