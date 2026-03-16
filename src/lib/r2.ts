import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Uploads a base64 data URL image to Cloudflare R2 and returns the public URL.
 * @param base64DataUrl - data:image/jpeg;base64,... string from the client
 * @param key - object key, e.g. "tableId/userId/1234567890.jpg"
 */
export async function uploadStackPhoto(
  base64DataUrl: string,
  key: string
): Promise<string> {
  const base64 = base64DataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
