"use client";

import { useCachedImage } from "@/hooks/useCachedImage";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { images } from "@/images_name";

function CachedImage({ url, alt }: { url: string; alt: string }) {
  const { localUrl } = useCachedImage(url);
  return (
    <Image
      src={localUrl || url}
      alt={alt}
      fill
      priority
      sizes="50vw"
      unoptimized={!!localUrl}
      className="object-cover"
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+ZNPQAIXQM4F5z9yAAAAABJRU5ErkJggg=="
    />
  );
}

export function ImageSidebar() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:block w-1/2 shrink-0">
      <div className="fixed top-0 left-0 w-1/2 h-screen overflow-hidden bg-black">
        <div className="relative w-full h-full shimmer">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={images[currentImageIndex]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <CachedImage
                url={`${images[currentImageIndex]}?auto=format&fit=crop&q=75&w=1200`}
                alt="Floral Art by Europeana"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-10 xl:p-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-4xl xl:text-[40px] text-white leading-[1.08] mb-4 tracking-[-0.02em]">
              Where your ideas weigh.
            </h1>
            <p className="text-white/72 text-[15px] xl:text-[16px] max-w-xs leading-[1.65]">
              Join the most focused community for deep-diving into questions that matter. Build reputation, win debates.
            </p>
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
          <span className="text-white/50 absolute bottom-0 right-0 p-5 font-thin text-[15px] lowercase tracking-tight">Surrealbox</span>
        </div>
      </div>
    </div>
  );
}
