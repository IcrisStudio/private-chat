"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Id } from "@/convex/_generated/dataModel";

export default function CreateChannelPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<Id<"users"> | null>(null);
    const createChannel = useMutation(api.users.createChannel);

    const [username, setUsername] = useState("");
    const [channelName, setChannelName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedId = localStorage.getItem("userId");
        if (!storedId) {
            router.push("/login");
        } else {
            setUserId(storedId as Id<"users">);
        }
    }, [router]);

    const handleCreateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setLoading(true);
        try {
            await createChannel({
                userId,
                username,
                channelName,
            });
            toast.success("Channel created successfully!");
            router.push(`/channel/${username}`);
            // Force reload to update Navbar state
            setTimeout(() => window.location.reload(), 100);
        } catch (error: any) {
            console.error(error);
            if (error.message.includes("Username already taken")) {
                toast.error("Username is already taken");
            } else {
                toast.error("Failed to create channel");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!userId) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto flex items-center justify-center py-20 px-4">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle>Create Your Channel</CardTitle>
                        <CardDescription>Start your journey as a creator on VideoPlatform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateChannel} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="channelName">Channel Name</Label>
                                <Input
                                    id="channelName"
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value)}
                                    placeholder="e.g. Tech Reviews"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Channel Handle (Username)</Label>
                                <div className="flex items-center">
                                    <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-muted-foreground">@</span>
                                    <Input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                        placeholder="techreviews"
                                        className="rounded-l-none"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and underscores.</p>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? "Creating Channel..." : "Create Channel"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
