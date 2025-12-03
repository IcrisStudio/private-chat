import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get comprehensive channel analytics
export const getChannelAnalytics = query({
    args: { channelId: v.id("users") },
    handler: async (ctx, args) => {
        // Get all videos by this channel
        const videos = await ctx.db
            .query("videos")
            .withIndex("by_author", (q) => q.eq("authorId", args.channelId))
            .collect();

        // Calculate totals
        const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
        const totalVideos = videos.length;
        const totalLikes = videos.reduce((sum, video) => sum + (video.likes || 0), 0);
        const totalStorageSize = videos.reduce((sum, video) => sum + (video.size || 0), 0);

        // Calculate revenue: $0.10 per 1000 views
        const revenuePerThousandViews = 0.1;
        const totalRevenue = (totalViews / 1000) * revenuePerThousandViews;

        // Get channel info
        const channel = await ctx.db.get(args.channelId);

        return {
            totalViews,
            totalVideos,
            totalLikes,
            totalStorageSize,
            totalRevenue,
            subscriberCount: channel?.subscriberCount || 0,
            videos: videos.map(v => ({
                _id: v._id,
                title: v.title,
                views: v.views,
                likes: v.likes || 0,
                revenue: (v.views / 1000) * revenuePerThousandViews,
                _creationTime: v._creationTime,
            })),
        };
    },
});

// Get all comments on channel's videos
export const getAllChannelComments = query({
    args: { channelId: v.id("users") },
    handler: async (ctx, args) => {
        // Get all videos by this channel
        const videos = await ctx.db
            .query("videos")
            .withIndex("by_author", (q) => q.eq("authorId", args.channelId))
            .collect();

        const videoIds = videos.map(v => v._id);

        // Get all comments for these videos
        const allComments = await Promise.all(
            videoIds.map(async (videoId) => {
                const comments = await ctx.db
                    .query("comments")
                    .withIndex("by_video", (q) => q.eq("videoId", videoId))
                    .collect();

                // Enrich with user and video info
                return Promise.all(
                    comments.map(async (comment) => {
                        const user = await ctx.db.get(comment.userId);
                        const video = videos.find(v => v._id === videoId);
                        return {
                            ...comment,
                            user,
                            videoTitle: video?.title || "Unknown",
                        };
                    })
                );
            })
        );

        // Flatten and sort by creation time
        return allComments
            .flat()
            .sort((a, b) => b._creationTime - a._creationTime);
    },
});

// Update channel information
export const updateChannelInfo = mutation({
    args: {
        channelId: v.id("users"),
        channelName: v.optional(v.string()),
        username: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { channelId, channelName, username } = args;

        // If username is being changed, check if it's available
        if (username) {
            const existing = await ctx.db
                .query("users")
                .withIndex("by_username", (q) => q.eq("username", username))
                .first();

            if (existing && existing._id !== channelId) {
                throw new Error("Username already taken");
            }
        }

        // Update channel
        const updateData: any = {};
        if (channelName) updateData.channelName = channelName;
        if (username) updateData.username = username;

        await ctx.db.patch(channelId, updateData);

        return { success: true };
    },
});
