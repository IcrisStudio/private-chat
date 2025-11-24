import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const subscribe = mutation({
    args: {
        channelId: v.id("users"),
        subscriberId: v.id("users"),
    },
    handler: async (ctx, args) => {
        if (args.channelId === args.subscriberId) {
            throw new Error("Cannot subscribe to yourself");
        }

        const existing = await ctx.db
            .query("subscriptions")
            .withIndex("by_subscriber_channel", (q) =>
                q.eq("subscriberId", args.subscriberId).eq("channelId", args.channelId)
            )
            .first();

        if (existing) {
            // Unsubscribe
            await ctx.db.delete(existing._id);

            // Decrement count
            const channel = await ctx.db.get(args.channelId);
            if (channel && (channel.subscriberCount || 0) > 0) {
                await ctx.db.patch(args.channelId, {
                    subscriberCount: (channel.subscriberCount || 1) - 1,
                });
            }
            return false; // Not subscribed
        } else {
            // Subscribe
            await ctx.db.insert("subscriptions", {
                subscriberId: args.subscriberId,
                channelId: args.channelId,
            });

            // Increment count
            const channel = await ctx.db.get(args.channelId);
            if (channel) {
                await ctx.db.patch(args.channelId, {
                    subscriberCount: (channel.subscriberCount || 0) + 1,
                });
            }
            return true; // Subscribed
        }
    },
});

export const isSubscribed = query({
    args: {
        channelId: v.id("users"),
        subscriberId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        if (!args.subscriberId) return false;

        const existing = await ctx.db
            .query("subscriptions")
            .withIndex("by_subscriber_channel", (q) =>
                q.eq("subscriberId", args.subscriberId!).eq("channelId", args.channelId)
            )
            .first();

        return !!existing;
    },
});
