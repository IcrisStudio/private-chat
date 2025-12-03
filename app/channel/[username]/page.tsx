"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoCard } from "@/components/VideoCard";
import { Upload, Image as ImageIcon, Sparkles, Lock, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { VideoTable } from "@/components/VideoTable";

const CATEGORIES = [
    "Amateur",
    "Professional",
    "Homemade",
    "Couples",
    "Solo Female",
    "Solo Male",
    "Group",
    "Fetish",
    "Roleplay",
    "POV",
    "Other"
];

export default function ChannelPage() {
    const params = useParams();
    const username = params.username as string;

    const [currentUserId, setCurrentUserId] = useState<Id<"users"> | null>(null);

    useEffect(() => {
        const storedId = localStorage.getItem("userId");
        if (storedId) {
            setCurrentUserId(storedId as Id<"users">);
        }
    }, []);

    const channel = useQuery(api.users.getChannel, { username });
    const isOwner = channel && currentUserId === channel._id;

    const isSubscribed = useQuery(api.subscriptions.isSubscribed,
        channel ? { channelId: channel._id, subscriberId: currentUserId || undefined } : "skip"
    );
    const subscribe = useMutation(api.subscriptions.subscribe);

    const stats = useQuery(api.videos.getChannelStats, channel ? { userId: channel._id } : "skip");
    const videos = useQuery(api.videos.getVideosByAuthor, channel ? { authorId: channel._id } : "skip");
    const posts = useQuery(api.posts.getPosts, channel ? { authorId: channel._id } : "skip");

    // Upload Logic (Only for owner)
    const generateUploadUrl = useMutation(api.videos.generateUploadUrl);
    const createVideo = useMutation(api.videos.createVideo);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("General");
    const [file, setFile] = useState<File | null>(null);
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);
    const [isPremium, setIsPremium] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Community Post Logic
    const createPost = useMutation(api.posts.createPost);
    const deletePost = useMutation(api.posts.deletePost);
    const [postText, setPostText] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setGeneratedThumbnails([]);
            setThumbnail(null);
            setThumbnailPreview(null);
            if (videoRef.current) {
                videoRef.current.src = URL.createObjectURL(selectedFile);
            }
        }
    };

    const generateThumbnails = async () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        setIsGeneratingThumbnails(true);
        setGeneratedThumbnails([]);

        const frames: string[] = [];
        const count = 5; // Generate 5 thumbnails

        // Helper to capture frame
        const capture = (time: number): Promise<string> => {
            return new Promise((resolve) => {
                video.currentTime = time;
                video.onseeked = () => {
                    const canvas = document.createElement("canvas");
                    // Force 16:9 HD resolution
                    canvas.width = 1280;
                    canvas.height = 720;
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;

                    // Fill black background
                    ctx.fillStyle = "#000000";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Calculate scaling to fit video within canvas (contain)
                    const scale = Math.min(
                        canvas.width / video.videoWidth,
                        canvas.height / video.videoHeight
                    );

                    const w = video.videoWidth * scale;
                    const h = video.videoHeight * scale;
                    const x = (canvas.width - w) / 2;
                    const y = (canvas.height - h) / 2;

                    ctx.drawImage(video, x, y, w, h);

                    canvas.toBlob((blob) => {
                        if (blob) resolve(URL.createObjectURL(blob));
                    }, "image/jpeg", 0.8);
                };
            });
        };

        try {
            for (let i = 0; i < count; i++) {
                const randomTime = video.duration * (0.1 + Math.random() * 0.8);
                const url = await capture(randomTime);
                frames.push(url);
                // Removed delay for speed
            }
            setGeneratedThumbnails(frames);
            toast.success("Thumbnails generated!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate thumbnails");
        } finally {
            setIsGeneratingThumbnails(false);
            video.currentTime = 0; // Reset
        }
    };

    const selectGeneratedThumbnail = async (url: string) => {
        setThumbnailPreview(url);
        // Convert blob URL to File object
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
        setThumbnail(file);
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !currentUserId || uploading) return;

        setUploading(true);
        setProgress(0);

        // Simulate progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return prev;
                return prev + 10;
            });
        }, 500);

        try {
            // Upload video
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Video upload failed");
            const { storageId } = await result.json();

            // Upload thumbnail if exists
            let thumbnailStorageId: string | undefined;
            if (thumbnail) {
                const thumbUrl = await generateUploadUrl();
                const thumbResult = await fetch(thumbUrl, {
                    method: "POST",
                    headers: { "Content-Type": thumbnail.type },
                    body: thumbnail,
                });
                if (!thumbResult.ok) throw new Error("Thumbnail upload failed");
                const thumbData = await thumbResult.json();
                thumbnailStorageId = thumbData.storageId;
            }

            await createVideo({
                title,
                description,
                storageId,
                authorId: currentUserId,
                size: file.size,
                isPremium,
                thumbnailStorageId,
                category,
            });

            clearInterval(interval);
            setProgress(100);
            toast.success("Video uploaded successfully!");

            // Reset form
            setTitle("");
            setDescription("");
            setCategory("General");
            setFile(null);
            setThumbnail(null);
            setThumbnailPreview(null);
            setGeneratedThumbnails([]);
            setIsPremium(false);
            if (videoRef.current) videoRef.current.src = "";

        } catch (error) {
            console.error(error);
            toast.error("Failed to upload video");
        } finally {
            setUploading(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const handleSubscribe = async () => {
        if (!currentUserId) {
            toast.error("Please login to subscribe");
            return;
        }
        if (!channel) return;

        await subscribe({
            channelId: channel._id,
            subscriberId: currentUserId,
        });
    };

    const handleCreatePost = async () => {
        if (!currentUserId || !postText.trim()) return;
        try {
            await createPost({
                text: postText,
                authorId: currentUserId,
            });
            setPostText("");
            toast.success("Post created!");
        } catch (error) {
            toast.error("Failed to create post");
        }
    };

    const handleDeletePost = async (postId: Id<"posts">) => {
        try {
            await deletePost({ postId });
            toast.success("Post deleted");
        } catch (error) {
            toast.error("Failed to delete post");
        }
    };

    // Placeholder for delete video (needs backend mutation)
    const handleDeleteVideo = (videoId: Id<"videos">) => {
        toast.info("Delete functionality coming soon");
    };

    if (channel === undefined) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
    if (channel === null) return <div className="min-h-screen bg-background flex items-center justify-center">Channel not found</div>;

    const premiumVideos = videos?.filter(v => v.isPremium) || [];
    const publicVideos = videos?.filter(v => !v.isPremium) || [];

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Channel Header */}
            <div className="bg-muted/30 border-b">
                <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background">
                        <AvatarImage src={channel.image} />
                        <AvatarFallback className="text-4xl">{channel.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h1 className="text-3xl font-bold">{channel.channelName || channel.name}</h1>
                        <p className="text-muted-foreground">@{channel.username}</p>
                        <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                            <span>{channel.subscriberCount || 0} subscribers</span>
                            <span>{stats?.totalVideos || 0} videos</span>
                            <span>{stats?.totalViews || 0} views</span>
                        </div>
                    </div>
                    <div>
                        {!isOwner && (
                            <Button
                                size="lg"
                                variant={isSubscribed ? "secondary" : "default"}
                                onClick={handleSubscribe}
                            >
                                {isSubscribed ? "Subscribed" : "Subscribe"}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <Tabs defaultValue="videos">
                    <TabsList>
                        <TabsTrigger value="videos">Videos</TabsTrigger>
                        <TabsTrigger value="premium">Premium</TabsTrigger>
                        <TabsTrigger value="community">Community</TabsTrigger>
                        {isOwner && <TabsTrigger value="upload">Upload</TabsTrigger>}
                        {isOwner && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
                        <TabsTrigger value="about">About</TabsTrigger>
                    </TabsList>

                    <TabsContent value="videos" className="mt-6">
                        {isOwner ? (
                            <VideoTable videos={publicVideos} onDelete={handleDeleteVideo} />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                                {publicVideos.map((video) => (
                                    <VideoCard key={video._id} video={video} />
                                ))}
                                {publicVideos.length === 0 && (
                                    <p className="col-span-full text-center py-10 text-muted-foreground">No videos yet.</p>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="premium" className="mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                            {premiumVideos.map((video) => (
                                <VideoCard key={video._id} video={video} />
                            ))}
                            {premiumVideos.length === 0 && (
                                <p className="col-span-full text-center py-10 text-muted-foreground">No premium videos yet.</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="community" className="mt-6 space-y-6">
                        {isOwner && (
                            <Card>
                                <CardContent className="pt-6 space-y-4">
                                    <Textarea
                                        placeholder="Post an update to your fans..."
                                        value={postText}
                                        onChange={(e) => setPostText(e.target.value)}
                                    />
                                    <div className="flex justify-end">
                                        <Button onClick={handleCreatePost} disabled={!postText.trim()}>Post</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-4">
                            {posts?.map((post) => (
                                <Card key={post._id}>
                                    <CardContent className="pt-6 flex gap-4">
                                        <Avatar>
                                            <AvatarImage src={channel.image} />
                                            <AvatarFallback>{channel.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold">{channel.channelName || channel.name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(post._creationTime)} ago</p>
                                                </div>
                                                {isOwner && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeletePost(post._id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="whitespace-pre-wrap">{post.text}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {posts?.length === 0 && (
                                <p className="text-center py-10 text-muted-foreground">No posts yet.</p>
                            )}
                        </div>
                    </TabsContent>

                    {isOwner && (
                        <TabsContent value="upload" className="mt-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Left Column: Inputs */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Video Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Title</Label>
                                            <Input
                                                id="title"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Video title"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="desc">Description</Label>
                                            <Textarea
                                                id="desc"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Video description"
                                                className="min-h-[120px]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category</Label>
                                            <select
                                                id="category"
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {CATEGORIES.map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="premium"
                                                checked={isPremium}
                                                onChange={(e) => setIsPremium(e.target.checked)}
                                                className="h-4 w-4"
                                            />
                                            <Label htmlFor="premium" className="flex items-center gap-2 cursor-pointer">
                                                <Lock className="h-4 w-4 text-yellow-500" />
                                                Premium Content (Subscribers Only)
                                            </Label>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Right Column: Media */}
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Media</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Video File</Label>
                                                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                                    <Input
                                                        type="file"
                                                        accept="video/*"
                                                        onChange={handleFileChange}
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                    />
                                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                    <p className="text-sm font-medium">{file ? file.name : "Drag & drop or click to upload"}</p>
                                                </div>
                                            </div>

                                            {/* Hidden Video for Thumbnail Generation */}
                                            <video ref={videoRef} className="hidden" crossOrigin="anonymous" />

                                            {file && (
                                                <div className="space-y-4">
                                                    <Label>Thumbnail</Label>

                                                    {/* Generated Thumbnails Grid */}
                                                    {generatedThumbnails.length > 0 && (
                                                        <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                            {generatedThumbnails.map((url, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className={`relative aspect-video rounded-md overflow-hidden cursor-pointer border-2 transition-all ${thumbnailPreview === url ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/50'}`}
                                                                    onClick={() => selectGeneratedThumbnail(url)}
                                                                >
                                                                    <img src={url} alt={`Generated ${idx}`} className="w-full h-full object-cover" />
                                                                    {thumbnailPreview === url && (
                                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                            <CheckCircle2 className="text-white h-8 w-8 drop-shadow-md" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Actions */}
                                                    {generatedThumbnails.length === 0 && (
                                                        <div className="flex gap-4 items-center">
                                                            <div className="w-32 aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center border">
                                                                {thumbnailPreview ? (
                                                                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Button size="sm" variant="outline" onClick={() => document.getElementById("thumb-upload")?.click()}>
                                                                    Upload Custom
                                                                </Button>
                                                                <Input
                                                                    id="thumb-upload"
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const f = e.target.files?.[0];
                                                                        if (f) {
                                                                            setThumbnail(f);
                                                                            setThumbnailPreview(URL.createObjectURL(f));
                                                                        }
                                                                    }}
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    onClick={generateThumbnails}
                                                                    disabled={isGeneratingThumbnails}
                                                                >
                                                                    {isGeneratingThumbnails ? (
                                                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                                    ) : (
                                                                        <Sparkles className="h-3 w-3 mr-2" />
                                                                    )}
                                                                    Generate from Video
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {uploading && (
                                        <Card>
                                            <CardContent className="pt-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>Uploading...</span>
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-500 ease-out"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Button
                                        size="lg"
                                        className="w-full relative overflow-hidden"
                                        onClick={handleUpload}
                                        disabled={uploading || !file}
                                    >
                                        {uploading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Publishing...
                                            </div>
                                        ) : (
                                            "Publish Video"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    )}

                    {isOwner && (
                        <TabsContent value="analytics" className="mt-6">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{channel.subscriberCount || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats?.totalVideos || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {stats?.totalStorageSize ? (stats.totalStorageSize / (1024 * 1024)).toFixed(2) + " MB" : "0 MB"}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="col-span-full md:col-span-2">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Average View Duration</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">4m 32s</div>
                                        <p className="text-xs text-muted-foreground">+12% from last month</p>
                                    </CardContent>
                                </Card>
                                <Card className="col-span-full md:col-span-2">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Estimated Revenue</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">${((stats?.totalViews || 0) * 0.01).toFixed(2)}</div>
                                        <p className="text-xs text-muted-foreground">Based on views ($0.01 CPM)</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    )}

                    <TabsContent value="about" className="mt-6">
                        <Card>
                            <CardContent className="pt-6">
                                <p>Joined {new Date(channel._creationTime).toLocaleDateString()}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
