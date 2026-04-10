import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, BookOpen, Brain, Clock } from "lucide-react";

const ProgressDashboard = () => {
  // Static demo data — will be dynamic once auth is added
  const stats = [
    { label: "Questions Asked", value: 0, icon: Brain, color: "text-blue-500" },
    { label: "Notes Generated", value: 0, icon: BookOpen, color: "text-green-500" },
    { label: "Quizzes Taken", value: 0, icon: BarChart3, color: "text-purple-500" },
    { label: "Study Hours", value: 0, icon: Clock, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Progress Dashboard</h1>
        <p className="text-muted-foreground">Track your learning journey</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`rounded-xl bg-muted p-3 ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Sign up to start tracking your progress. Your study activity across all features — doubt solving, notes, quizzes, and study plans — will appear here once you're logged in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressDashboard;
