"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AdScript } from "@/components/AdScript";
import { ModalAd } from "@/components/ModalAd";

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

    // Function to render search results with ads
    const renderResultsWithAds = () => {
        if (!results) return null;

        const elements: JSX.Element[] = [];
        const videosBeforeAd = 8; // Show ad after every 8 videos

        results.forEach((video, index) => {
            elements.push(
                <VideoCard
                    key={video._id}
                    video={video}
                    author={getAuthor(video.authorId)}
                />
            );

            // Insert ad after every 8 videos
            if ((index + 1) % videosBeforeAd === 0 && index < results.length - 1) {
                elements.push(
                    <div key={`ad-${index}`} className="col-span-full flex justify-center my-6">
                        <AdScript
                            id={`box-ad-search-${index}`}
                            script='<script type="text/javascript">atOptions = {"key" : "6b0cf0d29e8605091ae3a4bfe3da7a74","format" : "iframe","height" : 90,"width" : 728,"params" : {}};</script><script type="text/javascript" src="//www.topcreativeformat.com/6b0cf0d29e8605091ae3a4bfe3da7a74/invoke.js"></script>'
                        />
                    </div>
                );
            }
        });

        return elements;
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Top Banner Ad */}
            <div className="flex justify-center">
                <AdScript
                    id="banner-top-search"
                    script='<script type="text/javascript">atOptions = {"key" : "6b0cf0d29e8605091ae3a4bfe3da7a74","format" : "iframe","height" : 90,"width" : 728,"params" : {}};</script><script type="text/javascript" src="//www.topcreativeformat.com/6b0cf0d29e8605091ae3a4bfe3da7a74/invoke.js"></script>'
                />
            </div>

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
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {renderResultsWithAds()}
                    </div>

                    {/* Bottom Banner Ad */}
                    <div className="flex justify-center mt-8">
                        <AdScript
                            id="banner-bottom-search"
                            script='<script async="async" data-cfasync="false" src="//pl28167338.effectivegatecpm.com/74b73373d996a165f6b61daf0f098d07/invoke.js"></script><div id="container-74b73373d996a165f6b61daf0f098d07"></div>'
                        />
                    </div>
                </>
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
