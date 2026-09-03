/**
 * Utility for handling file uploads to Cloudflare R2 via presigned URLs.
 * Works seamlessly with expo-image-picker and expo-document-picker.
 */

interface UploadOptions {
  localUri: string;
  presignedUrl: string;
  contentType: string;
  onProgress?: (progress: number) => void;
}

export async function uploadFileToR2({ localUri, presignedUrl, contentType, onProgress }: UploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    // Bypass for local development if real R2 credentials are not set in the backend .env
    if (presignedUrl.includes('your_account_id')) {
      console.warn('Mocking R2 upload because dummy credentials were detected in the presigned URL.');
      if (onProgress) onProgress(100);
      setTimeout(() => resolve(), 1000);
      return;
    }

    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(Math.round(progress));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network request failed during upload'));
    };

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    
    // React Native's XHR handles local file URIs automatically when passed as an object
    xhr.send({ uri: localUri, type: contentType, name: localUri.split('/').pop() } as any);
  });
}
