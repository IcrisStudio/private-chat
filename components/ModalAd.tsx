"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdScript } from "@/components/AdScript";

export function ModalAd() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Show modal after 2 seconds
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative bg-background border rounded-lg shadow-2xl max-w-2xl w-full mx-4 p-6">
                {/* Close button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-5 w-5" />
                </Button>

                {/* Ad content */}
                <div className="mt-8">
                    <div className="flex flex-col items-center justify-center min-h-[300px]">
                        <AdScript
                            id="modal-ad"
                            script='<script async="async" data-cfasync="false" src="//pl28167338.effectivegatecpm.com/74b73373d996a165f6b61daf0f098d07/invoke.js"></script><div id="container-74b73373d996a165f6b61daf0f098d07"></div>'
                        />
                    </div>
                </div>

                {/* Close button at bottom */}
                <div className="mt-6 flex justify-center">
                    <Button onClick={() => setIsOpen(false)} variant="secondary">
                        Close Ad
                    </Button>
                </div>
            </div>
        </div>
    );
}
