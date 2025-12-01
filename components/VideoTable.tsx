"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Eye, ThumbsUp, Lock, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

// Helper component to fetch and display thumbnail
function ThumbnailImage({ storageId, alt }: { storageId: string; alt: string }) {
    const url = useQuery(api.videos.getThumbnailUrl, { storageId });

    if (!url) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                Loading...
            </div>
        );
    }

    return <img src={url} alt={alt} className="w-full h-full object-cover" />;
}

interface VideoTableProps {
    videos: Doc<"videos">[];
    onDelete: (id: Doc<"videos">["_id"]) => void;
}

export function VideoTable({ videos, onDelete }: VideoTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[400px]">Video</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Likes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {videos.map((video) => (
                        <TableRow key={video._id}>
                            <TableCell>
                                <div className="flex gap-3">
                                    <div className="relative w-32 aspect-video bg-muted rounded-md overflow-hidden flex-shrink-0">
                                        {video.thumbnailStorageId ? (
                                            <ThumbnailImage storageId={video.thumbnailStorageId} alt={video.title} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                                                No Thumbnail
                                            </div>
                                        )}
                                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                                            {/* Duration placeholder */}
                                            00:00
                                        </div>
                                    </div>
                                    <div className="flex flex-col justify-center gap-1">
                                        <p className="font-medium line-clamp-1" title={video.title}>
                                            {video.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-1" title={video.description}>
                                            {video.description}
                                        </p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 text-sm">
                                    {video.isPremium ? (
                                        <>
                                            <Lock className="h-4 w-4 text-yellow-500" />
                                            <span>Premium</span>
                                        </>
                                    ) : (
                                        <>
                                            <Globe className="h-4 w-4 text-green-500" />
                                            <span>Public</span>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {new Date(video._creationTime).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <Eye className="h-3 w-3 text-muted-foreground" />
                                    {video.views}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <ThumbsUp className="h-3 w-3 text-muted-foreground" />
                                    {video.likes || 0}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                    >
                                        <Link href={`/edit/${video._id}`}>
                                            <Edit2 className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(video._id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {videos.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No videos found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
