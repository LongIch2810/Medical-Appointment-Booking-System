import React, { Component, Suspense, type ErrorInfo } from "react";
import { useInViewport } from "@/hooks/useInViewport";
import SectionSkeleton from "./SectionSkeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
  minHeight?: number | string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ChunkErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Chunk loading error in LazyViewport:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const minHeightStyle =
        typeof this.props.minHeight === "number"
          ? `${this.props.minHeight}px`
          : this.props.minHeight;

      return (
        <div
          style={{ minHeight: minHeightStyle || "200px" }}
          className="flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 my-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Không thể tải nội dung phần này
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-4">
            Kết nối mạng có thể bị gián đoạn trong lúc tải dữ liệu. Vui lòng bấm
            thử lại.
          </p>
          <Button
            onClick={this.handleRetry}
            size="sm"
            variant="outline"
            className="inline-flex items-center gap-2 rounded-xl border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thử tải lại</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export interface LazyViewportProps {
  /** Component con (thường là dynamic import bọc trong React.lazy) */
  children: React.ReactNode;
  /** Fallback hiển thị khi chưa vào viewport hoặc đang tải chunk */
  fallback?: React.ReactNode;
  /** Chiều cao giữ chỗ tối thiểu (px hoặc css string) để triệt tiêu CLS */
  minHeight?: number | string;
  /** Khoảng cách biên ngoài viewport để tải trước (mặc định "100px 0px") */
  rootMargin?: string;
  /** Ngưỡng hiển thị kích hoạt (mặc định 0.01) */
  threshold?: number | number[];
  /** Callback được gọi khi phần tử lần đầu vào viewport */
  onVisible?: () => void;
  className?: string;
}

export const LazyViewport: React.FC<LazyViewportProps> = ({
  children,
  fallback,
  minHeight = 400,
  rootMargin = "100px 0px",
  threshold = 0.01,
  onVisible,
  className,
}) => {
  const { ref, hasBeenInView } = useInViewport({
    rootMargin,
    threshold,
    once: true,
  });

  const minHeightStyle =
    typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  const defaultFallback = fallback ?? (
    <SectionSkeleton minHeight={minHeight} />
  );

  React.useEffect(() => {
    if (hasBeenInView && onVisible) {
      onVisible();
    }
  }, [hasBeenInView, onVisible]);

  return (
    <div
      ref={ref}
      style={!hasBeenInView ? { minHeight: minHeightStyle } : undefined}
      className={cn("w-full relative", className)}
    >
      {!hasBeenInView ? (
        defaultFallback
      ) : (
        <ChunkErrorBoundary minHeight={minHeight}>
          <Suspense fallback={defaultFallback}>{children}</Suspense>
        </ChunkErrorBoundary>
      )}
    </div>
  );
};

export default LazyViewport;
