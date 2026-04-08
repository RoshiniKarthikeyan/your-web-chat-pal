import { MessageCircle, Zap, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Welcome to Our Platform
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Need help? Click the chat bubble in the bottom-right corner to talk with our AI support assistant.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            { icon: MessageCircle, title: "Instant Support", desc: "Get answers in seconds" },
            { icon: Zap, title: "AI-Powered", desc: "Smart, context-aware help" },
            { icon: Shield, title: "Always Available", desc: "24/7 assistance" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6">
              <Icon className="h-8 w-8 text-chat-bubble" />
              <h3 className="font-semibold text-card-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
