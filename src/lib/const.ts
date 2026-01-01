// Plausible
export const PlAUSIBLE_URL = process.env.NEXT_PUBLIC_PLAUSIBLE_URL!;
export const PlAUSIBLE_SITE_URL = process.env.NEXT_PUBLIC_PLAUSIBLE_SITE_URL!;

// Sentry
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN!;

// S3
export const S3_BUCKET = process.env.S3_BUCKET!;
export const S3_REGION = process.env.S3_REGION!;
export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID!;
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY!;
export const S3_ENDPOINT = process.env.S3_ENDPOINT!;
export const S3_PUBLIC_URL = process.env.NEXT_PUBLIC_S3_PUBLIC_URL!;

// Auth
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL!;
export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET!;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export const FILE_UPLOAD_MAX_FILE_SIZE_MB = 50 * 1024 * 1024; // 50MB
export const FILE_UPLOAD_ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mp3',
    'audio/wav',
    'application/zip',
    'application/x-zip-compressed',
];
