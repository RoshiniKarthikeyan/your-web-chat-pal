import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { extractPdfText } from "@/lib/pdf-extract";

type Message = { role: "user" | "assistant"; content: string };

const DocumentChat = () => {
  const [documentText, setDocumentText] = useState("");
  const [fileName, setFileName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFileName(file.name);

    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const text = await file.text();
        setDocumentText(text);
        setMessages([{ role: "assistant", content: `I've loaded **${file.name}** (${text.length} characters). Ask me anything about it!` }]);
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractPdfText(arrayBuffer);
        if (text.length > 50) {
          setDocumentText(text);
          setMessages([{ role: "assistant", content: `I've loaded **${file.name}** (${text.length} characters extracted). Ask me anything about it!` }]);
        } else {
          setMessages([{ role: "assistant", content: `I couldn't extract much text from **${file.name}**. It might be a scanned/image PDF. Try a text-based PDF or .txt file instead.` }]);
        }
      } else {
        setMessages([{ role: "assistant", content: `Unsupported file type. Please upload a .txt, .md, or .pdf file.` }]);
      }
    } catch {
      setMessages([{ role: "assistant", content: `Error processing **${file.name}**. Please try a different file.` }]);
    } finally {
      setUploading(false);
    }
  };

  // Throttled state update using requestAnimationFrame
  const flushStream = useCallback(() => {
    const content = streamRef.current;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && !last.content.startsWith("I've loaded")) {
        return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
      }
      return [...prev, { role: "assistant", content }];
    });
    rafRef.current = null;
    scrollToBottom();
  }, [scrollToBottom]);

  const appendStream = useCallback(
    (text: string) => {
      streamRef.current += text;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flushStream);
      }
    },
    [flushStream]
  );

  const askQuestion = async () => {
    if (!input.trim() || loading || !documentText) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    streamRef.current = "";

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a helpful study assistant. Answer questions based on the following document:\n\n${documentText.slice(0, 12000)}`,
            },
            ...messages
              .filter((m) => !m.content.startsWith("I've loaded"))
              .slice(-10),
            userMsg,
          ],
        }),
      });

      if (!resp.body) throw new Error("No response");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) appendStream(c);
          } catch {}
        }
      }

      // Final flush
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      flushStream();
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const resetDocument = () => {
    setDocumentText("");
    setFileName("");
    setMessages([]);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Document Chat</h1>
        <p className="text-muted-foreground">Upload a document and ask questions about it</p>
      </div>

      {!documentText ? (
        <Card className="flex-1 flex items-center justify-center">
          <CardContent className="text-center space-y-4">
            <Upload className="h-16 w-16 mx-auto text-muted-foreground/40" />
            <div>
              <p className="font-medium text-foreground">Upload a document to get started</p>
              <p className="text-sm text-muted-foreground">Supports .txt, .md, and .pdf files</p>
            </div>
            <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf" onChange={handleFile} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" /> Choose File
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{fileName}</span>
            <Button variant="ghost" size="sm" onClick={resetDocument}>
              Change
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 rounded-xl border border-border bg-card p-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                    msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:m-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); askQuestion(); }} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the document..."
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
            />
            <Button type="submit" disabled={!input.trim() || loading} className="h-10 w-10 rounded-xl p-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </>
      )}
    </div>
  );
};

export default DocumentChat;
