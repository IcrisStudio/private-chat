import { query } from "./_generated/server";
import { v } from "convex/values";

// Get all media in a chat
export const getChatMedia = query({
  args: {
    chatId: v.id("chats"),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("voice"))),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    const mediaMessages = messages.filter(
      (msg) =>
        (msg.type === "image" || msg.type === "video" || msg.type === "voice") &&
        msg.mediaUrl &&
        !msg.deletedFor?.includes(msg.senderId) &&
        (!args.mediaType || msg.type === args.mediaType)
    );

    // Get sender info
    const mediaWithSenders = await Promise.all(
      mediaMessages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          _id: msg._id,
          type: msg.type,
          mediaUrl: msg.mediaUrl,
          sentAt: msg.sentAt,
          sender: sender
            ? {
                _id: sender._id,
                username: sender.username,
                nickname: sender.nickname,
                avatar: sender.avatar,
              }
            : null,
        };
      })
    );

    return mediaWithSenders.sort((a, b) => b.sentAt - a.sentAt);
  },
});

