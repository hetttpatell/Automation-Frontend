"use client";

import React from "react";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  status?: "ai" | "human" | "none";
}

// Multi-color palette: indigo, emerald, amber, purple, sky
const colorPresets = [
  "#4F46E5", // indigo
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#0EA5E9", // sky
];

function getNameHash(name: string): number {
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return sum;
}

export default function Avatar({ name, size = "md", status = "none" }: AvatarProps) {
  const sizeClasses = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-9 h-9 text-[13px]",
    lg: "w-11 h-11 text-[16px]",
  };

  const dotSizes = {
    sm: "w-2 h-2",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  const getInitials = (str: string) => {
    if (!str) return "OP";
    if (str.includes("@")) {
      const namePart = str.split("@")[0];
      return namePart.substring(0, 2).toUpperCase();
    }
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const hash = getNameHash(name || "default");
  const backgroundColor = colorPresets[hash % colorPresets.length];
  const initials = getInitials(name);

  return (
    <div className="relative inline-flex shrink-0 select-none">
      <div
        style={{ backgroundColor }}
        className={`rounded-full flex items-center justify-center font-display font-semibold text-white select-none ${sizeClasses[size]}`}
      >
        {initials}
      </div>

      {status !== "none" && (
        <span
          style={{ borderWidth: "2px", borderColor: "var(--bg-surface)" }}
          className={`absolute -bottom-0.5 -right-0.5 ${dotSizes[size]} rounded-full z-10 ${
            status === "ai"
              ? "bg-emerald-500 ripple-green"
              : "bg-amber-500 ripple-amber"
          }`}
        />
      )}
    </div>
  );
}
