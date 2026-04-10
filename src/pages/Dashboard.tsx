import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, FileText, MessageCircle, Calendar, BarChart3, Upload, Mic } from "lucide-react";

const features = [
  { path: "/doubt-solver", icon: HelpCircle, title: "AI Doubt Solver", desc: "Ask questions and get instant explanations", color: "text-blue-500" },
  { path: "/notes", icon: FileText, title: "Smart Notes", desc: "Generate summarized notes from any text", color: "text-green-500" },
  { path: "/quiz", icon: MessageCircle, title: "Quiz Generator", desc: "Create quizzes on any topic", color: "text-purple-500" },
  { path: "/planner", icon: Calendar, title: "Study Planner", desc: "Build personalized study schedules", color: "text-orange-500" },
  { path: "/progress", icon: BarChart3, title: "Progress Dashboard", desc: "Track your learning journey", color: "text-pink-500" },
  { path: "/documents", icon: Upload, title: "Document Chat", desc: "Upload PDFs and ask questions", color: "text-cyan-500" },
  { path: "/voice", icon: Mic, title: "Voice Assistant", desc: "Speak your questions aloud", color: "text-yellow-500" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome to your Study Assistant</h1>
        <p className="text-muted-foreground">Choose a tool to get started</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ path, icon: Icon, title, desc, color }) => (
          <Card key={path} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(path)}>
            <CardHeader className="pb-2">
              <Icon className={`h-8 w-8 ${color}`} />
              <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{desc}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
