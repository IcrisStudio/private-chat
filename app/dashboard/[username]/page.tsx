"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Eye,
    Users,
    Video,
    DollarSign,
    TrendingUp,
    Trash2,
    MessageSquare,
    Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function DashboardPage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const [currentUserId, setCurrentUserId] = useState<Id<"users"> | null>(null);
    const [channelName, setChannelName] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const [activeTab, setActiveTab] = useState("overview");


    const [isSaving, setIsSaving] = useState(false);

    const channel = useQuery(api.users.getChannel, { username });
    const analytics = useQuery(api.analytics.getChannelAnalytics,
        channel ? { channelId: channel._id } : "skip"
    );
    const allComments = useQuery(api.analytics.getAllChannelComments,
        channel ? { channelId: channel._id } : "skip"
    );

    const updateChannelInfo = useMutation(api.analytics.updateChannelInfo);
    const deleteVideo = useMutation(api.videos.deleteVideo);

    useEffect(() => {
        const storedId = localStorage.getItem("userId");
        if (storedId) setCurrentUserId(storedId as Id<"users">);
    }, []);

    useEffect(() => {
        if (channel) {
            setChannelName(channel.channelName || "");
            setNewUsername(channel.username || "");
        }
    }, [channel]);

    // Check if user owns this channel
    if (channel && currentUserId && channel._id !== currentUserId) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <p className="text-muted-foreground mb-4">You don't have permission to access this dashboard.</p>
                    <Button onClick={() => router.push("/")}>Go Home</Button>
                </div>
            </div>
        );
    }

    if (!channel || !analytics) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div>Loading dashboard...</div>
            </div>
        );
    }

    const handleSaveChannelInfo = async () => {
        if (!channel) return;
        setIsSaving(true);
        try {
            await updateChannelInfo({
                channelId: channel._id,
                channelName: channelName !== channel.channelName ? channelName : undefined,
                username: newUsername !== channel.username ? newUsername : undefined,
            });
            toast.success("Channel information updated!");
            if (newUsername !== channel.username) {
                router.push(`/dashboard/${newUsername}`);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update channel");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteVideo = async (videoId: Id<"videos">) => {
        if (!confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
            return;
        }
        try {
            await deleteVideo({ videoId });
            toast.success("Video deleted successfully");
        } catch (error) {
            toast.error("Failed to delete video");
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case "overview":
                return (
                    <section className="animate-in fade-in duration-500">
                        <h1 className="text-3xl font-bold mb-6">Channel Overview</h1>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.subscriberCount.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                                    <Video className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{analytics.totalVideos}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">$0.01 per 1000 views</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Videos Preview */}
                        <h2 className="text-xl font-bold mb-4">Recent Videos</h2>
                        <div className="space-y-4">
                            {analytics.videos.slice(0, 3).map((video) => (
                                <div key={video._id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                    <div className="flex-1">
                                        <p className="font-semibold">{video.title}</p>
                                        <p className="text-sm text-muted-foreground">{video.views.toLocaleString()} views • {formatDistanceToNow(new Date(video._creationTime))} ago</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-green-600">${video.revenue.toFixed(4)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );
            case "settings":
                return (
                    <section className="animate-in fade-in duration-500">
                        <h2 className="text-2xl font-bold mb-6">Channel Settings</h2>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4 max-w-2xl">
                                    <div className="space-y-2">
                                        <Label htmlFor="channelName">Channel Name</Label>
                                        <Input
                                            id="channelName"
                                            value={channelName}
                                            onChange={(e) => setChannelName(e.target.value)}
                                            placeholder="Enter channel name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Handle / Username</Label>
                                        <div className="flex gap-2">
                                            <span className="flex items-center text-muted-foreground">@</span>
                                            <Input
                                                id="username"
                                                value={newUsername}
                                                onChange={(e) => setNewUsername(e.target.value)}
                                                placeholder="Enter username"
                                            />
                                        </div>
                                    </div>
                                    <Button onClick={handleSaveChannelInfo} disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                );
            case "videos":
                return (
                    <section className="animate-in fade-in duration-500">
                        <h2 className="text-2xl font-bold mb-6">Your Videos</h2>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    {analytics.videos.map((video) => (
                                        <div key={video._id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex-1">
                                                <Link href={`/watch/${video._id}`} className="font-semibold hover:underline">
                                                    {video.title}
                                                </Link>
                                                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                                    <span>{video.views.toLocaleString()} views</span>
                                                    <span>{video.likes} likes</span>
                                                    <span>${video.revenue.toFixed(4)} earned</span>
                                                    <span>{formatDistanceToNow(new Date(video._creationTime))} ago</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/edit/${video._id}`}>Edit</Link>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteVideo(video._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {analytics.videos.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">No videos uploaded yet.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                );
            case "comments":
                return (
                    <section className="animate-in fade-in duration-500">
                        <h2 className="text-2xl font-bold mb-6">All Comments</h2>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    {allComments?.slice(0, 20).map((comment) => (
                                        <div key={comment._id} className="border-b pb-4 last:border-0">
                                            <div className="flex items-start gap-3">
                                                <MessageSquare className="h-5 w-5 text-muted-foreground mt-1" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-sm">{comment.user?.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            on "{comment.videoTitle}"
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(comment._creationTime))} ago
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{comment.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {allComments?.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">No comments yet.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                );
            case "analytics":
                return (
                    <section className="animate-in fade-in duration-500">
                        <h2 className="text-2xl font-bold mb-6">Channel Analytics</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="text-muted-foreground">Total Views</span>
                                            <span className="font-bold text-lg">{analytics.totalViews.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="text-muted-foreground">Total Likes</span>
                                            <span className="font-bold text-lg">{analytics.totalLikes.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="text-muted-foreground">Avg. Views per Video</span>
                                            <span className="font-bold text-lg">
                                                {analytics.totalVideos > 0
                                                    ? Math.round(analytics.totalViews / analytics.totalVideos).toLocaleString()
                                                    : 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Engagement Rate</span>
                                            <span className="font-bold text-lg">
                                                {analytics.totalViews > 0
                                                    ? ((analytics.totalLikes / analytics.totalViews) * 100).toFixed(1)
                                                    : 0}%
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Storage Usage</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center py-6">
                                        <div className="text-4xl font-bold mb-2">
                                            {(analytics.totalStorageSize / (1024 * 1024)).toFixed(2)} MB
                                        </div>
                                        <p className="text-muted-foreground">Total content size</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                );
            case "revenue":
                return (
                    <section className="animate-in fade-in duration-500">
                        <h2 className="text-2xl font-bold mb-6">Revenue & Earnings</h2>

                        {/* Earnings Summary Card */}
                        <Card className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                            <CardContent className="pt-6">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="text-center md:text-left">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Earnings</p>
                                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                                            ${analytics.totalRevenue.toFixed(6)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            💰 You're making money!
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Total Views</p>
                                        <p className="text-3xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            👁️ Across all videos
                                        </p>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Earnings Rate</p>
                                        <p className="text-2xl font-bold">$0.10</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            per 1,000 views
                                        </p>
                                    </div>
                                </div>

                                {/* Earnings Calculator */}
                                <div className="mt-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        How You're Earning
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Your total views:</span>
                                            <span className="font-semibold">{analytics.totalViews.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Views per thousand:</span>
                                            <span className="font-semibold">{(analytics.totalViews / 1000).toFixed(3)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Rate per 1k views:</span>
                                            <span className="font-semibold">× $0.10</span>
                                        </div>
                                        <div className="border-t pt-2 mt-2 flex justify-between">
                                            <span className="font-semibold">Total Earnings:</span>
                                            <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                                                ${analytics.totalRevenue.toFixed(6)}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground mt-3 italic">
                                        Keep creating! Every 1,000 views = $0.10 in your pocket 💵
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Earning Videos */}
                        <Card>
                            <CardContent className="pt-6">
                                <h4 className="font-semibold mb-4 text-lg">Top Earning Videos</h4>
                                <div className="space-y-3">
                                    {analytics.videos
                                        .sort((a, b) => b.revenue - a.revenue)
                                        .slice(0, 10)
                                        .map((video, index) => (
                                            <div key={video._id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Link href={`/watch/${video._id}`} className="font-medium hover:underline block truncate">
                                                        {video.title}
                                                    </Link>
                                                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                                        <span>👁️ {video.views.toLocaleString()} views</span>
                                                        <span>💰 ${video.revenue.toFixed(6)}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="font-bold text-green-600 dark:text-green-400">
                                                        ${video.revenue.toFixed(6)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        earned
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    {analytics.videos.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">
                                            Upload videos to start earning! 🚀
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex">
                <DashboardSidebar
                    username={username}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                <main className="flex-1 p-6 lg:p-8 lg:ml-64">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
