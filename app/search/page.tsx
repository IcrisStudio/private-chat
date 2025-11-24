"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    const results = useQuery(api.videos.searchVideos, query ? { query } : "skip");
    const authors = useQuery(
        api.users.getUsers,
        results && results.length > 0
            ? { userIds: [...new Set(results.map((v) => v.authorId))] }
            : "skip"
    );

    const getAuthor = (authorId: any) => authors?.find((a) => a._id === authorId);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">
                Search Results for "{query}"
            </h1>

            {results === undefined ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-video bg-muted rounded-xl animate-pulse" />
                            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                        No videos found for "{query}"
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {results.map((video) => (
                        <VideoCard
                            key={video._id}
                            video={video}
                            author={getAuthor(video.authorId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Suspense
                fallback={
                    <div className="container mx-auto px-4 py-8">
                        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-6" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="aspect-video bg-muted rounded-xl animate-pulse" />
                                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                }
            >
                <SearchResults />
            </Suspense>
        </div>
    );
}
