import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import DoubtSolver from "./pages/DoubtSolver";
import SmartNotes from "./pages/SmartNotes";
import QuizGenerator from "./pages/QuizGenerator";
import StudyPlanner from "./pages/StudyPlanner";
import ProgressDashboard from "./pages/ProgressDashboard";
import DocumentChat from "./pages/DocumentChat";
import VoiceAssistant from "./pages/VoiceAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/doubt-solver" element={<DoubtSolver />} />
            <Route path="/notes" element={<SmartNotes />} />
            <Route path="/quiz" element={<QuizGenerator />} />
            <Route path="/planner" element={<StudyPlanner />} />
            <Route path="/progress" element={<ProgressDashboard />} />
            <Route path="/documents" element={<DocumentChat />} />
            <Route path="/voice" element={<VoiceAssistant />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
