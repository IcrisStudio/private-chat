import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send a friend request
export const sendFriendRequest = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if request already exists
    const existing = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) =>
        q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
      )
      .first();

    if (existing && existing.status === "pending") {
      throw new Error("Friend request already sent");
    }

    // Check reverse request
    const reverse = await ctx.db
      .query("friendRequests")
      .withIndex("by_users", (q) =>
        q.eq("fromUserId", args.toUserId).eq("toUserId", args.fromUserId)
      )
      .first();

    if (reverse && reverse.status === "pending") {
      throw new Error("This user has already sent you a request");
    }

    await ctx.db.insert("friendRequests", {
      fromUserId: args.fromUserId,
      toUserId: args.toUserId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Get pending friend requests for a user
export const getFriendRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_user", (q) =>
        q.eq("toUserId", args.userId).eq("status", "pending")
      )
      .collect();

    const requestsWithUsers = await Promise.all(
      requests.map(async (req) => {
        const fromUser = await ctx.db.get(req.fromUserId);
        return {
          ...req,
          fromUser: fromUser
            ? {
                _id: fromUser._id,
                username: fromUser.username,
                avatar: fromUser.avatar,
              }
            : null,
        };
      })
    );

    return requestsWithUsers;
  },
});

// Accept friend request
export const acceptFriendRequest = mutation({
  args: {
    requestId: v.id("friendRequests"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: "accepted",
    });

    // Create chat after accepting - check if chat already exists
    const existingChats = await ctx.db
      .query("chats")
      .withIndex("by_participant")
      .collect();

    const existingChat = existingChats.find(
      (chat) =>
        chat.participants.includes(args.fromUserId) &&
        chat.participants.includes(args.toUserId) &&
        !chat.isGroup
    );

    if (existingChat) {
      return existingChat._id;
    }

    // Create new chat
    const chatId = await ctx.db.insert("chats", {
      participants: [args.fromUserId, args.toUserId],
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      isGroup: false,
    });

    return chatId;
  },
});

// Block user
export const blockUser = mutation({
  args: {
    requestId: v.optional(v.id("friendRequests")),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.requestId) {
      await ctx.db.patch(args.requestId, {
        status: "blocked",
      });
    } else {
      // Create a new block entry
      await ctx.db.insert("friendRequests", {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        status: "blocked",
        createdAt: Date.now(),
      });
    }
  },
});

