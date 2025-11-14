"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Send, Loader2 } from "lucide-react";

interface MediaPreviewProps {
  preview: {
    url: string;
    type: "image" | "video";
    file: File;
  };
  onRemove: () => void;
  onSend: () => void;
  isOneTime: boolean;
  onOneTimeChange: (value: boolean) => void;
  isUploading?: boolean;
}

export default function MediaPreview({
  preview,
  onRemove,
  onSend,
  isOneTime,
  onOneTimeChange,
  isUploading = false,
}: MediaPreviewProps) {
  return (
    <div className="px-4 py-2 bg-muted/50 border-t">
      <div className="flex items-center gap-3">
        <div className="relative">
          {preview.type === "image" ? (
            <img
              src={preview.url}
              alt="Preview"
              className="h-16 w-16 object-cover rounded-lg"
            />
          ) : (
            <video
              src={preview.url}
              className="h-16 w-16 object-cover rounded-lg"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{preview.file.name}</p>
          <label className="flex items-center gap-2 text-xs cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={isOneTime}
              onChange={(e) => onOneTimeChange(e.target.checked)}
            />
            One-time view
          </label>
        </div>
        <Button onClick={onSend} size="sm" className="rounded-full" disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" />
              Send
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
