"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Ban, Image as ImageIcon } from "lucide-react";

interface ChatSettingsProps {
  chatId: Id<"chats">;
  chatName?: string;
  onClose: () => void;
}

const themes = [
  { id: "default", name: "Default", gradient: "from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950" },
  { id: "sunset", name: "Sunset", gradient: "from-orange-100 via-pink-100 to-red-100 dark:from-orange-950 dark:via-pink-950 dark:to-red-950" },
  { id: "ocean", name: "Ocean", gradient: "from-cyan-50 via-blue-50 to-teal-50 dark:from-cyan-950 dark:via-blue-950 dark:to-teal-950" },
  { id: "forest", name: "Forest", gradient: "from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950" },
  { id: "purple", name: "Purple", gradient: "from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950" },
  { id: "pink", name: "Pink", gradient: "from-pink-50 via-rose-50 to-red-50 dark:from-pink-950 dark:via-rose-950 dark:to-red-950" },
];

export default function ChatSettings({
  chatId,
  chatName,
  onClose,
}: ChatSettingsProps) {
  const [name, setName] = useState(chatName || "");
  const [selectedTheme, setSelectedTheme] = useState<string>("default");

  const updateChatName = useMutation(api.chats.updateChatName);
  const updateChatTheme = useMutation(api.chats.updateChatTheme);

  const handleSave = async () => {
    if (name.trim()) {
      await updateChatName({ chatId, chatName: name });
    }
    if (selectedTheme) {
      await updateChatTheme({ chatId, theme: selectedTheme });
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chat Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="chat-name">Chat Name</Label>
            <Input
              id="chat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter chat name"
            />
          </div>

          <div className="space-y-3">
            <Label>Chat Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    selectedTheme === theme.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`h-16 rounded bg-gradient-to-br ${theme.gradient}`} />
                  <p className="mt-2 text-xs font-medium">{theme.name}</p>
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

