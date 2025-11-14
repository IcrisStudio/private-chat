"use client";

interface TypingIndicatorProps {
  users: Array<{ _id: string; username: string }>;
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  const usernames = users.map((u) => u.username);

  return (
    <div className="flex gap-3 justify-start">
      <div className="bg-card rounded-2xl px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
          <span
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: "0.15s" }}
          />
          <span
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: "0.3s" }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {usernames.join(", ")} {usernames.length === 1 ? "is" : "are"} typing...
        </p>
      </div>
    </div>
  );
}

