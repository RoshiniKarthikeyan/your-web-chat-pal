import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, FileText, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

const FUNC_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-notes`;

const SmartNotes = () => {
  const [sourceText, setSourceText] = useState("");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"text" | "topic">("topic");

  const generate = async () => {
    setLoading(true);
    setNotes("");
    try {
      const resp = await fetch(FUNC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(mode === "text" ? { text: sourceText } : { topic }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setNotes(data.notes);
    } catch (e: any) {
      setNotes(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyNotes = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Smart Notes Generator</h1>
        <p className="text-muted-foreground">Generate summarized notes from text or a topic</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2">
            <Button variant={mode === "topic" ? "default" : "outline"} size="sm" onClick={() => setMode("topic")}>By Topic</Button>
            <Button variant={mode === "text" ? "default" : "outline"} size="sm" onClick={() => setMode("text")}>From Text</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "topic" ? (
            <Input placeholder="Enter a topic (e.g. Quantum Physics)" value={topic} onChange={(e) => setTopic(e.target.value)} />
          ) : (
            <Textarea placeholder="Paste your text here..." value={sourceText} onChange={(e) => setSourceText(e.target.value)} rows={8} />
          )}
          <Button onClick={generate} disabled={loading || (mode === "topic" ? !topic.trim() : !sourceText.trim())}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><FileText className="mr-2 h-4 w-4" /> Generate Notes</>}
          </Button>
        </CardContent>
      </Card>

      {notes && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Generated Notes</CardTitle>
            <Button variant="outline" size="sm" onClick={copyNotes}>
              {copied ? <><Check className="mr-1 h-3 w-3" /> Copied</> : <><Copy className="mr-1 h-3 w-3" /> Copy</>}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{notes}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartNotes;
