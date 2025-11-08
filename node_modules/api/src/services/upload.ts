import { uploadToCloudinary } from './cloudinary.js';

interface UploadInput {
  buffer?: Buffer;
  base64?: string;
  url?: string;
  folder?: string;
}

interface UploadResult {
  url: string | null;
  publicId?: string;
  mimeType?: string;
  provider: 'cloudinary' | 'local';
  error?: string;
}

/**
 * Unified upload service
 * Attempts Cloudinary first, falls back to local storage if needed
 */
export async function upload({
  buffer,
  base64,
  url,
  folder = 'biometric-verification'
}: UploadInput): Promise<UploadResult> {
  
  // Try Cloudinary first
  const cloudinaryResult = await uploadToCloudinary({
    buffer,
    base64,
    url,
    folder,
    resourceType: 'auto'
  });

  if (!cloudinaryResult.error && cloudinaryResult.url) {
    console.log('[UPLOAD] Cloudinary upload successful');
    return {
      url: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId,
      mimeType: cloudinaryResult.mimeType,
      provider: 'cloudinary'
    };
  }

  console.warn('[UPLOAD] Cloudinary failed:', cloudinaryResult.error);
  
  // Fallback to local storage (not implemented in API service)
  // This API service expects files to be stored in cloud
  return {
    url: null,
    provider: 'local',
    error: 'Upload failed: Cloudinary not available and local storage not configured in API service'
  };
}

export default { upload };
