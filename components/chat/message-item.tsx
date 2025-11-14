"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Reply, Trash2, Smile } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import OneTimeMediaViewer from "./one-time-media-viewer";
import MessageReactions from "./message-reactions";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface MessageItemProps {
  message: any;
  userId: Id<"users">;
  onReply?: (messageId: Id<"messages">) => void;
  chatTheme?: string;
  isPending?: boolean;
}

export default function MessageItem({
  message,
  userId,
  onReply,
  chatTheme,
  isPending = false,
}: MessageItemProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isMyMessage = message.senderId === userId;
  const hasBeenViewed = message.viewedBy && message.viewedBy.some((id: Id<"users">) => id !== userId);
  const isSeen = hasBeenViewed;
  const isDeleted = message.deletedFor?.includes(userId);
  const sender = message.sender || { username: "Unknown", avatar: null };
  const isOneTimeExpired = message.isOneTimeView && message.viewedBy?.includes(userId);

  const deleteMessage = useMutation(api.chats.deleteMessage);

  const handleDelete = async (deleteForEveryone: boolean) => {
    const confirmMessage = deleteForEveryone
      ? "Delete this message for everyone? This action cannot be undone."
      : "Delete this message for you?";
    
    if (confirm(confirmMessage)) {
      await deleteMessage({
        messageId: message._id,
        userId,
        deleteForEveryone,
      });
      toast.success(
        deleteForEveryone
          ? "Message deleted for everyone"
          : "Message deleted"
      );
      setShowMobileMenu(false);
    }
  };

  const handleLongPress = () => {
    setShowMobileMenu(true);
  };

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      handleLongPress();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const themeColors: Record<string, { bg: string; text: string }> = {
    default: {
      bg: isMyMessage ? "bg-primary" : "bg-card",
      text: isMyMessage ? "text-primary-foreground" : "text-foreground",
    },
    sunset: {
      bg: isMyMessage ? "bg-orange-500" : "bg-orange-100 dark:bg-orange-900",
      text: isMyMessage ? "text-white" : "text-foreground",
    },
    ocean: {
      bg: isMyMessage ? "bg-cyan-500" : "bg-cyan-100 dark:bg-cyan-900",
      text: isMyMessage ? "text-white" : "text-foreground",
    },
    forest: {
      bg: isMyMessage ? "bg-green-500" : "bg-green-100 dark:bg-green-900",
      text: isMyMessage ? "text-white" : "text-foreground",
    },
    purple: {
      bg: isMyMessage ? "bg-purple-500" : "bg-purple-100 dark:bg-purple-900",
      text: isMyMessage ? "text-white" : "text-foreground",
    },
  };

  const colors = themeColors[chatTheme || "default"] || themeColors.default;

  if (isDeleted) {
    return (
      <div
        className={`flex gap-3 ${isMyMessage ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[70%] md:max-w-[60%] rounded-lg p-3 italic opacity-50 ${colors.bg} ${colors.text}`}
        >
          <p className="text-xs">This message was deleted</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex gap-3 ${isMyMessage ? "justify-end" : "justify-start"} group`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress();
        }}
      >
        {!isMyMessage && (
          <Avatar className="h-8 w-8">
            <AvatarImage src={sender.avatar} />
            <AvatarFallback>
              {sender.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        )}

      <div className="flex flex-col items-end gap-1 max-w-[70%] md:max-w-[60%]">
        {/* Reply preview */}
        {message.replyToMessage && (
          <div className="w-full border-l-2 border-primary/50 pl-2 mb-1 text-xs opacity-70">
            <p className="font-semibold">
              {message.replyToMessage.sender?.username || "Unknown"}
            </p>
            <p className="truncate">
              {message.replyToMessage.content ||
                (message.replyToMessage.type === "image"
                  ? "📷 Image"
                  : message.replyToMessage.type === "video"
                  ? "🎥 Video"
                  : "🎤 Voice")}
            </p>
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-2 ${colors.bg} ${colors.text} relative`}
        >
          {message.type === "image" && message.mediaUrl && (
            <div className="mb-2 -mx-2 -mt-2">
              {message.isOneTimeView && !message.viewedBy?.includes(userId) ? (
                <OneTimeMediaViewer
                  url={message.mediaUrl}
                  type="image"
                  messageId={message._id}
                />
              ) : isOneTimeExpired ? (
                <div className="p-8 border rounded-lg bg-muted/50 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Expired</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This one-time view message has expired
                  </p>
                </div>
              ) : (
                <img
                  src={message.mediaUrl}
                  alt="Shared image"
                  className="max-w-full rounded-t-2xl"
                />
              )}
            </div>
          )}

          {message.type === "video" && message.mediaUrl && (
            <div className="mb-2 -mx-2 -mt-2">
              {message.isOneTimeView && !message.viewedBy?.includes(userId) ? (
                <OneTimeMediaViewer
                  url={message.mediaUrl}
                  type="video"
                  messageId={message._id}
                />
              ) : isOneTimeExpired ? (
                <div className="p-8 border rounded-lg bg-muted/50 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Expired</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This one-time view message has expired
                  </p>
                </div>
              ) : (
                <video
                  src={message.mediaUrl}
                  controls
                  className="max-w-full rounded-t-2xl"
                />
              )}
            </div>
          )}

          {message.type === "voice" && message.mediaUrl && (
            <div className="mb-2">
              <audio src={message.mediaUrl} controls className="w-full" />
            </div>
          )}

          {message.content && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map((reaction: any, idx: number) => (
                <span
                  key={idx}
                  className="text-xs bg-black/20 dark:bg-white/20 rounded-full px-2 py-0.5"
                >
                  {reaction.emoji}
                </span>
              ))}
            </div>
          )}

        </div>

        {/* Time, status, and options - flex row */}
        <div className="flex items-center gap-2 text-xs opacity-70">
          <span>
            {formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })}
          </span>
          {isMyMessage && (
            <div className="flex items-center gap-1">
              {isPending ? (
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              ) : (
                <span>
                  {isSeen ? (
                    <CheckCheck className="h-3 w-3 text-blue-500" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </span>
              )}
            </div>
          )}
          {/* 3 dots menu - always visible */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onReply && (
                <DropdownMenuItem onClick={() => onReply(message._id)}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowReactions(true)}>
                <Smile className="h-4 w-4 mr-2" />
                React
              </DropdownMenuItem>
              {isMyMessage && (
                <>
                  <DropdownMenuItem
                    onClick={() => handleDelete(false)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete for me
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete for everyone
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Reactions picker */}
        {showReactions && (
          <MessageReactions
            messageId={message._id}
            userId={userId}
            onClose={() => setShowReactions(false)}
          />
        )}
      </div>

      {isMyMessage && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>Me</AvatarFallback>
        </Avatar>
      )}
    </div>

    {/* Mobile Menu Modal */}
    <Dialog open={showMobileMenu} onOpenChange={setShowMobileMenu}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-2">
          {onReply && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                onReply(message._id);
                setShowMobileMenu(false);
              }}
            >
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              setShowReactions(true);
              setShowMobileMenu(false);
            }}
          >
            <Smile className="h-4 w-4 mr-2" />
            React
          </Button>
          {isMyMessage && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={() => handleDelete(false)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete for me
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={() => handleDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete for everyone
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
