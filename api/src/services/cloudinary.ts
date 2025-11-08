import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from 'dotenv';

// Load environment variables
config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadOptions {
  buffer?: Buffer;
  base64?: string;
  url?: string;
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

interface UploadResult {
  url: string | null;
  publicId?: string;
  resourceType?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  mimeType?: string;
  error?: string;
}

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary({
  buffer,
  base64,
  url,
  folder = 'biometric-verification',
  resourceType = 'auto'
}: UploadOptions): Promise<UploadResult> {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('[CLOUDINARY] Credentials not configured');
      return { url: null, error: 'Cloudinary not configured' };
    }

    let uploadData: string;

    // Convert input to data URI if needed
    if (buffer) {
      // Detect mime type from buffer
      let mimeType = 'application/octet-stream';
      
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        mimeType = 'image/jpeg';
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        mimeType = 'image/png';
      } else if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        mimeType = 'application/pdf';
      } else if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
        mimeType = 'video/webm';
      } else if (buffer.toString('utf8', 4, 8) === 'ftyp') {
        mimeType = 'audio/mp4';
      } else if (buffer.toString('utf8', 0, 4) === 'RIFF' && buffer.toString('utf8', 8, 12) === 'WAVE') {
        mimeType = 'audio/wav';
      }

      uploadData = `data:${mimeType};base64,${buffer.toString('base64')}`;
    } else if (base64) {
      if (!base64.startsWith('data:')) {
        const buffer = Buffer.from(base64, 'base64');
        let mimeType = 'application/octet-stream';
        
        if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
          mimeType = 'image/jpeg';
        } else if (buffer[0] === 0x89 && buffer[1] === 0x50) {
          mimeType = 'image/png';
        }
        
        uploadData = `data:${mimeType};base64,${base64}`;
      } else {
        uploadData = base64;
      }
    } else if (url) {
      uploadData = url;
    } else {
      throw new Error('No valid input provided (buffer, base64, or url)');
    }

    // Upload to Cloudinary
    const result: UploadApiResponse = await cloudinary.uploader.upload(uploadData, {
      folder: folder,
      resource_type: resourceType,
      timeout: 60000,
    });

    console.log('[CLOUDINARY] Upload successful:', result.public_id);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      mimeType: `${result.resource_type}/${result.format}`,
      error: undefined
    };

  } catch (error: any) {
    console.error('[CLOUDINARY] Upload failed:', error.message);
    return {
      url: null,
      error: error.message
    };
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string, resourceType: string = 'image'): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return { success: false, error: 'Cloudinary not configured' };
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as any
    });

    console.log('[CLOUDINARY] Delete successful:', publicId);

    return {
      success: result.result === 'ok',
      error: undefined
    };

  } catch (error: any) {
    console.error('[CLOUDINARY] Delete failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get optimized URL for image with transformations
 */
export function getOptimizedUrl(publicId: string, options: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
} = {}): string {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format,
    secure: true
  });
}

export default { uploadToCloudinary, deleteFromCloudinary, getOptimizedUrl };
