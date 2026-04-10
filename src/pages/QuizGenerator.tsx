import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Question = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`;

const QuizGenerator = () => {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const generate = async () => {
    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    try {
      const resp = await fetch(FUNC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ topic, numQuestions: parseInt(numQuestions), difficulty }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setQuestions(data.questions || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const score = submitted
    ? questions.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Quiz Generator</h1>
        <p className="text-muted-foreground">Generate quizzes on any topic</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input placeholder="Enter topic (e.g. World War II)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <div className="flex gap-3">
            <Select value={numQuestions} onValueChange={setNumQuestions}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["3", "5", "10"].map((n) => <SelectItem key={n} value={n}>{n} questions</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["easy", "medium", "hard"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={loading || !topic.trim()}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Generate Quiz"}
          </Button>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, qi) => (
            <Card key={qi}>
              <CardHeader>
                <CardTitle className="text-base">Q{qi + 1}: {q.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => !submitted && setAnswers({ ...answers, [qi]: oi })}
                    className={cn(
                      "w-full text-left rounded-lg border px-4 py-2 text-sm transition",
                      answers[qi] === oi && !submitted && "border-primary bg-primary/10",
                      submitted && oi === q.correctAnswer && "border-green-500 bg-green-500/10",
                      submitted && answers[qi] === oi && oi !== q.correctAnswer && "border-destructive bg-destructive/10"
                    )}
                    disabled={submitted}
                  >
                    <span className="flex items-center gap-2">
                      {submitted && oi === q.correctAnswer && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {submitted && answers[qi] === oi && oi !== q.correctAnswer && <XCircle className="h-4 w-4 text-destructive" />}
                      {opt}
                    </span>
                  </button>
                ))}
                {submitted && q.explanation && (
                  <p className="mt-2 text-sm text-muted-foreground italic">{q.explanation}</p>
                )}
              </CardContent>
            </Card>
          ))}

          {!submitted ? (
            <Button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length}>
              Submit Answers
            </Button>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold text-foreground">{score}/{questions.length}</p>
                <p className="text-muted-foreground">
                  {score === questions.length ? "Perfect! 🎉" : score >= questions.length / 2 ? "Good job! 👍" : "Keep studying! 📚"}
                </p>
                <Button className="mt-4" variant="outline" onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false); }}>
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;
