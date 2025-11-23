"use client";

import { ConvexProvider as BaseConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

export function ConvexProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.warn("NEXT_PUBLIC_CONVEX_URL is not set. Please configure your Convex deployment URL.");
      // Use a placeholder URL during build to prevent errors
      return new ConvexReactClient("https://placeholder.convex.cloud");
    }
    return new ConvexReactClient(convexUrl);
  }, []);

  return <BaseConvexProvider client={convex}>{children}</BaseConvexProvider>;
}

