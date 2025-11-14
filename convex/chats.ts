import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or get a chat between two users
export const createOrGetChat = mutation({
  args: {
    participant1Id: v.id("users"),
    participant2Id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if chat already exists
    const existingChats = await ctx.db
      .query("chats")
      .withIndex("by_participant")
      .collect();

    const existingChat = existingChats.find(
      (chat) =>
        chat.participants.includes(args.participant1Id) &&
        chat.participants.includes(args.participant2Id) &&
        !chat.isGroup
    );

    if (existingChat) {
      return existingChat._id;
    }

    // Create new chat
    const chatId = await ctx.db.insert("chats", {
      participants: [args.participant1Id, args.participant2Id],
      createdAt: Date.now(),
      lastMessageAt: Date.now(),
      isGroup: false,
    });

    return chatId;
  },
});

// Get all chats for a user
export const getUserChats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_participant")
      .collect();

    const userChats = chats.filter((chat) =>
      chat.participants.includes(args.userId)
    );

    // Get last message and other participant info for each chat
    const chatsWithDetails = await Promise.all(
      userChats.map(async (chat) => {
        const otherParticipantId = chat.participants.find(
          (id) => id !== args.userId
        );

        let otherParticipant = null;
        if (otherParticipantId && !chat.isGroup) {
          otherParticipant = await ctx.db.get(otherParticipantId);
        }

        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
          .order("desc")
          .first();

        return {
          ...chat,
          otherParticipant: otherParticipant
            ? {
                _id: otherParticipant._id,
                username: otherParticipant.username,
                avatar: otherParticipant.avatar,
                isOnline: otherParticipant.isOnline,
              }
            : null,
          lastMessage,
        };
      })
    );

    // Sort by last message time
    return chatsWithDetails.sort(
      (a, b) => b.lastMessageAt - a.lastMessageAt
    );
  },
});

// Get messages for a chat
export const getMessages = query({
  args: {
    chatId: v.id("chats"),
    limit: v.optional(v.number()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .take(limit);

    // Filter out messages deleted for the user
    const filteredMessages = messages.filter(
      (msg) => !msg.deletedFor?.includes(args.userId)
    );

    // Get sender info and reply info for each message
    const messagesWithSenders = await Promise.all(
      filteredMessages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        let replyToMessage = null;
        if (message.replyTo) {
          const replyTo = await ctx.db.get(message.replyTo);
          if (replyTo) {
            const replySender = await ctx.db.get(replyTo.senderId);
            replyToMessage = {
              _id: replyTo._id,
              content: replyTo.content,
              type: replyTo.type,
              sender: replySender
                ? {
                    _id: replySender._id,
                    username: replySender.username,
                    nickname: replySender.nickname,
                  }
                : null,
            };
          }
        }
        return {
          ...message,
          sender: sender
            ? {
                _id: sender._id,
                username: sender.username,
                nickname: sender.nickname,
                avatar: sender.avatar,
              }
            : {
                _id: message.senderId,
                username: "Unknown",
                nickname: undefined,
                avatar: undefined,
              },
          replyToMessage,
        };
      })
    );

    return messagesWithSenders.reverse(); // Return in chronological order
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    senderId: v.id("users"),
    content: v.optional(v.string()),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("video"),
      v.literal("voice")
    ),
    mediaUrl: v.optional(v.string()),
    isOneTimeView: v.optional(v.boolean()),
    replyTo: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      senderId: args.senderId,
      content: args.content,
      type: args.type,
      mediaUrl: args.mediaUrl,
      isOneTimeView: args.isOneTimeView ?? false,
      viewedBy: [],
      sentAt: Date.now(),
      deletedFor: [],
      replyTo: args.replyTo,
      status: "sent",
    });

    // Update chat's last message time
    await ctx.db.patch(args.chatId, {
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

// Mark message as seen
export const markAsSeen = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    if (!message.viewedBy.includes(args.userId)) {
      await ctx.db.patch(args.messageId, {
        viewedBy: [...message.viewedBy, args.userId],
        seenAt: Date.now(),
      });
    }
  },
});

// Mark all messages in chat as seen
export const markChatAsSeen = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    await Promise.all(
      messages
        .filter(
          (msg) =>
            msg.senderId !== args.userId &&
            !msg.viewedBy.includes(args.userId)
        )
        .map((msg) =>
          ctx.db.patch(msg._id, {
            viewedBy: [...msg.viewedBy, args.userId],
            seenAt: Date.now(),
          })
        )
    );
  },
});

// Update chat name
export const updateChatName = mutation({
  args: {
    chatId: v.id("chats"),
    chatName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatId, {
      chatName: args.chatName,
    });
  },
});

// Delete chat
export const deleteChat = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    // Delete all messages in the chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    await Promise.all(messages.map((msg) => ctx.db.delete(msg._id)));

    // Delete the chat
    await ctx.db.delete(args.chatId);
  },
});

// Update chat theme
export const updateChatTheme = mutation({
  args: {
    chatId: v.id("chats"),
    theme: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chatId, {
      theme: args.theme,
    });
  },
});

// Update chat nickname for user
export const updateChatNickname = mutation({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return;

    const nicknames: Record<string, string> = (chat.participantNicknames as Record<string, string>) || {};
    nicknames[args.userId] = args.nickname;

    await ctx.db.patch(args.chatId, {
      participantNicknames: nicknames,
    });
  },
});

// Delete message (unsend)
export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.id("users"),
    deleteForEveryone: v.boolean(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return;

    if (args.deleteForEveryone && message.senderId === args.userId) {
      // Delete for everyone
      await ctx.db.delete(args.messageId);
    } else {
      // Delete for me only
      if (!message.deletedFor) {
        await ctx.db.patch(args.messageId, {
          deletedFor: [args.userId],
        });
      } else if (!message.deletedFor.includes(args.userId)) {
        await ctx.db.patch(args.messageId, {
          deletedFor: [...message.deletedFor, args.userId],
        });
      }
    }
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
    const updated = [...filtered, { emoji: args.emoji, userId: args.userId }];

    await ctx.db.patch(args.messageId, {
      reactions: updated,
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

// Get media gallery for chat
export const getMediaGallery = query({
  args: {
    chatId: v.id("chats"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    const mediaMessages = messages
      .filter(
        (msg) =>
          (msg.type === "image" || msg.type === "video") &&
          msg.mediaUrl &&
          !msg.deletedFor?.includes(args.userId)
      )
      .map((msg) => ({
        _id: msg._id,
        type: msg.type,
        mediaUrl: msg.mediaUrl,
        sentAt: msg.sentAt,
        senderId: msg.senderId,
      }))
      .sort((a, b) => b.sentAt - a.sentAt);

    return mediaMessages;
  },
});

