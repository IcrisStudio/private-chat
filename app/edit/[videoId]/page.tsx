"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Eye, ThumbsUp, Calendar } from "lucide-react";

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

export default function EditVideoPage() {
    const params = useParams();
    const router = useRouter();
    const videoId = params.videoId as Id<"videos">;

    const [currentUserId, setCurrentUserId] = useState<Id<"users"> | null>(null);
    const video = useQuery(api.videos.getVideo, { id: videoId });
    const videoUrl = useQuery(api.videos.getVideoUrl, video ? { storageId: video.storageId } : "skip");
    const thumbnailUrl = useQuery(api.videos.getThumbnailUrl, video?.thumbnailStorageId ? { storageId: video.thumbnailStorageId } : "skip");

    const updateVideo = useMutation(api.videos.updateVideo);
    const generateUploadUrl = useMutation(api.videos.generateUploadUrl);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Amateur");
    const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);
    const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const storedId = localStorage.getItem("userId");
        if (storedId) {
            setCurrentUserId(storedId as Id<"users">);
        }
    }, []);

    useEffect(() => {
        if (video) {
            setTitle(video.title);
            setDescription(video.description);
            setCategory(video.category || "Amateur");
        }
    }, [video]);

    const generateThumbnails = async () => {
        if (!videoRef.current) return;
        const videoEl = videoRef.current;
        setIsGenerating(true);
        setGeneratedThumbnails([]);

        const frames: string[] = [];
        const count = 5;

        const capture = (time: number): Promise<string> => {
            return new Promise((resolve) => {
                videoEl.currentTime = time;
                videoEl.onseeked = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = videoEl.videoWidth;
                    canvas.height = videoEl.videoHeight;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(URL.createObjectURL(blob));
                    }, "image/jpeg");
                };
            });
        };

        try {
            for (let i = 0; i < count; i++) {
                const randomTime = videoEl.duration * (0.1 + Math.random() * 0.8);
                const url = await capture(randomTime);
                frames.push(url);
                await new Promise(r => setTimeout(r, 100));
            }
            setGeneratedThumbnails(frames);
            toast.success("Thumbnails generated!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate thumbnails");
        } finally {
            setIsGenerating(false);
            videoEl.currentTime = 0;
        }
    };

    const handleSave = async () => {
        if (!video) return;
        setIsSaving(true);

        try {
            let thumbnailStorageId = video.thumbnailStorageId;

            // Upload new thumbnail if selected
            if (selectedThumbnail) {
                const response = await fetch(selectedThumbnail);
                const blob = await response.blob();
                const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });

                const uploadUrl = await generateUploadUrl();
                const uploadResult = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                const { storageId } = await uploadResult.json();
                thumbnailStorageId = storageId;
            }

            await updateVideo({
                videoId: video._id,
                title,
                description,
                category,
                thumbnailStorageId,
            });

            toast.success("Video updated successfully!");
            router.push(`/watch/${video._id}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update video");
        } finally {
            setIsSaving(false);
        }
    };

    if (!video) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (currentUserId !== video.authorId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p>You don't have permission to edit this video.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Edit Video</h1>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left: Video Player & Stats */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Video Preview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {videoUrl && (
                                    <video
                                        ref={videoRef}
                                        src={videoUrl}
                                        controls
                                        className="w-full aspect-video rounded-lg bg-black"
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Video Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span>{video.views} views</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                                    <span>{video.likes || 0} likes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>Uploaded {new Date(video._creationTime).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Edit Form */}
                    <div className="space-y-6">
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
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
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
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Thumbnail</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {thumbnailUrl && !generatedThumbnails.length && (
                                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                                        <img src={thumbnailUrl} alt="Current thumbnail" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                {generatedThumbnails.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {generatedThumbnails.map((url, idx) => (
                                            <div
                                                key={idx}
                                                className={`relative aspect-video rounded-md overflow-hidden cursor-pointer border-2 transition-all ${selectedThumbnail === url ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-muted-foreground/50'}`}
                                                onClick={() => setSelectedThumbnail(url)}
                                            >
                                                <img src={url} alt={`Generated ${idx}`} className="w-full h-full object-cover" />
                                                {selectedThumbnail === url && (
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                        <CheckCircle2 className="text-white h-8 w-8 drop-shadow-md" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    onClick={generateThumbnails}
                                    disabled={isGenerating}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate New Thumbnails"
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => router.back()}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
