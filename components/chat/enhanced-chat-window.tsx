"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Send,
  Image as ImageIcon,
  Mic,
  Trash2,
  Settings,
  ArrowLeft,
  X,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import EnhancedChatSettings from "./enhanced-chat-settings";
import MessageItem from "./message-item";
import MediaPreview from "./media-preview";
import TypingIndicator from "./typing-indicator";
import AudioRecorder from "./audio-recorder";

interface EnhancedChatWindowProps {
  chatId: Id<"chats">;
  userId: Id<"users">;
  onBack?: () => void;
}

export default function EnhancedChatWindow({
  chatId,
  userId,
  onBack,
}: EnhancedChatWindowProps) {
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [replyTo, setReplyTo] = useState<Id<"messages"> | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{
    url: string;
    type: "image" | "video";
    file: File;
  } | null>(null);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isOneTime, setIsOneTime] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const chat = useQuery(api.chats.getUserChats, { userId });
  const currentChat = chat?.find((c) => c._id === chatId);
  const messages = useQuery(api.chats.getMessages, { chatId, userId });
  const typingUsers = useQuery(api.typing.getTyping, { chatId });

  const sendMessage = useMutation(api.chats.sendMessage);
  const markAsSeen = useMutation(api.chats.markChatAsSeen);
  const deleteChat = useMutation(api.chats.deleteChat);
  const setTyping = useMutation(api.typing.setTyping);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (chatId) {
      markAsSeen({ chatId, userId });
    }
  }, [chatId, userId, markAsSeen]);

  // Typing indicator - only when actively typing
  const handleTyping = useCallback(
    (text: string) => {
      if (chatId && text.length > 0) {
        setTyping({ chatId, userId });
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    },
    [chatId, userId, setTyping]
  );

  // Stop typing indicator when input is empty
  useEffect(() => {
    if (message.length === 0 && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [message]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (
    content?: string,
    type: "text" | "image" | "video" | "voice" = "text",
    mediaUrl?: string
  ) => {
    if (!content && !mediaUrl) return;

    const tempId = `temp-${Date.now()}`;
    if (type === "image" || type === "video" || type === "voice") {
      setSendingMessages((prev) => new Set(prev).add(tempId));
    }

    try {
      const messageId = await sendMessage({
        chatId,
        senderId: userId,
        content,
        type,
        mediaUrl,
        isOneTimeView: type !== "text" && isOneTime,
        replyTo: replyTo || undefined,
      });
      
      // Add real message ID to sending set temporarily
      if (type === "image" || type === "video" || type === "voice") {
        setSendingMessages((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          next.add(messageId);
          // Remove after a short delay
          setTimeout(() => {
            setSendingMessages((p) => {
              const n = new Set(p);
              n.delete(messageId);
              return n;
            });
          }, 2000);
          return next;
        });
      }
      
      setMessage("");
      setReplyTo(null);
      setMediaPreview(null);
      setIsOneTime(false);
      setShowAudioRecorder(false);
      
      if (type === "voice") {
        toast.success("Voice message sent");
      } else if (type === "image" || type === "video") {
        toast.success("Media sent");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      if (type === "image" || type === "video" || type === "voice") {
        setSendingMessages((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      }
    }
  };

  const handleAudioRecordingComplete = async (audioBlob: Blob) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await handleSendMessage(undefined, "voice", base64);
    };
    reader.readAsDataURL(audioBlob);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        handleSendMessage(message);
      }
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (25 MB limit)
    const maxSize = 25 * 1024 * 1024; // 25 MB in bytes
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Maximum file size is 25 MB",
      });
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreview({
          url: reader.result as string,
          type: "image",
          file,
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreview({
          url: reader.result as string,
          type: "video",
          file,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    multiple: false,
    maxSize: 25 * 1024 * 1024, // 25 MB in bytes
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(({ errors }) => {
        errors.forEach((error) => {
          if (error.code === "file-too-large") {
            toast.error("File too large", {
              description: "Maximum file size is 25 MB",
            });
          } else {
            toast.error("File rejected", {
              description: error.message,
            });
          }
        });
      });
    },
  });

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (25 MB limit)
    const maxSize = 25 * 1024 * 1024; // 25 MB in bytes
    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Maximum file size is 25 MB",
      });
      return;
    }

    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setMediaPreview({
          url: reader.result as string,
          type: file.type.startsWith("image/") ? "image" : "video",
          file,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMedia = async () => {
    if (!mediaPreview) return;

    setUploadingMedia(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await handleSendMessage(undefined, mediaPreview.type, base64);
      setUploadingMedia(false);
    };
    reader.readAsDataURL(mediaPreview.file);
  };


  const otherUser = currentChat?.otherParticipant;

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  const chatTheme = currentChat.theme || "default";
  const themeClasses: Record<string, string> = {
    default:
      "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950",
    sunset:
      "bg-gradient-to-br from-orange-100 via-pink-100 to-red-100 dark:from-orange-950 dark:via-pink-950 dark:to-red-950",
    ocean:
      "bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 dark:from-cyan-950 dark:via-blue-950 dark:to-teal-950",
    forest:
      "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950",
    purple:
      "bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 dark:from-purple-950 dark:via-violet-950 dark:to-indigo-950",
  };

  return (
    <>
      <div
        className={`flex-1 flex flex-col ${themeClasses[chatTheme] || themeClasses.default}`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Chat Header */}
        <div className="p-3 md:p-4 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Avatar>
              <AvatarImage src={otherUser?.avatar} alt={otherUser?.username} />
              <AvatarFallback>
                {otherUser?.username?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
              {otherUser?.isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </Avatar>
            <div>
              <h2 className="font-semibold text-sm md:text-base">
                {currentChat.chatName || otherUser?.username || "Unknown"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {typingUsers && typingUsers.length > 0
                  ? `${typingUsers[0]?.username} is typing...`
                  : otherUser?.isOnline
                  ? "Online"
                  : "Offline"}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Chat Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm("Are you sure you want to delete this chat?")) {
                    deleteChat({ chatId });
                    toast.success("Chat deleted");
                    if (onBack) onBack();
                  }
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
          {messages?.map((msg) => (
            <MessageItem
              key={msg._id}
              message={msg}
              userId={userId}
              onReply={setReplyTo}
              chatTheme={chatTheme}
              isPending={sendingMessages.has(msg._id) || (msg.type !== "text" && Date.now() - msg.sentAt < 3000 && msg.senderId === userId)}
            />
          ))}
          {typingUsers && typingUsers.length > 0 && typingUsers.some(u => u && u._id !== userId) && (
            <TypingIndicator users={typingUsers.filter(u => u && u._id !== userId) as Array<{ _id: string; username: string }>} />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold">Replying to message</p>
              <p className="text-xs text-muted-foreground truncate">
                {messages?.find((m) => m._id === replyTo)?.content ||
                  "Message"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setReplyTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Audio Recorder */}
        {showAudioRecorder && (
          <div className="px-4 py-2 border-t bg-muted/50">
            <AudioRecorder
              onRecordingComplete={handleAudioRecordingComplete}
              onCancel={() => setShowAudioRecorder(false)}
            />
          </div>
        )}

        {/* Media preview */}
        {mediaPreview && (
          <MediaPreview
            preview={mediaPreview}
            onRemove={() => {
              setMediaPreview(null);
              setUploadingMedia(false);
            }}
            onSend={sendMedia}
            isOneTime={isOneTime}
            onOneTimeChange={setIsOneTime}
            isUploading={uploadingMedia}
          />
        )}

        {/* Message Input - WhatsApp style */}
        <div className="p-3 md:p-4 border-t bg-card/80 backdrop-blur-sm">
          {isDragActive && (
            <div className="mb-4 p-4 border-2 border-dashed border-primary rounded-lg text-center text-sm">
              Drop files here to send
            </div>
          )}

          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFileSelect}
              className="flex-shrink-0"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>

            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping(e.target.value);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="rounded-full pr-12 bg-background/50 border-2 focus:border-primary"
              />
              {message.trim() && (
                <Button
                  onClick={() => handleSendMessage(message)}
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAudioRecorder(!showAudioRecorder)}
              className="flex-shrink-0"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {showSettings && (
        <EnhancedChatSettings
          chatId={chatId}
          chatName={currentChat.chatName}
          userId={userId}
          otherUserId={otherUser?._id}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
