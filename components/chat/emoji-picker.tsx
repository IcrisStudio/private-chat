"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

const emojis = ["😀", "😂", "❤️", "😍", "😭", "👍", "👎", "🔥", "💯", "🎉"];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  return (
    <Card className="p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">React</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="text-2xl hover:bg-accent rounded-lg p-2 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </Card>
  );
}

