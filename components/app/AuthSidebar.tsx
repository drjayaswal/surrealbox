"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCachedImage } from "@/hooks/useCachedImage";
import { useEffect, useState } from "react";

interface AuthSidebarProps {
  imageSrc: string;
  side?: "left" | "right";
  title?: string;
  subtitle?: string;
}

export function AuthSidebar({ imageSrc, side = "left", title, subtitle }: AuthSidebarProps) {
  const { localUrl, isLoading } = useCachedImage(imageSrc);
  const [isRevealStarted, setIsRevealStarted] = useState(false);

  useEffect(() => {
    if (!isLoading && localUrl) {
      setIsRevealStarted(true);
    }
  }, [isLoading, localUrl]);

  return (
    <div className={`hidden lg:block w-6/10 h-screen relative overflow-hidden bg-black ${side === "right" ? "order-last" : "order-first"}`}>
      <motion.div
        initial={{ filter: "blur(20px)", opacity: 0, scale: 1.05 }}
        animate={isRevealStarted ? { filter: "blur(0px)", opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 w-full h-full"
      >
        <Image
          src={localUrl || imageSrc}
          alt="Auth background"
          fill
          priority
          unoptimized={!!localUrl}
          onLoad={() => setIsRevealStarted(true)}
          className="object-cover"
          sizes="50vw"
        />
      </motion.div>
      
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-black/30 pointer-events-none" />
      
      <AnimatePresence>
        {(title || subtitle) && (
          <div className="absolute bottom-0 left-0 right-0 p-12 z-10">
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={isRevealStarted ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {title && (
                <h2 className="text-4xl text-white mb-4 tracking-tight font-medium">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-white/80 text-lg max-w-md leading-relaxed font-light">
                  {subtitle}
                </p>
              )}
              <div className="mt-8 flex items-center gap-3 text-[10px] text-white/40 uppercase font-semibold">
                <span className="opacity-70">Curated from</span>
                <Image src="https://images.unsplash.com/profile-1574363570516-50a9209e8f08image?w=150&dpr=2&crop=faces&bg=%23fff&h=150&auto=format&fit=crop&q=60&ixlib=rb-4.1.0" alt="" width={15} height={15} className="rounded-4xl" />
                <a
                  href="https://unsplash.com/@europeana"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-white transition-all"
                >
                  Europeana
                </a>
                <span className="text-white/20">•</span>
                <a
                  href="https://unsplash.com/collections/_7OuPnAqFt4/floral-art"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white underline underline-offset-4 decoration-white/20 hover:decoration-white transition-all"
                >
                  Floral Art Collection
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <span className="text-white/50 absolute bottom-0 right-0 p-5 font-thin text-[15px] lowercase tracking-tight">Surrealbox</span>
    </div>
  );
}