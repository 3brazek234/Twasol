import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../env';
import { logger } from './logger';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  const url = env.R2_PUBLIC_URL
    ? `${env.R2_PUBLIC_URL}/${key}`
    : `https://${env.R2_BUCKET_NAME}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

  logger.info({ key, contentType }, 'File uploaded to R2');
  return url;
}

export async function deleteFromR2(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  }));
  logger.info({ key }, 'File deleted from R2');
}

export async function generateUploadUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function generateDownloadUrl(key: string, expiresIn = 300): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function headObjectR2(key: string) {
  const command = new HeadObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });
  return await s3Client.send(command);
}
