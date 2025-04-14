import React from 'react';
import { cn } from "@/lib/utils";

interface PulsingSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function PulsingSkeleton({ className, width = "100%", height = "1em" }: PulsingSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 rounded",
        className
      )}
      style={{ width, height }}
    />
  );
}
