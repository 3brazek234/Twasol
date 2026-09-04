import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../env';
import { logger } from './logger';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  // Polyfill for backend-side direct upload
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { public_id: key, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        logger.info({ key }, 'File uploaded to Cloudinary');
        resolve(result!.secure_url);
      }
    ).end(buffer);
  });
}

export async function deleteFromR2(key: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(key);
    logger.info({ key }, 'File deleted from Cloudinary');
  } catch (error) {
    logger.error({ key, error }, 'Failed to delete from Cloudinary');
  }
}

export async function generateUploadUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
  const timestamp = Math.round((new Date).getTime() / 1000);
  
  const signature = cloudinary.utils.api_sign_request({
    timestamp: timestamp,
    public_id: key,
  }, process.env.CLOUDINARY_API_SECRET!);

  const payload = {
    url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY,
    public_id: key
  };

  // We return a JSON string so the mobile app can parse it. 
  // It acts as a drop-in replacement for the presigned URL string.
  return JSON.stringify(payload);
}

export async function generateDownloadUrl(key: string, expiresIn = 300): Promise<string> {
  // Cloudinary URLs are generally public or can be signed.
  // Assuming public access for now since verification URLs might be short-lived or admin-only
  // We can return the direct URL
  return cloudinary.url(key, { secure: true });
}

export async function headObjectR2(key: string) {
  try {
    const result = await cloudinary.api.resource(key);
    
    // Map Cloudinary format to standard MIME types
    let mimeType = 'application/octet-stream';
    if (result.format === 'jpg' || result.format === 'jpeg') mimeType = 'image/jpeg';
    else if (result.format === 'png') mimeType = 'image/png';
    else if (result.format === 'pdf') mimeType = 'application/pdf';
    else if (result.resource_type === 'image') mimeType = `image/${result.format}`;
    else if (result.resource_type === 'raw') mimeType = `application/${result.format}`;

    return { ContentLength: result.bytes, ContentType: mimeType };
  } catch (err) {
    throw new Error('NotFound');
  }
}
