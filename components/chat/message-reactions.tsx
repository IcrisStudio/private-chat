"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface MessageReactionsProps {
  messageId: Id<"messages">;
  userId: Id<"users">;
  onClose: () => void;
}

export default function MessageReactions({
  messageId,
  userId,
  onClose,
}: MessageReactionsProps) {
  const addReaction = useMutation(api.chats.addReaction);

  const handleReaction = async (emoji: string) => {
    await addReaction({ messageId, userId, emoji });
    onClose();
  };

  return (
    <div className="flex gap-1 bg-background border rounded-full p-1 shadow-lg">
      {EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleReaction(emoji)}
        >
          {emoji}
        </Button>
      ))}
    </div>
  );
}

