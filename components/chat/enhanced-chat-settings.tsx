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
import { User, Ban, Image as ImageIcon, X } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EnhancedChatSettingsProps {
  chatId: Id<"chats">;
  chatName?: string;
  userId: Id<"users">;
  otherUserId?: Id<"users">;
  onClose: () => void;
}

const themes = [
  {
    id: "default",
    name: "Default",
    gradient: "from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950",
    messagePreview: "bg-primary text-primary-foreground",
  },
  {
    id: "sunset",
    name: "Sunset",
    gradient: "from-orange-100 via-pink-100 to-red-100 dark:from-orange-950 dark:via-pink-950 dark:to-red-950",
    messagePreview: "bg-orange-500 text-white",
  },
  {
    id: "ocean",
    name: "Ocean",
    gradient: "from-cyan-50 via-blue-50 to-teal-50 dark:from-cyan-950 dark:via-blue-950 dark:to-teal-950",
    messagePreview: "bg-cyan-500 text-white",
  },
  {
    id: "forest",
    name: "Forest",
    gradient: "from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950",
    messagePreview: "bg-green-500 text-white",
  },
  {
    id: "purple",
    name: "Purple",
    gradient: "from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950",
    messagePreview: "bg-purple-500 text-white",
  },
  {
    id: "pink",
    name: "Pink",
    gradient: "from-pink-50 via-rose-50 to-red-50 dark:from-pink-950 dark:via-rose-950 dark:to-red-950",
    messagePreview: "bg-pink-500 text-white",
  },
];

export default function EnhancedChatSettings({
  chatId,
  chatName,
  userId,
  otherUserId,
  onClose,
}: EnhancedChatSettingsProps) {
  const [name, setName] = useState(chatName || "");
  const [nickname, setNickname] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string>("default");
  const router = useRouter();

  const chat = useQuery(api.chats.getUserChats, { userId });
  const currentChat = chat?.find((c) => c._id === chatId);
  const mediaGallery = useQuery(api.chats.getMediaGallery, { chatId, userId });
  const otherUserProfile = useQuery(
    api.auth.getUserProfile,
    otherUserId ? { userId: otherUserId } : "skip"
  );

  const updateChatName = useMutation(api.chats.updateChatName);
  const updateChatTheme = useMutation(api.chats.updateChatTheme);
  const updateChatNickname = useMutation(api.chats.updateChatNickname);
  const blockUser = useMutation(api.friendRequests.blockUser);

  const handleSave = async () => {
    try {
      if (name.trim()) {
        await updateChatName({ chatId, chatName: name });
      }
      if (selectedTheme) {
        await updateChatTheme({ chatId, theme: selectedTheme });
      }
      if (nickname.trim() && otherUserId) {
        await updateChatNickname({ chatId, userId: otherUserId, nickname });
      }
      toast.success("Settings saved");
      onClose();
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleBlock = async () => {
    if (!otherUserId) return;

    if (confirm("Are you sure you want to block this user? You won't be able to message them.")) {
      await blockUser({
        fromUserId: userId,
        toUserId: otherUserId,
      });
      toast.success("User blocked");
      onClose();
    }
  };

  const selectedThemeData = themes.find((t) => t.id === selectedTheme) || themes[0];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chat Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="nickname">Nickname</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
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
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium">{theme.name}</p>
                      <div className={`text-xs px-2 py-1 rounded ${theme.messagePreview}`}>
                        Preview
                      </div>
                    </div>
                    {selectedTheme === theme.id && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nickname" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname for this chat</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter nickname"
              />
              <p className="text-xs text-muted-foreground">
                This nickname will only be visible to you in this chat
              </p>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
              {mediaGallery && mediaGallery.length > 0 ? (
                mediaGallery.map((media) => (
                  <div key={media._id} className="relative aspect-square">
                    {media.type === "image" ? (
                      <img
                        src={media.mediaUrl}
                        alt="Media"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={media.mediaUrl}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>
                ))
              ) : (
                <p className="col-span-3 text-center text-muted-foreground py-8">
                  No media shared yet
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 mt-4">
            {otherUserProfile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={otherUserProfile.avatar} />
                    <AvatarFallback>
                      {otherUserProfile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {otherUserProfile.nickname || otherUserProfile.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{otherUserProfile.username}
                    </p>
                  </div>
                </div>

                {otherUserProfile.bio && (
                  <div>
                    <Label>Bio</Label>
                    <p className="text-sm mt-1">{otherUserProfile.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Joined</Label>
                    <p className="text-sm mt-1">
                      {format(new Date(otherUserProfile.joinedAt), "MMMM yyyy")}
                    </p>
                  </div>
                  <div>
                    <Label>Friends</Label>
                    <p className="text-sm mt-1">{otherUserProfile.friendsCount}</p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleBlock}
                  className="w-full"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block User
                </Button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Loading profile...
              </p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

