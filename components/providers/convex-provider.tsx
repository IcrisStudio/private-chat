"use client";

import { ConvexProvider as BaseConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
const convex = new ConvexReactClient(convexUrl);

export function ConvexProvider({ children }: { children: ReactNode }) {
  if (!convexUrl) {
    console.warn("NEXT_PUBLIC_CONVEX_URL is not set. Please configure your Convex deployment URL.");
  }
  return <BaseConvexProvider client={convex}>{children}</BaseConvexProvider>;
}

