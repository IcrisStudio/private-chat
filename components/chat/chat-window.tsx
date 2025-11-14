"use client";

import { useState, useEffect, useRef } from "react";
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
  Video,
  Mic,
  Trash2,
  Edit2,
  Settings,
  Play,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { useDropzone } from "react-dropzone";
import ChatSettings from "./chat-settings";
import OneTimeMediaViewer from "./one-time-media-viewer";

interface ChatWindowProps {
  chatId: Id<"chats">;
  userId: Id<"users">;
  onBack?: () => void;
}

export default function ChatWindow({ chatId, userId, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [oneTimeViewer, setOneTimeViewer] = useState<{
    url: string;
    type: "image" | "video";
    messageId: Id<"messages">;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isOneTime, setIsOneTime] = useState(false);

  const chat = useQuery(api.chats.getUserChats, { userId });
  const currentChat = chat?.find((c) => c._id === chatId);
  const messages = useQuery(api.chats.getMessages, { chatId });
  
  const sendMessage = useMutation(api.chats.sendMessage);
  const markAsSeen = useMutation(api.chats.markChatAsSeen);
  const deleteChat = useMutation(api.chats.deleteChat);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // Mark messages as seen when chat is viewed
    if (chatId) {
      markAsSeen({ chatId, userId });
    }
  }, [chatId, userId, markAsSeen]);

  const handleSendMessage = async (content?: string, type: "text" | "image" | "video" | "voice" = "text", mediaUrl?: string) => {
    if (!content && !mediaUrl) return;

    try {
      await sendMessage({
        chatId,
        senderId: userId,
        content,
        type,
        mediaUrl,
        isOneTimeView: type !== "text" && isOneTime,
      });
      setMessage("");
      setIsOneTime(false);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
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
    for (const file of acceptedFiles) {
      if (file.type.startsWith("image/")) {
        // Convert to base64 for now (in production, upload to storage)
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          await handleSendMessage(undefined, "image", base64);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          await handleSendMessage(undefined, "video", base64);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    multiple: false,
  });

  const handleFileSelect = (type: "image" | "video") => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await handleSendMessage(undefined, "image", base64);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await handleSendMessage(undefined, "video", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = () => {
    // Voice recording implementation
    setIsRecording(true);
    // TODO: Implement actual recording with MediaRecorder API
  };

  const stopRecording = async () => {
    setIsRecording(false);
    // TODO: Save recording and send as voice message
    // For now, just a placeholder
    alert("Voice recording feature coming soon!");
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
    default: "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950",
    sunset: "bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-950 dark:to-pink-950",
    ocean: "bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950",
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
        <div className="p-4 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between">
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
              <h2 className="font-semibold">
                {currentChat.chatName || otherUser?.username || "Unknown"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {otherUser?.isOnline ? "Online" : "Offline"}
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages?.map((msg) => {
            const isMyMessage = msg.senderId === userId;
            const isSeen = msg.viewedBy && msg.viewedBy.length > 0;

            return (
              <div
                key={msg._id}
                className={`flex gap-3 ${isMyMessage ? "justify-end" : "justify-start"}`}
              >
                {!isMyMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.sender?.avatar} />
                    <AvatarFallback>
                      {msg.sender?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[70%] md:max-w-[60%] rounded-lg p-3 ${
                    isMyMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  }`}
                >
                  {msg.type === "image" && msg.mediaUrl && (
                    <div className="mb-2">
                      {msg.isOneTimeView && !msg.viewedBy.includes(userId) ? (
                        <OneTimeMediaViewer
                          url={msg.mediaUrl}
                          type="image"
                          messageId={msg._id}
                          onView={(url) => setOneTimeViewer({ url, type: "image", messageId: msg._id })}
                        />
                      ) : (
                        <img
                          src={msg.mediaUrl}
                          alt="Shared image"
                          className="max-w-full rounded-md"
                        />
                      )}
                    </div>
                  )}

                  {msg.type === "video" && msg.mediaUrl && (
                    <div className="mb-2">
                      {msg.isOneTimeView && !msg.viewedBy.includes(userId) ? (
                        <OneTimeMediaViewer
                          url={msg.mediaUrl}
                          type="video"
                          messageId={msg._id}
                          onView={(url) => setOneTimeViewer({ url, type: "video", messageId: msg._id })}
                        />
                      ) : (
                        <video
                          src={msg.mediaUrl}
                          controls
                          className="max-w-full rounded-md"
                        />
                      )}
                    </div>
                  )}

                  {msg.type === "voice" && (
                    <div className="flex items-center gap-2">
                      <audio src={msg.mediaUrl} controls />
                    </div>
                  )}

                  {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}

                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-xs opacity-70">
                      {format(new Date(msg.sentAt), "HH:mm")}
                    </span>
                    {isMyMessage && (
                      <span className="text-xs">
                        {isSeen ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>

                {isMyMessage && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>Me</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-card/80 backdrop-blur-sm">
          {isDragActive && (
            <div className="mb-4 p-4 border-2 border-dashed border-primary rounded-lg text-center text-sm">
              Drop files here to send
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFileSelect("image")}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFileSelect("video")}
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={isRecording ? "bg-destructive text-destructive-foreground" : ""}
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
              />
              
              {!message && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOneTime}
                    onChange={(e) => setIsOneTime(e.target.checked)}
                  />
                  One-time view
                </label>
              )}

              <Button
                onClick={() => handleSendMessage(message)}
                disabled={!message.trim()}
                size="icon"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <ChatSettings
          chatId={chatId}
          chatName={currentChat.chatName}
          onClose={() => setShowSettings(false)}
        />
      )}

      {oneTimeViewer && (
        <OneTimeMediaViewer
          url={oneTimeViewer.url}
          type={oneTimeViewer.type}
          messageId={oneTimeViewer.messageId}
          onClose={() => setOneTimeViewer(null)}
          autoShow
        />
      )}
    </>
  );
}

