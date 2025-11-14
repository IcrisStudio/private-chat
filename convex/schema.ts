import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    password: v.string(), // In production, use hashing!
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    nickname: v.optional(v.string()),
    bio: v.optional(v.string()),
    joinedAt: v.number(),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_email", ["email"]),

  chats: defineTable({
    participants: v.array(v.id("users")),
    chatName: v.optional(v.string()),
    theme: v.optional(v.string()), // Background theme for the chat
    createdAt: v.number(),
    lastMessageAt: v.number(),
    isGroup: v.boolean(),
    participantNicknames: v.optional(v.any()),
  })
    .index("by_participant", ["participants"])
    .index("by_last_message", ["lastMessageAt"]),

  messages: defineTable({
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
    viewedBy: v.array(v.id("users")), // Track who viewed one-time messages
    sentAt: v.number(),
    seenAt: v.optional(v.number()),
    deletedFor: v.array(v.id("users")), // Users who deleted this message
    replyTo: v.optional(v.id("messages")), // Reply to message ID
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          userId: v.id("users"),
        })
      )
    ),
    status: v.optional(v.union(
      v.literal("sending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("seen")
    )),
  })
    .index("by_chat", ["chatId", "sentAt"])
    .index("by_sender", ["senderId"]),

  friendRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("blocked"),
      v.literal("declined")
    ),
    createdAt: v.number(),
  })
    .index("by_to_user", ["toUserId", "status"])
    .index("by_from_user", ["fromUserId"])
    .index("by_users", ["fromUserId", "toUserId"]),

  typing: defineTable({
    chatId: v.id("chats"),
    userId: v.id("users"),
    timestamp: v.number(),
  })
    .index("by_chat", ["chatId"]),
});

