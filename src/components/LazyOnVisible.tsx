import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders `children` only after the wrapper has scrolled within
 * `rootMargin` of the viewport. Once visible it stays mounted so scrolling
 * back up doesn't re-mount ThemeDemo (avoiding font/SVG re-work).
 *
 * `min-height` reserves layout space so the grid doesn't jump.
 * `contentVisibility: auto` lets the browser skip painting/hit-testing
 * offscreen cards for free.
 */
export function LazyOnVisible({
  children,
  fallback = null,
  rootMargin = "600px",
  minHeight = 220,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div
      ref={ref}
      style={{
        minHeight: visible ? undefined : minHeight,
        contentVisibility: "auto",
        containIntrinsicSize: `${minHeight}px`,
      } as React.CSSProperties}
    >
      {visible ? children : fallback}
    </div>
  );
}
