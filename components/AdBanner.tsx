"use client";

import ads from "@/lib/ads.json";
import { useEffect, useState } from "react";

interface AdBannerProps {
    type: keyof typeof ads;
    className?: string;
}

export function AdBanner({ type, className }: AdBannerProps) {
    const [adUrl, setAdUrl] = useState<string>("");

    useEffect(() => {
        setAdUrl(ads[type]);
    }, [type]);

    if (!adUrl) return null;

    return (
        <div className={`bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center overflow-hidden ${className}`}>
            {/* In a real scenario, this would be an iframe or script tag provided by Adsterra */}
            <div className="text-center p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Advertisement</p>
                <div className="w-full h-full min-h-[90px] flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
                    Ad Space ({type})
                </div>
            </div>
        </div>
    );
}
