import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const DocumentChat = () => {
  const [documentText, setDocumentText] = useState("");
  const [fileName, setFileName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setFileName(file.name);

    // For text files, read directly
    if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      setDocumentText(text);
      setMessages([{ role: "assistant", content: `I've loaded **${file.name}** (${text.length} characters). Ask me anything about it!` }]);
      setUploading(false);
      return;
    }

    // For PDF: extract text client-side using basic approach
    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        // Simple text extraction from PDF binary
        const uint8 = new Uint8Array(arrayBuffer);
        const text = extractTextFromPDF(uint8);
        if (text.length > 100) {
          setDocumentText(text);
          setMessages([{ role: "assistant", content: `I've loaded **${file.name}**. The extracted text is ${text.length} characters. Ask me anything about it!` }]);
        } else {
          setDocumentText("");
          setMessages([{ role: "assistant", content: `I couldn't extract much text from **${file.name}**. It might be a scanned PDF. Try a text-based PDF instead.` }]);
        }
      } catch {
        setMessages([{ role: "assistant", content: `Error processing **${file.name}**. Please try a text file instead.` }]);
      }
      setUploading(false);
      return;
    }

    setMessages([{ role: "assistant", content: `Unsupported file type. Please upload a .txt, .md, or .pdf file.` }]);
    setUploading(false);
  };

  // Basic PDF text extraction
  const extractTextFromPDF = (data: Uint8Array): string => {
    const str = new TextDecoder("latin1").decode(data);
    const textBlocks: string[] = [];
    const regex = /\((.*?)\)/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      const decoded = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\");
      if (decoded.trim().length > 1) textBlocks.push(decoded);
    }
    return textBlocks.join(" ").replace(/\s+/g, " ").trim();
  };

  const askQuestion = async () => {
    if (!input.trim() || loading || !documentText) return;
    
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

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
            { role: "user", content: `Here is a document to reference:\n\n${documentText.slice(0, 8000)}\n\nNow answer questions about it.` },
            ...messages.filter((m) => m.role !== "assistant" || !m.content.startsWith("I've loaded")),
            userMsg,
          ],
        }),
      });

      // Handle streaming response
      if (!resp.body) throw new Error("No response");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

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
            if (c) {
              full += c;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && !last.content.startsWith("I've loaded")) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: full } : m);
                }
                return [...prev, { role: "assistant", content: full }];
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
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
              {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><FileText className="mr-2 h-4 w-4" /> Choose File</>}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{fileName}</span>
            <Button variant="ghost" size="sm" onClick={() => { setDocumentText(""); setFileName(""); setMessages([]); }}>
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
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                )}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:m-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
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
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
};

export default DocumentChat;
