"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface StepContainerProps {
  children: ReactNode;
  isVisible: boolean;
}

export function StepContainer({ children, isVisible }: StepContainerProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="step"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface AchievementPopupProps {
  icon: string;
  title: string;
  description: string;
  isVisible: boolean;
}

export function AchievementPopup({ icon, title, description, isVisible }: AchievementPopupProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
          className="fixed bottom-4 right-4 z-50 p-4 rounded-lg bg-primary text-primary-foreground shadow-lg max-w-xs"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">{icon}</div>
            <div>
              <h4 className="font-bold text-sm">{title}</h4>
              <p className="text-xs opacity-90">{description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ProgressBarProps {
  value: number;
  animated?: boolean;
}

export function AnimatedProgressBar({ value, animated = true }: ProgressBarProps) {
  return (
    <motion.div
      initial={animated ? { scaleX: 0 } : undefined}
      animate={{ scaleX: value / 100 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-2 bg-primary rounded-full origin-left"
      style={{ width: `${value}%` }}
    />
  );
}

interface FloatingBadgeProps {
  children: ReactNode;
  delay?: number;
}

export function FloatingBadge({ children, delay = 0 }: FloatingBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
