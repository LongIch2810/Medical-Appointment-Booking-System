import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface LazyImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  containerClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallbackSrc = "https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
  aspectRatio,
  loading = "lazy",
  decoding = "async",
  width,
  height,
  className,
  containerClassName,
  onLoad,
  onError,
  ...restProps
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Sync state if src prop changes
  React.useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError && fallbackSrc && currentSrc !== fallbackSrc) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
    onError?.(e);
  };

  return (
    <div
      className={cn("relative overflow-hidden inline-block", containerClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          !isLoaded ? "opacity-0" : "opacity-100",
          className
        )}
        {...restProps}
      />
    </div>
  );
};

export default LazyImage;
