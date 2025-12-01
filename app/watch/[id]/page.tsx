"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, Share2, Reply, Lock } from "lucide-react";
import { EditVideoModal } from "@/components/EditVideoModal";
import { AdScript } from "@/components/AdScript";
import { VideoCard } from "@/components/VideoCard";

export default function WatchPage() {
    const params = useParams();
    const videoId = params.id as Id<"videos">;

    const video = useQuery(api.videos.getVideo, { id: videoId });
    const videoUrl = useQuery(api.videos.getVideoUrl, { storageId: video?.storageId || "" });
    const author = useQuery(api.users.getUser, { userId: video?.authorId });
    const incrementView = useMutation(api.videos.incrementView);

    // Fetch all videos for sidebar
    const allVideos = useQuery(api.videos.getVideos, {});
    const sidebarVideos = allVideos?.filter(v => v._id !== videoId).slice(0, 10) || [];
    const uniqueAuthorIds = sidebarVideos ? [...new Set(sidebarVideos.map(v => v.authorId))] : [];
    const sidebarAuthors = useQuery(api.users.getUsers, uniqueAuthorIds.length > 0 ? { userIds: uniqueAuthorIds } : "skip");
    const getAuthor = (authorId: any) => sidebarAuthors?.find(a => a._id === authorId);

    const [currentUserId, setCurrentUserId] = useState<Id<"users"> | null>(null);
    useEffect(() => {
        const storedId = localStorage.getItem("userId");
        if (storedId) setCurrentUserId(storedId as Id<"users">);
    }, []);

    const isSubscribed = useQuery(api.subscriptions.isSubscribed,
        author ? { channelId: author._id, subscriberId: currentUserId || undefined } : "skip"
    );
    const subscribe = useMutation(api.subscriptions.subscribe);

    const likeStatus = useQuery(api.likes.getLikeStatus,
        currentUserId ? { videoId, userId: currentUserId } : "skip"
    );
    const toggleLike = useMutation(api.likes.toggleLike);

    const handleSubscribe = async () => {
        if (!currentUserId) {
            toast.error("Please login to subscribe");
            return;
        }
        if (!author) return;
        await subscribe({ channelId: author._id, subscriberId: currentUserId });
    };

    const handleLike = async (type: "like" | "dislike") => {
        if (!currentUserId) {
            toast.error("Please login to like/dislike");
            return;
        }
        await toggleLike({ videoId, userId: currentUserId, type });
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    useEffect(() => {
        if (videoId) {
            incrementView({ id: videoId, userId: currentUserId || undefined });
        }
    }, [videoId, incrementView]);

    if (video === undefined) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
    if (video === null) return <div className="min-h-screen bg-background flex items-center justify-center">Video not found</div>;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-6 grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {/* Banner Ad Above Video */}
                    <div className="flex justify-center">
                        <AdScript
                            id="banner-above-video"
                            script='<script type="text/javascript">atOptions = {"key" : "6b0cf0d29e8605091ae3a4bfe3da7a74","format" : "iframe","height" : 90,"width" : 728,"params" : {}};</script><script type="text/javascript" src="//www.topcreativeformat.com/6b0cf0d29e8605091ae3a4bfe3da7a74/invoke.js"></script>'
                        />
                    </div>

                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group">
                        {videoUrl ? (
                            <>
                                <video
                                    src={videoUrl}
                                    controls={!video.isPremium || isSubscribed || currentUserId === author?._id}
                                    autoPlay
                                    className={`w-full h-full ${video.isPremium && !isSubscribed && currentUserId !== author?._id ? "blur-xl" : ""}`}
                                />
                                {video.isPremium && !isSubscribed && currentUserId !== author?._id && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
                                        <Lock className="h-12 w-12 text-white mb-4" />
                                        <h2 className="text-2xl font-bold text-white mb-2">Premium Content</h2>
                                        <p className="text-white/80 mb-6">Subscribe to this channel to unlock this video.</p>
                                        <Button size="lg" onClick={handleSubscribe}>Subscribe to Unlock</Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white">Loading Video...</div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold">{video.title}</h1>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={author?.image} />
                                    <AvatarFallback>{author?.name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <Link href={author?.username ? `/channel/${author.username}` : "#"} className="hover:underline">
                                        <h3 className="font-semibold">{author?.channelName || author?.name || "Unknown Author"}</h3>
                                    </Link>
                                    <p className="text-sm text-muted-foreground">{author?.subscriberCount || 0} subscribers</p>
                                </div>
                                {author && currentUserId !== author._id && (
                                    <Button variant={isSubscribed ? "secondary" : "default"} size="sm" onClick={handleSubscribe} className="ml-2">
                                        {isSubscribed ? "Subscribed" : "Subscribe"}
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {author && currentUserId === author._id && (
                                    <EditVideoModal videoId={videoId} initialTitle={video.title} initialDescription={video.description} initialCategory={video.category || "Amateur"} />
                                )}
                                <div className="flex items-center bg-secondary rounded-full p-1">
                                    <Button variant="ghost" size="sm" className={`rounded-l-full gap-2 ${likeStatus === "like" ? "text-blue-600" : ""}`} onClick={() => handleLike("like")}>
                                        <ThumbsUp className="h-4 w-4" />
                                        {video.likes || 0}
                                    </Button>
                                    <div className="w-px h-6 bg-muted-foreground/20" />
                                    <Button variant="ghost" size="sm" className={`rounded-r-full gap-2 ${likeStatus === "dislike" ? "text-red-600" : ""}`} onClick={() => handleLike("dislike")}>
                                        <ThumbsDown className="h-4 w-4" />
                                        {video.dislikes || 0}
                                    </Button>
                                </div>
                                <Button variant="secondary" size="sm" className="rounded-full gap-2" onClick={handleShare}>
                                    <Share2 className="h-4 w-4" />
                                    Share
                                </Button>
                            </div>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-xl">
                            <div className="flex gap-2 text-sm text-muted-foreground mb-2">
                                <span>{video.views} views</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(video._creationTime)} ago</span>
                            </div>
                            <p className="whitespace-pre-wrap">{video.description}</p>
                        </div>
                    </div>

                    <CommentsSection videoId={videoId} currentUserId={currentUserId} />

                    {/* Banner Ad Below Comments */}
                    <div className="flex justify-center py-4">
                        <AdScript
                            id="banner-below-comments"
                            script='<script type="text/javascript">atOptions = {"key" : "6b0cf0d29e8605091ae3a4bfe3da7a74","format" : "iframe","height" : 90,"width" : 728,"params" : {}};</script><script type="text/javascript" src="//www.topcreativeformat.com/6b0cf0d29e8605091ae3a4bfe3da7a74/invoke.js"></script>'
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Banner Ad Top of Sidebar */}
                    <div className="flex justify-center">
                        <AdScript
                            id="banner-sidebar-top"
                            script='<script type="text/javascript">atOptions = {"key" : "6b0cf0d29e8605091ae3a4bfe3da7a74","format" : "iframe","height" : 90,"width" : 728,"params" : {}};</script><script type="text/javascript" src="//www.topcreativeformat.com/6b0cf0d29e8605091ae3a4bfe3da7a74/invoke.js"></script>'
                        />
                    </div>

                    <h3 className="font-semibold text-lg">More Videos</h3>
                    <div className="space-y-4">
                        {sidebarVideos.map((video, index) => (
                            <div key={video._id}>
                                <VideoCard video={video} author={getAuthor(video.authorId)} />
                                {/* Insert box ad after every 3 videos */}
                                {(index + 1) % 3 === 0 && index < sidebarVideos.length - 1 && (
                                    <div className="my-4">
                                        <AdScript
                                            id={`box-ad-sidebar-${index}`}
                                            script='<script type="text/javascript">atOptions = {"key" : "6b0cf0d29e8605091ae3a4bfe3da7a74","format" : "iframe","height" : 90,"width" : 728,"params" : {}};</script><script type="text/javascript" src="//www.topcreativeformat.com/6b0cf0d29e8605091ae3a4bfe3da7a74/invoke.js"></script>'
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        {sidebarVideos.length === 0 && (
                            <p className="text-muted-foreground text-sm">No more videos available.</p>
                        )}
                    </div>

                    {/* Banner Ad Bottom of Sidebar */}
                    <div className="flex justify-center mt-4">
                        <AdScript
                            id="banner-sidebar-bottom"
                            script='<script async="async" data-cfasync="false" src="//pl28167338.effectivegatecpm.com/74b73373d996a165f6b61daf0f098d07/invoke.js"></script><div id="container-74b73373d996a165f6b61daf0f098d07"></div>'
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function CommentsSection({ videoId, currentUserId }: { videoId: Id<"videos">, currentUserId: Id<"users"> | null }) {
    const [comment, setComment] = useState("");
    const createComment = useMutation(api.comments.createComment);
    const comments = useQuery(api.comments.getComments, { videoId });

    const handleComment = async (text: string, parentId?: Id<"comments">) => {
        if (!currentUserId) {
            toast.error("Please login to comment");
            return;
        }
        try {
            await createComment({ videoId, userId: currentUserId, text, parentId });
            toast.success("Comment posted");
            if (!parentId) setComment("");
        } catch (error) {
            console.error(error);
            toast.error("Failed to post comment");
        }
    };

    const topLevelComments = comments?.filter(c => !c.parentId) || [];
    const getReplies = (parentId: Id<"comments">) => comments?.filter(c => c.parentId === parentId) || [];

    return (
        <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                Comments <span className="text-muted-foreground text-sm">({comments?.length || 0})</span>
            </h3>

            <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <Textarea placeholder="Add a comment..." value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-[80px]" />
                    <div className="flex justify-end">
                        <Button onClick={() => handleComment(comment)} disabled={!comment.trim()}>Comment</Button>
                    </div>
                </div>
            </div>

            <div className="space-y-6 mt-6">
                {topLevelComments.map((comment) => (
                    <CommentItem key={comment._id} comment={comment} replies={getReplies(comment._id)} onReply={handleComment} currentUserId={currentUserId} />
                ))}
            </div>
        </div>
    );
}

function CommentItem({ comment, replies, onReply, currentUserId }: {
    comment: any,
    replies: any[],
    onReply: (text: string, parentId: Id<"comments">) => void,
    currentUserId: Id<"users"> | null
}) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");

    const submitReply = () => {
        onReply(replyText, comment._id);
        setIsReplying(false);
        setReplyText("");
    };

    return (
        <div className="flex gap-4">
            <Avatar className="h-10 w-10">
                <AvatarImage src={comment.user?.image} />
                <AvatarFallback>{comment.user?.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.user?.name || "Unknown User"}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment._creationTime)} ago</span>
                </div>
                <p className="text-sm">{comment.text}</p>

                <div className="flex items-center gap-4 mt-2">
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground" onClick={() => setIsReplying(!isReplying)}>
                        <Reply className="h-3 w-3 mr-1" /> Reply
                    </Button>
                </div>

                {isReplying && (
                    <div className="mt-3 flex gap-3">
                        <div className="flex-1 space-y-2">
                            <Textarea placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="min-h-[60px]" />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
                                <Button size="sm" onClick={submitReply} disabled={!replyText.trim()}>Reply</Button>
                            </div>
                        </div>
                    </div>
                )}

                {replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-4 border-l-2 border-muted">
                        {replies.map((reply) => (
                            <div key={reply._id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={reply.user?.image} />
                                    <AvatarFallback>{reply.user?.name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm">{reply.user?.name || "Unknown User"}</span>
                                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(reply._creationTime)} ago</span>
                                    </div>
                                    <p className="text-sm">{reply.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
