import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamChat, type ChatMessage } from "@/lib/chat-stream";
import ReactMarkdown from "react-markdown";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: updatedMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, something went wrong: ${err}` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="animate-chat-open flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-chat-border bg-chat shadow-chat">
          {/* Header */}
          <div className="flex items-center gap-3 bg-chat-header px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chat-avatar">
              <Bot className="h-4 w-4 text-chat-avatar-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-chat-header-foreground">Support Assistant</p>
              <p className="text-xs text-chat-header-foreground/70">Typically replies instantly</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-chat-header-foreground/70 transition hover:text-chat-header-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 pt-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chat-avatar/20">
                  <MessageCircle className="h-6 w-6 text-chat-avatar-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">How can we help?</p>
                <p className="text-xs text-muted-foreground">Ask us anything about our product.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chat-avatar">
                    <Bot className="h-3 w-3 text-chat-avatar-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-chat-user text-chat-user-foreground rounded-br-md"
                      : "bg-chat-assistant text-chat-assistant-foreground rounded-bl-md"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-chat-avatar">
                  <Bot className="h-3 w-3 text-chat-avatar-foreground" />
                </div>
                <div className="rounded-2xl rounded-bl-md bg-chat-assistant px-3 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-chat-border bg-chat p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-chat-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-chat-ring"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                variant="chat"
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 shrink-0 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-chat-bubble text-chat-bubble-foreground shadow-chat-bubble transition-all duration-300 hover:scale-105 hover:shadow-chat-bubble-hover",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
};

export default ChatWidget;
