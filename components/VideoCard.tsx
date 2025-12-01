"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";

interface VideoCardProps {
    video: Doc<"videos">;
    author?: Doc<"users"> | null;
}

export function VideoCard({ video, author }: VideoCardProps) {
    const thumbnailUrl = useQuery(
        api.videos.getThumbnailUrl,
        video.thumbnailStorageId ? { storageId: video.thumbnailStorageId } : "skip"
    );

    return (
        <Link href={`/watch/${video._id}`}>
            <Card className="border-none shadow-none bg-transparent hover:bg-muted/10 transition-colors cursor-pointer group">
                <div className="aspect-video relative rounded-xl overflow-hidden bg-muted">
                    {thumbnailUrl ? (
                        <Image
                            src={thumbnailUrl}
                            alt={video.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                            <span className="text-4xl font-bold opacity-20">▶</span>
                        </div>
                    )}
                </div>
                <CardContent className="p-3 pt-4 flex gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={author?.image} />
                        <AvatarFallback>{author?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                        <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary">
                            {video.title}
                        </h3>
                        {author?.username ? (
                            <Link
                                href={`/channel/${author.username}`}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {author.channelName || author.name}
                            </Link>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {author?.name || "Unknown Author"}
                            </p>
                        )}
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{video.views} views</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(video._creationTime)} ago</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
