"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ColorTheme {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji?: string;
}

export const EDUCATION_THEMES: ColorTheme[] = [
  {
    name: "Céu Azul",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    emoji: "🌤️",
  },
  {
    name: "Natureza",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    emoji: "🌿",
  },
  {
    name: "Misticismo",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    emoji: "✨",
  },
  {
    name: "Energia",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    emoji: "⚡",
  },
  {
    name: "Paixão",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    emoji: "❤️",
  },
  {
    name: "Ouro",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    emoji: "💎",
  },
];

interface ColorPickerProps {
  value: {
    color: string;
    bgColor: string;
    borderColor: string;
  };
  onChange: (theme: ColorTheme) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {EDUCATION_THEMES.map((theme) => (
        <button
          key={theme.name}
          type="button"
          onClick={() => onChange(theme)}
          className={cn(
            "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105",
            value.color === theme.color &&
              value.bgColor === theme.bgColor &&
              value.borderColor === theme.borderColor
              ? "border-primary ring-2 ring-primary/50 shadow-lg"
              : "border-muted-foreground/20 hover:border-primary/50"
          )}
        >
          {/* Color preview */}
          <div className={cn("w-12 h-12 rounded-lg", theme.bgColor, theme.borderColor, "border")} />

          {/* Theme name */}
          <div className="text-center">
            <div className="text-sm font-medium">{theme.emoji}</div>
            <div className="text-xs text-muted-foreground mt-1">{theme.name}</div>
          </div>

          {/* Check indicator */}
          {value.color === theme.color &&
            value.bgColor === theme.bgColor &&
            value.borderColor === theme.borderColor && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
        </button>
      ))}
    </div>
  );
}
