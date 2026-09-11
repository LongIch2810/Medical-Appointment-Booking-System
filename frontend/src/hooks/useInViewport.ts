import { useEffect, useRef, useState } from "react";

export interface UseInViewportOptions {
  /**
   * Khoảng cách biên ngoài của viewport để kích hoạt trước khi cuộn tới.
   * Mặc định: "100px 0px" (kích hoạt trước 100px theo chiều dọc).
   */
  rootMargin?: string;
  /**
   * Tỷ lệ diện tích phần tử phải hiển thị trước khi kích hoạt.
   * Mặc định: 0.01 (ngay khi chớm vào vùng biên).
   */
  threshold?: number | number[];
  /**
   * Nếu true, observer tự động ngắt kết nối sau lần đầu tiên xuất hiện trong viewport.
   * Giúp tiết kiệm tài nguyên CPU và ngăn unmount/remount không cần thiết.
   * Mặc định: true.
   */
  once?: boolean;
  /**
   * Cho phép bật hoặc tắt observer (hữu ích khi muốn hoãn observer có điều kiện).
   * Mặc định: true.
   */
  enabled?: boolean;
}

export interface UseInViewportReturn<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  isInView: boolean;
  hasBeenInView: boolean;
}

export function useInViewport<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewportOptions = {}
): UseInViewportReturn<T> {
  const {
    rootMargin = "100px 0px",
    threshold = 0.01,
    once = true,
    enabled = true,
  } = options;

  const ref = useRef<T | null>(null);

  // Fallback: nếu môi trường không hỗ trợ IntersectionObserver (SSR / trình duyệt cũ),
  // mặc định coi như đã hiển thị để không chặn người dùng.
  const hasObserverSupport =
    typeof window !== "undefined" && "IntersectionObserver" in window;

  const [isInView, setIsInView] = useState<boolean>(!hasObserverSupport);
  const [hasBeenInView, setHasBeenInView] = useState<boolean>(!hasObserverSupport);

  useEffect(() => {
    // Nếu trình duyệt không hỗ trợ hoặc observer bị disabled, không làm gì thêm
    if (!hasObserverSupport || !enabled) {
      return;
    }

    // Nếu đã từng xuất hiện và once = true, không cần khởi tạo lại observer
    if (once && hasBeenInView) {
      return;
    }

    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;

        const isIntersecting = entry.isIntersecting;
        setIsInView(isIntersecting);

        if (isIntersecting) {
          setHasBeenInView(true);
          if (once) {
            observer.disconnect();
          }
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasObserverSupport, enabled, rootMargin, threshold, once, hasBeenInView]);

  return { ref, isInView, hasBeenInView };
}
