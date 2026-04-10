import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, Clock, BookOpen } from "lucide-react";

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-plan`;

type Task = { subject: string; topic: string; duration: string; type: string };
type DayPlan = { day: number; date: string; tasks: Task[] };
type Plan = { title: string; schedule: DayPlan[]; tips: string[] };

const StudyPlanner = () => {
  const [subjects, setSubjects] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("4");
  const [durationDays, setDurationDays] = useState("7");
  const [goals, setGoals] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const resp = await fetch(FUNC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ subjects, hoursPerDay: parseInt(hoursPerDay), durationDays: parseInt(durationDays), goals }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setPlan(data.plan);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const typeColor = (type: string) => {
    if (type === "review") return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    if (type === "practice") return "bg-green-500/10 text-green-600 border-green-500/20";
    return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Personalized Study Planner</h1>
        <p className="text-muted-foreground">Generate a customized study schedule</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input placeholder="Subjects (e.g. Math, Physics, Chemistry)" value={subjects} onChange={(e) => setSubjects(e.target.value)} />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Hours/day</label>
              <Input type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} min="1" max="12" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Days</label>
              <Input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} min="1" max="30" />
            </div>
          </div>
          <Textarea placeholder="Goals (optional)" value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} />
          <Button onClick={generate} disabled={loading || !subjects.trim()}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Plan...</> : <><Calendar className="mr-2 h-4 w-4" /> Generate Plan</>}
          </Button>
        </CardContent>
      </Card>

      {plan && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">{plan.title}</h2>
          
          {plan.schedule?.map((day) => (
            <Card key={day.day}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {day.date}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {day.tasks?.map((task, ti) => (
                    <div key={ti} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${typeColor(task.type)}`}>
                      <BookOpen className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{task.subject}: {task.topic}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs shrink-0">
                        <Clock className="h-3 w-3" /> {task.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {plan.tips?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">💡 Tips</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {plan.tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
