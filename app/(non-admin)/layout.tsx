"use client";

import Navbar from "@/components/app/Navbar";
import { Suspense, useEffect } from "react";
import { ImageSidebar } from "@/components/app/ImageSidebar";
import { purgeOldCache } from "@/lib/db";
import { useCachedImage } from "@/hooks/useCachedImage";

export default function NonAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    purgeOldCache();
  }, []);
  return (
    <section className="flex min-h-screen">
      <ImageSidebar />
      <div className="flex-1 flex flex-col min-w-0 relative h-screen">
        <Navbar />
        <main 
          className="flex-1 overflow-y-auto relative"
          style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--primary) / 0.12) transparent" }}
        >
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </main>
      </div>
    </section>
  );
}