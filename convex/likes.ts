import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getLikeStatus = query({
    args: {
        videoId: v.id("videos"),
        userId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        if (!args.userId) return null;
        const like = await ctx.db
            .query("likes")
            .withIndex("by_user_video", (q) =>
                q.eq("userId", args.userId!).eq("videoId", args.videoId)
            )
            .unique();
        return like?.type || null; // "like" | "dislike" | null
    },
});

export const toggleLike = mutation({
    args: {
        videoId: v.id("videos"),
        userId: v.id("users"),
        type: v.union(v.literal("like"), v.literal("dislike")),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("likes")
            .withIndex("by_user_video", (q) =>
                q.eq("userId", args.userId).eq("videoId", args.videoId)
            )
            .unique();

        const video = await ctx.db.get(args.videoId);
        if (!video) throw new Error("Video not found");

        if (existing) {
            if (existing.type === args.type) {
                // Toggle off (remove)
                await ctx.db.delete(existing._id);
                if (args.type === "like") {
                    await ctx.db.patch(args.videoId, { likes: (video.likes || 0) - 1 });
                } else {
                    await ctx.db.patch(args.videoId, { dislikes: (video.dislikes || 0) - 1 });
                }
            } else {
                // Switch type (e.g., like -> dislike)
                await ctx.db.patch(existing._id, { type: args.type });
                if (args.type === "like") {
                    await ctx.db.patch(args.videoId, {
                        likes: (video.likes || 0) + 1,
                        dislikes: (video.dislikes || 0) - 1
                    });
                } else {
                    await ctx.db.patch(args.videoId, {
                        likes: (video.likes || 0) - 1,
                        dislikes: (video.dislikes || 0) + 1
                    });
                }
            }
        } else {
            // Create new
            await ctx.db.insert("likes", {
                videoId: args.videoId,
                userId: args.userId,
                type: args.type,
            });
            if (args.type === "like") {
                await ctx.db.patch(args.videoId, { likes: (video.likes || 0) + 1 });
            } else {
                await ctx.db.patch(args.videoId, { dislikes: (video.dislikes || 0) + 1 });
            }
        }
    },
});
