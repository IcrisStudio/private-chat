import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingUser) {
            throw new Error("User already exists");
        }

        return await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            password: args.password,
            isChannel: false,
        });
    },
});

export const login = mutation({
    args: {
        email: v.string(),
        password: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (!user || user.password !== args.password) {
            return null;
        }

        return user;
    },
});

export const createChannel = mutation({
    args: {
        userId: v.id("users"),
        username: v.string(),
        channelName: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();

        if (existing) {
            throw new Error("Username already taken");
        }

        await ctx.db.patch(args.userId, {
            isChannel: true,
            username: args.username,
            channelName: args.channelName,
            subscriberCount: 0,
        });
    },
});

export const getChannel = query({
    args: { username: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .unique();
    },
});

export const getUser = query({
    args: { userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        if (!args.userId) return null;
        return await ctx.db.get(args.userId);
    },
});

export const getUsers = query({
    args: { userIds: v.array(v.id("users")) },
    handler: async (ctx, args) => {
        const users = await Promise.all(
            args.userIds.map(id => ctx.db.get(id))
        );
        return users.filter(u => u !== null);
    },
});

export const getAllUsers = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    },
});

export const getOrCreateAdmin = mutation({
    args: {},
    handler: async (ctx) => {
        const email = "admin";
        const password = "admin";

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (existingUser) {
            return existingUser._id;
        }

        return await ctx.db.insert("users", {
            name: "Admin",
            email,
            password,
            isChannel: true,
            username: "admin_channel",
            channelName: "Admin Channel",
            subscriberCount: 0,
        });
    },
});

export const updateSubscriberCount = mutation({
    args: {
        userId: v.id("users"),
        count: v.number(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, { subscriberCount: args.count });
    },
});
