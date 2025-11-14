"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

interface UserSearchProps {
  currentUserId: Id<"users">;
  onClose: () => void;
  onChatSelected: (chatId: Id<"chats">) => void;
}

export default function UserSearch({
  currentUserId,
  onClose,
  onChatSelected,
}: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  const users = useQuery(
    api.auth.searchUsers,
    debouncedSearch
      ? { searchTerm: debouncedSearch, currentUserId }
      : "skip"
  );
  
  const sendRequest = useMutation(api.friendRequests.sendFriendRequest);
  const createChat = useMutation(api.chats.createOrGetChat);

  const handleStartChat = async (otherUserId: Id<"users">) => {
    try {
      // Try to create or get existing chat
      const chatId = await createChat({
        participant1Id: currentUserId,
        participant2Id: otherUserId,
      });
      onChatSelected(chatId);
    } catch (error: any) {
      // If chat doesn't exist, send friend request
      try {
        await sendRequest({
          fromUserId: currentUserId,
          toUserId: otherUserId,
        });
        toast.success("Friend request sent!", {
          description: "Wait for the user to accept your request.",
        });
        onClose();
      } catch (err: any) {
        toast.error("Failed to send request", {
          description: err.message || "Failed to start chat",
        });
      }
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {users && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchTerm ? "No users found" : "Start typing to search"}
                </p>
              ) : (
                users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                        {user.isOnline && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartChat(user._id)}
                    >
                      Message
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

