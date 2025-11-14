"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ChatListProps {
  userId: Id<"users">;
  selectedChat: Id<"chats"> | null;
  onSelectChat: (chatId: Id<"chats">) => void;
}

export default function ChatList({
  userId,
  selectedChat,
  onSelectChat,
}: ChatListProps) {
  const chats = useQuery(api.chats.getUserChats, { userId });

  if (!chats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading chats...</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          No chats yet. Start a new conversation!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => {
        const otherUser = chat.otherParticipant;
        const isSelected = selectedChat === chat._id;
        const lastMessage = chat.lastMessage;
        const isMyMessage = lastMessage?.senderId === userId;
        const isSeen =
          isMyMessage &&
          lastMessage?.viewedBy &&
          lastMessage.viewedBy.length > 0 &&
          lastMessage.viewedBy.includes(
            otherUser?._id as Id<"users">
          );

        return (
          <div
            key={chat._id}
            onClick={() => onSelectChat(chat._id)}
            className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
              isSelected ? "bg-accent" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={otherUser?.avatar}
                  alt={otherUser?.username}
                />
                <AvatarFallback>
                  {otherUser?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
                {otherUser?.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                )}
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm truncate">
                    {chat.chatName || otherUser?.username || "Unknown"}
                  </h3>
                  {lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(lastMessage.sentAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>

                {lastMessage && (
                  <div className="flex items-center gap-2">
                    {isMyMessage && (
                      <span className="flex-shrink-0">
                        {isSeen ? (
                          <CheckCheck className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Check className="h-4 w-4 text-muted-foreground" />
                        )}
                      </span>
                    )}
                    <p className="text-sm text-muted-foreground truncate">
                      {lastMessage.type === "image"
                        ? "📷 Image"
                        : lastMessage.type === "video"
                        ? "🎥 Video"
                        : lastMessage.type === "voice"
                        ? "🎤 Voice message"
                        : lastMessage.content}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

