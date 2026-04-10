import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";

const DoubtSolver = lazy(() => import("./pages/DoubtSolver"));
const SmartNotes = lazy(() => import("./pages/SmartNotes"));
const QuizGenerator = lazy(() => import("./pages/QuizGenerator"));
const StudyPlanner = lazy(() => import("./pages/StudyPlanner"));
const ProgressDashboard = lazy(() => import("./pages/ProgressDashboard"));
const DocumentChat = lazy(() => import("./pages/DocumentChat"));
const VoiceAssistant = lazy(() => import("./pages/VoiceAssistant"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
