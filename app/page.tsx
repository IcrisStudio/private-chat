"use client";

import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdBanner } from "@/components/AdBanner";

export default function Home() {
    const videos = useQuery(api.videos.getVideos);
    const trendingVideos = useQuery(api.videos.getTrendingVideos);

    // Fetch authors for all videos
    const allVideos = [...(trendingVideos || []), ...(videos || [])];
    const uniqueAuthorIds = [...new Set(allVideos.map(v => v.authorId))];
    const authors = useQuery(api.users.getUsers, uniqueAuthorIds.length > 0 ? { userIds: uniqueAuthorIds } : "skip");

    const getAuthor = (authorId: any) => authors?.find(a => a._id === authorId);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8 space-y-10">

                <AdBanner type="banner_728x90" className="w-full h-[100px]" />

                {/* Trending Section */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="text-red-600">🔥</span> Trending
                    </h2>
                    {trendingVideos === undefined ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="aspect-video bg-muted rounded-xl animate-pulse" />
                                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {trendingVideos.map((video) => (
                                <VideoCard key={video._id} video={video} author={getAuthor(video.authorId)} />
                            ))}
                        </div>
                    )}
                </section>

                {/* All Videos Section */}
                <section>
                    <h2 className="text-2xl font-bold mb-6">All Videos</h2>
                    {videos === undefined ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="aspect-video bg-muted rounded-xl animate-pulse" />
                                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {videos.map((video) => (
                                <VideoCard key={video._id} video={video} author={getAuthor(video.authorId)} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
