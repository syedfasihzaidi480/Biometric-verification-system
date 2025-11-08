import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { uploadToCloudinary } from './cloudinary.js';

/**
 * Upload file with Cloudinary as primary, local storage as fallback
 * Supports: buffer, base64, or URL
 */
async function upload({
  url,
  buffer,
  base64,
  folder = 'biometric-verification'
}) {
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
      mimeType: cloudinaryResult.mimeType || null,
      publicId: cloudinaryResult.publicId,
      provider: 'cloudinary'
    };
  }

  console.warn('[UPLOAD] Cloudinary failed, trying external service:', cloudinaryResult.error);

  try {
    // Try external upload service as secondary option
    const response = await fetch(`https://api.createanything.com/v0/upload`, {
      method: "POST",
      headers: {
        "Content-Type": buffer ? "application/octet-stream" : "application/json"
      },
      body: buffer ? buffer : JSON.stringify({ base64, url }),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Validate the response has a valid URL
      if (data.url && data.url !== 'null' && data.url !== 'undefined') {
        console.log('[UPLOAD] External service upload successful');
        return {
          url: data.url,
          mimeType: data.mimeType || null,
          provider: 'external'
        };
      }
    }
    
    console.warn('[UPLOAD] External service returned invalid URL, falling back to local storage');
  } catch (error) {
    console.warn('[UPLOAD] External service failed, falling back to local storage:', error.message);
  }

  // Fallback to local storage
  const localResult = await uploadToLocalStorage({ url, buffer, base64 });
  return {
    ...localResult,
    provider: 'local'
  };
}

/**
 * Local storage fallback for development
 * Stores files in public/uploads directory
 */
async function uploadToLocalStorage({ url, buffer, base64 }) {
  try {
    let fileBuffer;
    let mimeType = 'application/octet-stream';
    let extension = 'bin';

    // Convert input to buffer
    if (buffer) {
      fileBuffer = buffer;
      // Try to detect mime type from buffer
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        mimeType = 'image/jpeg';
        extension = 'jpg';
      } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        mimeType = 'image/png';
        extension = 'png';
      } else if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        mimeType = 'application/pdf';
        extension = 'pdf';
      } else if (buffer.toString('utf8', 0, 4).includes('ftyp')) {
        // M4A/MP4 audio
        mimeType = 'audio/m4a';
        extension = 'm4a';
      }
    } else if (base64) {
      // Detect mime type from base64 prefix or content
      if (base64.startsWith('data:')) {
        const match = base64.match(/data:([^;]+);/);
        if (match) {
          mimeType = match[1];
          extension = mimeType.split('/')[1];
        }
        // Remove data URL prefix
        fileBuffer = Buffer.from(base64.replace(/^data:[^;]+;base64,/, ''), 'base64');
      } else {
        fileBuffer = Buffer.from(base64, 'base64');
        // Detect from buffer content
        if (fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8) {
          mimeType = 'image/jpeg';
          extension = 'jpg';
        } else if (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50) {
          mimeType = 'image/png';
          extension = 'png';
        }
      }
    } else if (url) {
      // Fetch from URL
      const response = await fetch(url);
      fileBuffer = Buffer.from(await response.arrayBuffer());
      mimeType = response.headers.get('content-type') || 'application/octet-stream';
      extension = mimeType.split('/')[1] || 'bin';
    } else {
      throw new Error('No valid input provided (buffer, base64, or url)');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomStr}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    await writeFile(filepath, fileBuffer);

    // Return public URL
    const publicUrl = `/uploads/${filename}`;
    
    console.log('[UPLOAD] File saved locally:', publicUrl);

    return {
      url: publicUrl,
      mimeType: mimeType,
      error: null
    };

  } catch (error) {
    console.error('[UPLOAD] Local storage failed:', error);
    return {
      url: null,
      mimeType: null,
      error: error.message
    };
  }
}

export { upload };
export default upload;