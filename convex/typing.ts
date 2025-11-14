import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Set typing indicator
export const setTyping = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Remove old typing indicators for this user in this chat
    const existing = await ctx.db
      .query("typing")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    await Promise.all(
      existing
        .filter((t) => t.userId === args.userId)
        .map((t) => ctx.db.delete(t._id))
    );

    // Add new typing indicator
    await ctx.db.insert("typing", {
      chatId: args.chatId,
      userId: args.userId,
      timestamp: Date.now(),
    });

    // Note: Auto-removal handled in getTyping query by filtering old entries
  },
});

// Get typing indicators for a chat
export const getTyping = query({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    const typing = await ctx.db
      .query("typing")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    // Filter out old indicators (older than 3 seconds)
    const recent = typing.filter((t) => Date.now() - t.timestamp < 3000);

    // Get user info
    const typingUsers = await Promise.all(
      recent.map(async (t) => {
        const user = await ctx.db.get(t.userId);
        return user ? { _id: user._id, username: user.username } : null;
      })
    );

    return typingUsers.filter((u) => u !== null);
  },
});

