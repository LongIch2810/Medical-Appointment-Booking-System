import React from "react";
import LazyViewport, { type LazyViewportProps } from "./LazyViewport";
import SectionSkeleton, { type SectionSkeletonProps } from "./SectionSkeleton";

export interface LazySectionProps extends Omit<LazyViewportProps, "fallback"> {
  title?: string;
  description?: string;
  skeletonType?: SectionSkeletonProps["type"];
  skeletonCardCount?: number;
  customFallback?: React.ReactNode;
}

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  minHeight = 420,
  title,
  description,
  skeletonType = "cards",
  skeletonCardCount = 4,
  customFallback,
  ...viewportProps
}) => {
  const fallback = customFallback ?? (
    <SectionSkeleton
      minHeight={minHeight}
      title={title}
      description={description}
      type={skeletonType}
      cardCount={skeletonCardCount}
    />
  );

  return (
    <LazyViewport minHeight={minHeight} fallback={fallback} {...viewportProps}>
      {children}
    </LazyViewport>
  );
};

export default LazySection;
