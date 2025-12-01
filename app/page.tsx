"use client";

import { Navbar } from "@/components/Navbar";
import { VideoCard } from "@/components/VideoCard";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdScript } from "@/components/AdScript";

const CATEGORIES = [
    "Trending",
    "All",
    "Amateur",
    "Professional",
    "Homemade",
    "Couples",
    "Solo Female",
    "Solo Male",
    "Group",
    "Fetish",
    "Roleplay",
    "POV"
];

export default function Home() {
    const [selectedCategory, setSelectedCategory] = useState("Trending");

    const videos = useQuery(api.videos.getVideos, {
        category: selectedCategory === "Trending" ? "Trending" : (selectedCategory === "All" ? undefined : selectedCategory)
    });

    // Extract author IDs to fetch user details
    const uniqueAuthorIds = videos ? [...new Set(videos.map(v => v.authorId))] : [];
    const authors = useQuery(api.users.getUsers, uniqueAuthorIds.length > 0 ? { userIds: uniqueAuthorIds } : "skip");

    const getAuthor = (authorId: any) => authors?.find(a => a._id === authorId);

    // Function to render videos with ads inserted dynamically
    const renderVideosWithAds = () => {
        if (!videos) return null;

        const elements = [];
        const videosPerRow = 4; // xl:grid-cols-4
        const rowsBeforeAd = 2; // Show ad after every 2 rows
        const videosBeforeAd = videosPerRow * rowsBeforeAd; // 8 videos

        videos.forEach((video, index) => {
            elements.push(
                <VideoCard key={video._id} video={video} author={getAuthor(video.authorId)} />
            );

            // Insert ad after every 8 videos (2 rows)
            if ((index + 1) % videosBeforeAd === 0 && index < videos.length - 1) {
                elements.push(
                    <div key={`ad-${index}`} className="col-span-full flex justify-center my-6">
                        <AdScript
                            id={`box-ad-${index}`}
                            script='<script type="text/javascript">atOptions = {"key" : "6b0cf0d29e8605091ae3a4bfe3da7a74","format" : "iframe","height" : 90,"width" : 728,"params" : {}};</script><script type="text/javascript" src="//www.topcreativeformat.com/6b0cf0d29e8605091ae3a4bfe3da7a74/invoke.js"></script>'
                        />
                    </div>
                );
            }
        });

        return elements;
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            {/* Category Bar */}
            <div className="sticky top-[65px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b w-full overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 px-4 py-3 min-w-max">
                    {CATEGORIES.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "secondary"}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                            className={cn(
                                "rounded-lg transition-all",
                                selectedCategory === category ? "bg-primary text-primary-foreground" : "hover:bg-muted-foreground/20"
                            )}
                        >
                            {category === "Trending" && <span className="mr-1">🔥</span>}
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Top Banner Ad */}
                <div className="flex justify-center">
                    <AdScript
                        id="banner-top-home"
                        script='<script type="text/javascript">atOptions = {"key" : "6b0cf0d29e8605091ae3a4bfe3da7a74","format" : "iframe","height" : 90,"width" : 728,"params" : {}};</script><script type="text/javascript" src="//www.topcreativeformat.com/6b0cf0d29e8605091ae3a4bfe3da7a74/invoke.js"></script>'
                    />
                </div>

                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        {selectedCategory === "Trending" ? (
                            <>
                                <span className="text-red-600">🔥</span> Trending Videos
                            </>
                        ) : (
                            `${selectedCategory} Videos`
                        )}
                    </h2>

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
                    ) : videos.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-muted-foreground text-lg">No videos found in this category.</p>
                            <Button variant="link" onClick={() => setSelectedCategory("All")}>
                                View all videos
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {renderVideosWithAds()}
                            </div>

                            {/* Bottom Ad */}
                            <div className="flex justify-center mt-8">
                                <AdScript
                                    id="banner-bottom-home"
                                    script='<script async="async" data-cfasync="false" src="//pl28167338.effectivegatecpm.com/74b73373d996a165f6b61daf0f098d07/invoke.js"></script><div id="container-74b73373d996a165f6b61daf0f098d07"></div>'
                                />
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
