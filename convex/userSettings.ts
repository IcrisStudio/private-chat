import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.username !== undefined) updates.username = args.username;
    if (args.email !== undefined) updates.email = args.email;
    if (args.avatar !== undefined) updates.avatar = args.avatar;

    await ctx.db.patch(args.userId, updates);
  },
});

// Set nickname in chat
export const setChatNickname = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return;

    const nicknames = chat.participantNicknames || {};
    await ctx.db.patch(args.chatId, {
      participantNicknames: {
        ...nicknames,
        [args.userId]: args.nickname,
      },
    });
  },
});

// Get user profile
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get friend count
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_participant")
      .collect();

    const friendCount = chats.filter(
      (chat) => chat.participants.includes(args.userId) && !chat.isGroup
    ).length;

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      friendCount,
      createdAt: user._creationTime, // Approximate join date
    };
  },
});

