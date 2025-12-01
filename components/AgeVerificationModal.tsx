"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function AgeVerificationModal() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const verified = localStorage.getItem("age_verified");
        if (!verified) {
            setOpen(true);
        }
    }, []);

    const handleVerify = () => {
        localStorage.setItem("age_verified", "true");
        setOpen(false);
    };

    const handleExit = () => {
        window.location.href = "https://www.google.com";
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl">Adult Content Warning</DialogTitle>
                    <DialogDescription className="text-center space-y-4 pt-4">
                        <p className="text-base">
                            This website contains age-restricted content intended for adults only.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            By entering this site, you confirm that you are at least 18 years old (or the age of majority in your jurisdiction) and agree to view adult content.
                        </p>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 mt-6">
                    <Button
                        onClick={handleVerify}
                        size="lg"
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        I am 18 or older - Enter
                    </Button>
                    <Button
                        onClick={handleExit}
                        variant="outline"
                        size="lg"
                        className="w-full"
                    >
                        Exit
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
