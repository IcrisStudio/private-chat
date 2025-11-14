import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    nickname: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.nickname !== undefined) updates.nickname = args.nickname;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.avatar !== undefined) updates.avatar = args.avatar;

    await ctx.db.patch(args.userId, updates);
  },
});

// Get user profile
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get friend count
    const friendRequests = await ctx.db
      .query("friendRequests")
      .withIndex("by_from_user")
      .collect();

    const friendCount = friendRequests.filter(
      (req) =>
        (req.fromUserId === args.userId || req.toUserId === args.userId) &&
        req.status === "accepted"
    ).length;

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
      friendCount,
    };
  },
});

