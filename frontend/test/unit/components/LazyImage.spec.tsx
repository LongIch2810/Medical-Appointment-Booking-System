import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import LazyImage from "@/components/lazy/LazyImage";

describe("LazyImage component", () => {
  it("renders image with loading='lazy' and decoding='async'", () => {
    render(
      <LazyImage
        src="https://example.com/avatar.png"
        alt="Bác sĩ thử nghiệm"
        width={60}
        height={60}
      />
    );

    const img = screen.getByRole("img", { name: "Bác sĩ thử nghiệm" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveAttribute("width", "60");
    expect(img).toHaveAttribute("height", "60");
  });

  it("falls back to fallbackSrc when image fails to load", () => {
    const fallback = "https://example.com/fallback.png";
    render(
      <LazyImage
        src="https://example.com/broken-url.png"
        alt="Ảnh lỗi"
        fallbackSrc={fallback}
      />
    );

    const img = screen.getByRole("img", { name: "Ảnh lỗi" });
    expect(img).toHaveAttribute("src", "https://example.com/broken-url.png");

    // Simulate error event
    fireEvent.error(img);

    expect(img).toHaveAttribute("src", fallback);
  });

  it("applies opacity transition class when loaded", () => {
    render(
      <LazyImage
        src="https://example.com/valid.png"
        alt="Ảnh hợp lệ"
      />
    );

    const img = screen.getByRole("img", { name: "Ảnh hợp lệ" });
    expect(img.className).toContain("opacity-0");

    // Simulate load event
    fireEvent.load(img);

    expect(img.className).toContain("opacity-100");
  });
});
