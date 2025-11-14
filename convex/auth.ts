import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Sign up a new user
export const signup = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Check if email already exists (if provided)
    if (args.email) {
      const existingEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (existingEmail) {
        throw new Error("Email already exists");
      }
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      username: args.username,
      password: args.password, // In production, hash this!
      email: args.email,
      joinedAt: Date.now(),
      isOnline: true,
      lastSeen: Date.now(),
    });

    return userId;
  },
});

// Login
export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) {
      throw new Error("Invalid username or password");
    }

    if (user.password !== args.password) {
      throw new Error("Invalid username or password");
    }

    // Update online status
    await ctx.db.patch(user._id, {
      isOnline: true,
      lastSeen: Date.now(),
    });

    return {
      userId: user._id,
      username: user.username,
      email: user.email,
    };
  },
});

// Get current user
export const getCurrentUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    // Don't return password
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      nickname: user.nickname,
      bio: user.bio,
      joinedAt: user.joinedAt,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };
  },
});

// Logout (update online status)
export const logout = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isOnline: false,
      lastSeen: Date.now(),
    });
  },
});

// Search users by username
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (!args.searchTerm) return [];

    const users = await ctx.db
      .query("users")
      .withIndex("by_username")
      .collect();

    const searchLower = args.searchTerm.toLowerCase();
    const filtered = users
      .filter(
        (user) =>
          user._id !== args.currentUserId &&
          user.username.toLowerCase().includes(searchLower)
      )
      .slice(0, 10);

    return filtered.map((user) => ({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      isOnline: user.isOnline,
    }));
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    avatar: v.optional(v.string()),
    nickname: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.nickname !== undefined) updates.nickname = args.nickname;
    if (args.bio !== undefined) updates.bio = args.bio;

    await ctx.db.patch(args.userId, updates);
  },
});

// Get user profile
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Count friends (accepted friend requests)
    const friendRequests = await ctx.db
      .query("friendRequests")
      .withIndex("by_from_user")
      .collect();

    const friends = friendRequests.filter(
      (req) =>
        (req.fromUserId === args.userId || req.toUserId === args.userId) &&
        req.status === "accepted"
    ).length;

    return {
      _id: user._id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio,
      joinedAt: user.joinedAt,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      friendsCount: friends,
    };
  },
});

