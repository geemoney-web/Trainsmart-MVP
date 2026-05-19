import { S3Client } from '@aws-sdk/client-s3';

let cachedClient: S3Client | null = null;

export function createS3Client(): S3Client {
  if (cachedClient) return cachedClient;

  const region = process.env.S3_REGION ?? 'us-east-1';
  const endpoint = process.env.S3_ENDPOINT;

  cachedClient = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    },
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  });

  return cachedClient;
}

export function getBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error('S3_BUCKET is not configured');
  return bucket;
}
