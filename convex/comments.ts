import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createComment = mutation({
    args: {
        videoId: v.id("videos"),
        userId: v.id("users"),
        text: v.string(),
        parentId: v.optional(v.id("comments")),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("comments", {
            videoId: args.videoId,
            userId: args.userId,
            text: args.text,
            parentId: args.parentId,
            likes: 0,
        });
    },
});

export const getComments = query({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query("comments")
            .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
            .order("desc")
            .collect();

        // Enrich comments with user details
        const commentsWithUser = await Promise.all(
            comments.map(async (c) => {
                const user = await ctx.db.get(c.userId);
                return { ...c, user };
            })
        );
        return commentsWithUser;
    },
});
