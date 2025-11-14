"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X, Loader2 } from "lucide-react";

interface OneTimeMediaViewerProps {
  url: string;
  type: "image" | "video";
  messageId: Id<"messages">;
  onView?: (url: string) => void;
  onClose?: () => void;
  autoShow?: boolean;
}

export default function OneTimeMediaViewer({
  url,
  type,
  messageId,
  onView,
  onClose,
  autoShow = false,
}: OneTimeMediaViewerProps) {
  const [showViewer, setShowViewer] = useState(autoShow);
  const [viewed, setViewed] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const markAsViewed = useMutation(api.chats.markAsSeen);
  
  // Get userId from localStorage
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-play video if it's a video (with a small delay to ensure ref is set)
    if (showViewer && type === "video" && !isDisabled) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    }
  }, [showViewer, type, isDisabled]);

  // Mark as viewed when disabled (at 10% loading)
  useEffect(() => {
    if (isDisabled && !viewed && userId) {
      // Mark as viewed when disabled
      markAsViewed({
        messageId,
        userId: userId as Id<"users">,
      }).catch(console.error);
      setViewed(true);
      
      // Store in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(`viewed-${messageId}`, "true");
      }
    }
  }, [isDisabled, viewed, messageId, userId, markAsViewed]);

  const handlePlay = () => {
    if (viewed || isDisabled) return; // Prevent clicking if already viewed or disabled
    
    setIsLoading(true);
    setLoadingProgress(0);
    setShowViewer(true);
    setCountdown(10);
    
    if (onView) {
      onView(url);
    }
    
    // Start loading progress simulation
    loadingTimerRef.current = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = prev + 2; // Increase by 2% every 100ms (reaches 10% in ~500ms)
        if (newProgress >= 10) {
          // Disable at 10%
          setIsDisabled(true);
          setIsLoading(false);
          if (loadingTimerRef.current) {
            clearInterval(loadingTimerRef.current);
          }
          return 10;
        }
        return newProgress;
      });
    }, 100);

    // Start countdown timer when button is clicked
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleClose = () => {
    setShowViewer(false);
    setIsLoading(false);
    setLoadingProgress(0);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    if (loadingTimerRef.current) {
      clearInterval(loadingTimerRef.current);
    }
    if (onClose) {
      onClose();
    }
  };

  if (showViewer) {
    return (
      <Dialog open={showViewer} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
            
            {countdown > 0 && (
              <div className="absolute top-4 left-4 z-50 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                {countdown}s
              </div>
            )}

            {/* Loading Progress Bar */}
            {isLoading && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-64">
                <div className="bg-black/80 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                    <span className="text-white text-sm font-medium">Loading...</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-100"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <span className="text-white text-xs mt-1 block text-center">{loadingProgress}%</span>
                </div>
              </div>
            )}

            {/* Disabled overlay */}
            {isDisabled && (
              <div className="absolute inset-0 bg-black/90 z-40 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white text-lg font-medium mb-2">Media Disabled</p>
                  <p className="text-white/70 text-sm">
                    This one-time view has been disabled
                  </p>
                </div>
              </div>
            )}

            {/* Media content */}
            {!isDisabled && (
              <>
                {type === "image" ? (
                  <img
                    src={url}
                    alt="One-time view"
                    className="w-full h-auto max-h-[80vh] object-contain"
                    style={{ opacity: isLoading ? 0.3 : 1 }}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={url}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[80vh]"
                    style={{ opacity: isLoading ? 0.3 : 1 }}
                    onEnded={() => {
                      // Video ended, close after a moment
                      setTimeout(() => handleClose(), 1000);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (viewed || (messageId && typeof window !== "undefined")) {
    // Check if already viewed in localStorage
    const viewedKey = `viewed-${messageId}`;
    const wasViewed = typeof window !== "undefined" && localStorage.getItem(viewedKey);
    
    if (viewed || wasViewed) {
      if (typeof window !== "undefined" && !wasViewed) {
        localStorage.setItem(viewedKey, "true");
      }
      return (
        <div className="p-4 border rounded-lg bg-muted/50 text-center">
          <p className="text-sm font-medium text-muted-foreground">Expired</p>
          <p className="text-xs text-muted-foreground mt-1">
            This one-time view message has expired
          </p>
        </div>
      );
    }
  }

  return (
    <div 
      className="relative p-4 border rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
      onClick={handlePlay}
      style={{ 
        cursor: viewed || isDisabled ? 'not-allowed' : isLoading ? 'wait' : 'pointer' 
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {viewed || isDisabled ? (
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Expired</p>
            <p className="text-xs text-muted-foreground mt-1">
              This message has been viewed
            </p>
          </div>
        ) : (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            size="lg"
            className="rounded-full pointer-events-auto"
            disabled={viewed || isLoading || isDisabled}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 mr-2 animate-spin" />
            ) : (
              <Play className="h-6 w-6 mr-2" />
            )}
            {type === "video" ? "Play Video" : "View Image"}
          </Button>
        )}
      </div>
      <div className={`opacity-30 ${viewed ? 'grayscale' : ''}`}>
        {type === "image" ? (
          <img
            src={url}
            alt="One-time view (blurred)"
            className="w-full h-48 object-cover rounded blur-sm pointer-events-none"
          />
        ) : (
          <video
            src={url}
            className="w-full h-48 object-cover rounded blur-sm pointer-events-none"
            muted
          />
        )}
      </div>
      {!viewed && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          One-time view • Click to view for 10 seconds
        </p>
      )}
    </div>
  );
}

