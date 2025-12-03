import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getVideos = query({
    args: {
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const videos = await ctx.db.query("videos").order("desc").collect();

        if (args.category === "Trending") {
            return videos.sort((a, b) => b.views - a.views);
        }

        if (args.category && args.category !== "All") {
            return videos.filter(v => v.category === args.category);
        }

        return videos;
    },
});

export const getVideosByAuthor = query({
    args: { authorId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("videos")
            .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
            .order("desc")
            .collect();
    },
});

export const getVideo = query({
    args: { id: v.id("videos") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getVideoUrl = query({
    args: { storageId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

export const getThumbnailUrl = query({
    args: { storageId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.storageId) return null;
        return await ctx.storage.getUrl(args.storageId);
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const createVideo = mutation({
    args: {
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        storageId: v.string(),
        authorId: v.id("users"),
        size: v.optional(v.number()),
        isPremium: v.optional(v.boolean()),
        thumbnailStorageId: v.optional(v.string()),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("videos", {
            title: args.title || "Untitled Video",
            description: args.description || "",
            storageId: args.storageId,
            authorId: args.authorId,
            views: 0,
            size: args.size,
            isPremium: args.isPremium || false,
            thumbnailStorageId: args.thumbnailStorageId,
            category: args.category || "Amateur",
            likes: 0,
            dislikes: 0,
        });
    },
});

export const incrementView = mutation({
    args: {
        id: v.id("videos"),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const video = await ctx.db.get(args.id);
        if (!video) return;

        // If user is logged in, check if they've already viewed
        if (args.userId) {
            const existingView = await ctx.db
                .query("views")
                .withIndex("by_user_video", (q) =>
                    q.eq("userId", args.userId!).eq("videoId", args.id)
                )
                .unique();

            // Only increment if this is a new view
            if (!existingView) {
                await ctx.db.insert("views", {
                    videoId: args.id,
                    userId: args.userId,
                });
                await ctx.db.patch(args.id, { views: video.views + 1 });
            }
        } else {
            // For non-logged-in users, just increment (can't track uniqueness)
            await ctx.db.patch(args.id, { views: video.views + 1 });
        }
    },
});

export const getChannelStats = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const videos = await ctx.db
            .query("videos")
            .withIndex("by_author", (q) => q.eq("authorId", args.userId))
            .collect();

        const totalViews = videos.reduce((acc, curr) => acc + curr.views, 0);
        const totalVideos = videos.length;
        const totalStorageSize = videos.reduce((acc, curr) => acc + (curr.size || 0), 0);

        return {
            totalViews,
            totalVideos,
            totalStorageSize,
        };
    },
});

export const getTrendingVideos = query({
    args: {},
    handler: async (ctx) => {
        const videos = await ctx.db.query("videos").collect();
        // Sort by views descending in memory (Convex doesn't support sorting by non-indexed field efficiently for large datasets, but fine for demo)
        // Ideally we'd have an index on views, but views change frequently so it might be expensive.
        return videos.sort((a, b) => b.views - a.views).slice(0, 10);
    },
});

export const searchVideos = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        if (!args.query) return [];

        const titleResults = await ctx.db
            .query("videos")
            .withSearchIndex("search_title", (q) => q.search("title", args.query))
            .take(10);

        const bodyResults = await ctx.db
            .query("videos")
            .withSearchIndex("search_body", (q) => q.search("description", args.query))
            .take(10);

        // Combine and deduplicate
        const results = new Map();
        titleResults.forEach((v) => results.set(v._id, v));
        bodyResults.forEach((v) => results.set(v._id, v));

        return Array.from(results.values());
    },
});

// For editing video details
export const updateVideo = mutation({
    args: {
        videoId: v.id("videos"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        category: v.optional(v.string()),
        thumbnailStorageId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { videoId, ...updates } = args;
        await ctx.db.patch(videoId, updates);
    },
});

export const deleteVideo = mutation({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const video = await ctx.db.get(args.videoId);
        if (!video) return;

        // Optional: Delete storage file if needed
        // if (video.storageId) await ctx.storage.delete(video.storageId);
        // if (video.thumbnailStorageId) await ctx.storage.delete(video.thumbnailStorageId);

        await ctx.db.delete(args.videoId);
    },
});
