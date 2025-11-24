import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        password: v.optional(v.string()),
        image: v.optional(v.string()),
        isChannel: v.boolean(),
        username: v.optional(v.string()),
        channelName: v.optional(v.string()),
        subscriberCount: v.optional(v.number()),
        revenue: v.optional(v.number()),
        subscriptionPrice: v.optional(v.number()),
        balance: v.optional(v.number()),
    })
        .index("by_email", ["email"])
        .index("by_username", ["username"]),

    videos: defineTable({
        title: v.string(),
        description: v.string(),
        storageId: v.string(),
        authorId: v.id("users"),
        views: v.number(),
        size: v.optional(v.number()),
        thumbnailUrl: v.optional(v.string()),
        thumbnailStorageId: v.optional(v.string()),
        isPremium: v.optional(v.boolean()),
        likes: v.optional(v.number()),
        dislikes: v.optional(v.number()),
    })
        .index("by_author", ["authorId"])
        .searchIndex("search_title", {
            searchField: "title",
        })
        .searchIndex("search_body", {
            searchField: "description",
        }),

    likes: defineTable({
        videoId: v.id("videos"),
        userId: v.id("users"),
        type: v.union(v.literal("like"), v.literal("dislike")),
    })
        .index("by_video", ["videoId"])
        .index("by_user_video", ["userId", "videoId"]),

    comments: defineTable({
        videoId: v.id("videos"),
        userId: v.id("users"),
        text: v.string(),
        parentId: v.optional(v.id("comments")),
        likes: v.optional(v.number()),
    })
        .index("by_video", ["videoId"]),

    subscriptions: defineTable({
        subscriberId: v.id("users"),
        channelId: v.id("users"),
    })
        .index("by_subscriber", ["subscriberId"])
        .index("by_channel", ["channelId"])
        .index("by_subscriber_channel", ["subscriberId", "channelId"]),

    posts: defineTable({
        authorId: v.id("users"),
        text: v.string(),
        imageUrl: v.optional(v.string()),
        storageId: v.optional(v.string()),
        likes: v.number(),
    })
        .index("by_author", ["authorId"]),

    views: defineTable({
        videoId: v.id("videos"),
        userId: v.id("users"),
    })
        .index("by_video", ["videoId"])
        .index("by_user_video", ["userId", "videoId"]),
});
