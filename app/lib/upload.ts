import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
export const BUCKET_NAME = 'surrealbox';

export async function uploadToSupabase(
  file: File | Buffer,
  userId: string,
  options: {
    isProfileImage?: boolean;
    fileName?: string;
    contentType?: string;
  }
) {
  const { isProfileImage = false, fileName = 'image', contentType = 'image/png' } = options;
  
  const path = isProfileImage 
    ? `users/${userId}/image` 
    : `users/${userId}/assets/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return publicUrl;
}