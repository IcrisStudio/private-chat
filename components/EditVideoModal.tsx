"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Settings } from "lucide-react";

interface EditVideoModalProps {
    videoId: Id<"videos">;
    initialTitle: string;
    initialDescription: string;
}

export function EditVideoModal({
    videoId,
    initialTitle,
    initialDescription,
}: EditVideoModalProps) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);

    const updateVideo = useMutation(api.videos.updateVideo);

    const handleUpdate = async () => {
        try {
            await updateVideo({
                videoId,
                title,
                description,
            });

            toast.success("Video updated successfully");
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Edit Video
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Video Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <Button onClick={handleUpdate} className="w-full">
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
