"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Complete progress on pathname change
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Global click interceptor for internal links
  useEffect(() => {
    let progressTimer: NodeJS.Timeout | null = null;

    const handleClick = (e: MouseEvent) => {
      // Find nearest anchor tag
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external, target="_blank", anchors, mailto, etc.
      if (
        href.startsWith("http") &&
        !href.startsWith(window.location.origin)
      ) {
        return;
      }
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if target is same page
      const currentUrl = new URL(window.location.href);
      const targetUrl = new URL(href, window.location.origin);
      if (
        currentUrl.pathname === targetUrl.pathname &&
        currentUrl.search === targetUrl.search
      ) {
        return;
      }

      // Start navigation indicator
      setIsNavigating(true);
      setVisible(true);
      setProgress(25);

      if (progressTimer) clearInterval(progressTimer);

      // Smoothly trickle up to ~85% while loading
      progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            if (progressTimer) clearInterval(progressTimer);
            return prev;
          }
          return prev + Math.max(1, Math.floor((85 - prev) * 0.15));
        });
      }, 80);
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      if (progressTimer) clearInterval(progressTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px] bg-transparent"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div
        className="h-full transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          background:
            "linear-gradient(90deg, #10B981 0%, #059669 50%, #34D399 100%)",
          boxShadow: "0 0 10px rgba(16, 185, 129, 0.7), 0 0 4px rgba(5, 150, 105, 0.5)",
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? "width 100ms ease-out, opacity 180ms ease 100ms" : "width 120ms ease-out",
        }}
      />
    </div>
  );
}
