"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search, Plus, MessageCircle, Settings, LogOut, ChevronLeft, ChevronRight, User } from "lucide-react";
import { useRouter } from "next/navigation";
import ChatList from "@/components/chat/chat-list";
import EnhancedChatWindow from "@/components/chat/enhanced-chat-window";
import UserSearch from "@/components/chat/user-search";
import FriendRequests from "@/components/chat/friend-requests";

export default function ChatPage() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [selectedChat, setSelectedChat] = useState<Id<"chats"> | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  
  const logout = useMutation(api.auth.logout);
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/");
      return;
    }
    setUserId(storedUserId as Id<"users">);
  }, [router]);

  const handleLogout = async () => {
    if (userId) {
      await logout({ userId });
    }
    localStorage.removeItem("userId");
    router.push("/");
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div
        className={`${
          selectedChat ? "hidden md:flex" : "flex"
        } ${sidebarCollapsed ? "w-16" : "w-full md:w-80"} border-r flex-col bg-card transition-all duration-300`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-lg">Chats</h1>
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {!sidebarCollapsed && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/settings")}
                >
                  <User className="h-5 w-5" />
                </Button>
                <ThemeToggle />
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Friend Requests */}
        <FriendRequests
          userId={userId}
          onRequestAccepted={(chatId) => setSelectedChat(chatId)}
        />

        {/* Chat List */}
        <ChatList
          userId={userId}
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <EnhancedChatWindow
            chatId={selectedChat}
            userId={userId}
            onBack={() => setSelectedChat(null)}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      {showSearch && (
        <UserSearch
          currentUserId={userId}
          onClose={() => setShowSearch(false)}
          onChatSelected={(chatId) => {
            setSelectedChat(chatId);
            setShowSearch(false);
          }}
        />
      )}
    </div>
  );
}

