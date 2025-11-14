"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface FriendRequestsProps {
  userId: Id<"users">;
  onRequestAccepted?: (chatId: Id<"chats">) => void;
}

export default function FriendRequests({
  userId,
  onRequestAccepted,
}: FriendRequestsProps) {
  const requests = useQuery(api.friendRequests.getFriendRequests, { userId });
  const acceptRequest = useMutation(api.friendRequests.acceptFriendRequest);
  const blockUser = useMutation(api.friendRequests.blockUser);

  const handleAccept = async (
    requestId: Id<"friendRequests">,
    fromUserId: Id<"users">
  ) => {
    try {
      const chatId = await acceptRequest({
        requestId,
        fromUserId,
        toUserId: userId,
      });
      toast.success("Friend request accepted!", {
        description: "You can now start chatting.",
      });
      if (onRequestAccepted) {
        onRequestAccepted(chatId);
      }
    } catch (error) {
      console.error("Failed to accept request:", error);
      toast.error("Failed to accept request");
    }
  };

  const handleBlock = async (
    requestId: Id<"friendRequests">,
    fromUserId: Id<"users">
  ) => {
    try {
      await blockUser({
        requestId,
        fromUserId,
        toUserId: userId,
      });
      toast.success("User blocked");
    } catch (error) {
      console.error("Failed to block user:", error);
      toast.error("Failed to block user");
    }
  };

  if (!requests) {
    return null;
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="p-4 border-b bg-muted/50">
      <h3 className="text-sm font-semibold mb-3">Friend Requests</h3>
      <div className="space-y-2">
        {requests.map((request) => (
          <div
            key={request._id}
            className="flex items-center justify-between p-3 rounded-lg bg-background border"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={request.fromUser?.avatar} />
                <AvatarFallback>
                  {request.fromUser?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {request.fromUser?.username || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">Wants to chat</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleAccept(request._id, request.fromUserId)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBlock(request._id, request.fromUserId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

