"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
}

export default function AudioRecorder({
  onRecordingComplete,
  onCancel,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const [waveAmplitudes, setWaveAmplitudes] = useState<number[]>([]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecording) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setWaveAmplitudes([]);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Animate waves
      const animateWaves = () => {
        if (mediaRecorderRef.current?.state === "recording") {
          const amplitudes = Array.from({ length: 20 }, () =>
            Math.random() * 50 + 10
          );
          setWaveAmplitudes(amplitudes);
          animationRef.current = requestAnimationFrame(animateWaves);
        }
      };
      animateWaves();
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSend = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      onRecordingComplete(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!isRecording && audioUrl) {
      // Stop wave animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setWaveAmplitudes([]);
    }
  }, [isRecording, audioUrl]);

  if (!isRecording && !audioUrl) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Button
          onClick={startRecording}
          variant="default"
          size="sm"
          className="rounded-full"
        >
          <Mic className="h-4 w-4 mr-2" />
          Start Recording
        </Button>
        <Button onClick={onCancel} variant="ghost" size="sm">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/50 rounded-lg border">
      {isRecording ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">
                Recording: {formatTime(recordingTime)}
              </span>
            </div>
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="sm"
              className="rounded-full"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>

          {/* Wave animation */}
          <div className="flex items-center justify-center gap-1 h-16">
            {waveAmplitudes.length > 0
              ? waveAmplitudes.map((amplitude, index) => (
                  <div
                    key={index}
                    className="w-1 bg-primary rounded-full transition-all duration-75"
                    style={{
                      height: `${amplitude}%`,
                      animation: `wave ${0.5 + index * 0.1}s ease-in-out infinite`,
                    }}
                  />
                ))
              : Array.from({ length: 20 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-1 bg-primary/30 rounded-full"
                    style={{ height: "20%" }}
                  />
                ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Recording complete</span>
            <span className="text-xs text-muted-foreground">
              {formatTime(recordingTime)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <audio
              ref={audioRef}
              src={audioUrl || undefined}
              onEnded={() => setIsPlaying(false)}
            />
            <Button
              onClick={handlePlay}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button onClick={handleSend} variant="default" size="sm">
              Send
            </Button>
            <Button onClick={onCancel} variant="ghost" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes wave {
          0%,
          100% {
            transform: scaleY(0.5);
          }
          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
}

