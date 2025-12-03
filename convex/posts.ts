import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createPost = mutation({
    args: {
        text: v.string(),
        imageUrl: v.optional(v.string()),
        storageId: v.optional(v.string()),
        authorId: v.id("users"),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("posts", {
            text: args.text,
            imageUrl: args.imageUrl,
            storageId: args.storageId,
            authorId: args.authorId,
            likes: 0,
        });
    },
});

export const getPosts = query({
    args: { authorId: v.id("users") },
    handler: async (ctx, args) => {
        const posts = await ctx.db
            .query("posts")
            .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
            .order("desc")
            .collect();

        // Enrich with author info
        const author = await ctx.db.get(args.authorId);
        return posts.map((p) => ({ ...p, author }));
    },
});

export const getAllPosts = query({
    args: {},
    handler: async (ctx) => {
        const posts = await ctx.db
            .query("posts")
            .order("desc")
            .take(50); // Limit to 50 most recent posts

        // Enrich with author info
        const postsWithAuthors = await Promise.all(
            posts.map(async (post) => {
                const author = await ctx.db.get(post.authorId);
                return { ...post, author };
            })
        );

        return postsWithAuthors;
    },
});

export const deletePost = mutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.postId);
    },
});
