import Dexie, { Table } from 'dexie';

export interface CachedImage {
  url: string;
  blob: Blob;
  timestamp: number;
}

export class ImageDatabase extends Dexie {
  image_cache!: Table<CachedImage>;

  constructor() {
    super('ImageDatabase');
    this.version(1).stores({
      image_cache: 'url, timestamp'
    });
  }
}

export const db = new ImageDatabase();

const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const getCachedImage = async (url: string): Promise<Blob | null> => {
  try {
    const entry = await db.image_cache.get(url);
    const now = Date.now();

    if (entry && (now - entry.timestamp) < CACHE_EXPIRY_MS) {
      return entry.blob;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Fetch failed');
    const blob = await response.blob();

    await db.image_cache.put({
      url,
      blob,
      timestamp: now
    });

    return blob;
  } catch (error) {
    console.error('Dexie cache error:', error);
    return null;
  }
};

export const purgeOldCache = async () => {
  try {
    const expiryThreshold = Date.now() - CACHE_EXPIRY_MS;
    await db.image_cache.where('timestamp').below(expiryThreshold).delete();
  } catch (error) {
    console.error('Cache purge error:', error);
  }
};
