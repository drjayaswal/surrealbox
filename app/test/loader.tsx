"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Star {
  id: number;
  y: number;
  size: number;
  baseDuration: number;
  delay: number;
  opacity: number;
}

function StarField({ 
  speedFactor, 
  isExiting, 
  zoomingStarId, 
  onComplete 
}: { 
  speedFactor: number;
  isExiting: boolean;
  zoomingStarId: number | null;
  onComplete?: () => void;
}) {
  const [stars] = useState<Star[]>(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      y: Math.random() * 100,
      size: 1.2 + Math.random() * 1.5,
      baseDuration: 4 + Math.random() * 4,
      delay: Math.random() * -10,
      opacity: 0.3 + Math.random() * 0.5,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => {
        const isZooming = isExiting && s.id === zoomingStarId;
        
        return (
          <motion.div
            key={s.id}
            className="absolute backdrop-blur-md rounded-full bg-white"
            style={{
              top: `${s.y}%`,
              right: isZooming ? "auto" : "-10%",
              left: isZooming ? "110%" : "auto",
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              zIndex: isZooming ? 100 : 1,
            }}
            animate={isZooming ? {
              scale: [1, 2500],
              x: "-120vw",
              opacity: 1,
            } : {
              x: ["0vw", "-120vw"],
              opacity: [0, s.opacity, s.opacity, 0],
            }}
            transition={isZooming ? {
              duration: 1.2,
              ease: [0.7, 0, 0.3, 1],
            } : {
              duration: s.baseDuration / (1 + speedFactor * 1.2),
              delay: s.delay,
              repeat: Infinity,
              ease: "linear",
            }}
            onAnimationComplete={() => {
              if (isZooming) {
                onComplete?.();
              }
            }}
          />
        );
      })}
    </div>
  );
}

export default function StarFieldScreen({ onComplete }: { onComplete?: () => void }) {
  const [speedFactor, setSpeedFactor] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [zoomingStarId, setZoomingStarId] = useState<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    const duration = 8000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setSpeedFactor(progress);

      if (progress === 1) {
        clearInterval(interval);
        setTimeout(() => {
          setZoomingStarId(Math.floor(Math.random() * 60));
          setIsExiting(true);
        }, 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      <StarField 
        speedFactor={speedFactor} 
        isExiting={isExiting} 
        zoomingStarId={zoomingStarId}
        onComplete={onComplete}
      />
      <motion.div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        animate={isExiting ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
      >
        <div className="text-white text-[9px] font-bold uppercase">Indexing</div>
        <div className="h-0.5 w-64 relative">
          <motion.div
            className="absolute inset-0 bg-white rounded-sm z-10"
            style={{ width: `${speedFactor * 100}%` }}
          />
          <motion.div
            className="absolute inset-0 bg-white/25 rounded-sm"
            style={{ width: "100%" }}
          />
        </div>
      </motion.div>
    </div>
  );
}