import { useEffect, useState, useRef } from "react";

interface UseCountUpProps {
  end: number;
  start?: number;
  duration?: number; // in milliseconds
}

export function useCountUp({ end, start = 0, duration = 1200 }: UseCountUpProps) {
  const [count, setCount] = useState(start);
  const prevEndRef = useRef(end);

  useEffect(() => {
    // If the component remounts or end/start changes, we run the animation
    let startTime: number | null = null;
    const startVal = start;
    const endVal = end;
    const range = endVal - startVal;

    // Smooth quadratic ease-out
    const easeOutQuad = (t: number) => t * (2 - t);

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);

      setCount(startVal + range * easedProgress);

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [end, start, duration]);

  return count;
}
