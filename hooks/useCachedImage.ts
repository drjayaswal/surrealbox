"use client";

import { useState, useEffect } from 'react';
import { getCachedImage } from '@/lib/db';

export function useCachedImage(url: string) {
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let activeUrl: string | null = null;
    let isMounted = true;

    const load = async () => {
      if (!url) return;
      setIsLoading(true);
      try {
        const blob = await getCachedImage(url);
        if (blob && isMounted) {
          const objectUrl = URL.createObjectURL(blob);
          setLocalUrl(objectUrl);
          activeUrl = objectUrl;
          setError(null);
        } else if (isMounted) {
          setLocalUrl(null);
        }
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [url]);

  return { localUrl, isLoading, error };
}
