import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Delete message for current user only
export const deleteMessageForUser = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    const deletedFor = message.deletedFor || [];
    if (!deletedFor.includes(args.userId)) {
      await ctx.db.patch(args.messageId, {
        deletedFor: [...deletedFor, args.userId],
      });
    }
  },
});

// Delete message for everyone
export const deleteMessageForEveryone = mutation({
  args: {
    messageId: v.id("messages"),
    senderId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message || message.senderId !== args.senderId) {
      throw new Error("Unauthorized or message not found");
    }

    // Delete the message entirely
    await ctx.db.delete(args.messageId);
  },
});

// Add reaction to message
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    const reactions = message.reactions || [];
    // Remove existing reaction from this user
    const filtered = reactions.filter((r) => r.userId !== args.userId);
    // Add new reaction
    await ctx.db.patch(args.messageId, {
      reactions: [...filtered, { userId: args.userId, emoji: args.emoji }],
    });
  },
});

// Remove reaction
export const removeReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    const reactions = message.reactions || [];
    const filtered = reactions.filter((r) => r.userId !== args.userId);
    await ctx.db.patch(args.messageId, {
      reactions: filtered,
    });
  },
});
