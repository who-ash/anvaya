import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/server/auth/server';
import {
    FILE_UPLOAD_ALLOWED_TYPES,
    FILE_UPLOAD_MAX_FILE_SIZE_MB,
    S3_BUCKET,
    S3_PUBLIC_URL,
} from '@/lib/const';
import { s3Client } from '@/lib/s3/client';

const uploadSchema = z.object({
    fileName: z.string().min(1, 'File name is required'),
    fileType: z.string().min(1, 'File type is required'),
    fileSize: z.number().positive('File size must be positive'),
    filePath: z
        .string()
        .optional()
        .refine(
            (path) => {
                if (!path) return true;
                const sanitized = path
                    .replace(/^\/+|\/+$/g, '')
                    .replace(/\/+/g, '/');
                return !sanitized.includes('..') && sanitized.length > 0;
            },
            { message: 'Invalid file path' },
        ),
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        const body = await request.json();
        const validation = uploadSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    error: 'Invalid request data',
                    details: validation.error.issues,
                },
                { status: 400 },
            );
        }

        const { fileName, fileType, fileSize, filePath } = validation.data;

        const MAX_FILE_SIZE = FILE_UPLOAD_MAX_FILE_SIZE_MB;
        if (fileSize > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: `File size too large. Maximum size is ${FILE_UPLOAD_MAX_FILE_SIZE_MB}MB.`,
                },
                { status: 400 },
            );
        }

        const allowedTypes = FILE_UPLOAD_ALLOWED_TYPES;
        if (!allowedTypes.includes(fileType)) {
            return NextResponse.json(
                { error: 'File type not supported' },
                { status: 400 },
            );
        }

        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2);
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileExtension = sanitizedFileName.split('.').pop();
        const sanitizedFilePath = filePath
            ? filePath.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
            : '';
        const baseFolder = session.user.id;
        const subFolder = sanitizedFilePath ? `${sanitizedFilePath}/` : '';
        const fileKey = `${baseFolder}/${subFolder}${timestamp}-${randomString}.${fileExtension}`;

        // Create a presigned URL
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: fileKey,
            ContentType: fileType,
            Metadata: {
                originalName: fileName,
                uploadedBy: session.user.id,
                uploadedAt: new Date().toISOString(),
                userEmail: session.user.email || 'unknown',
            },
        });

        const presignedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 5 * 60, // 5 minutes
        });

        const publicUrl = `${S3_PUBLIC_URL}/${fileKey}`;

        return NextResponse.json({
            presignedUrl,
            fileKey,
            publicUrl,
            expiresIn: 300, // 5 minutes in sec
        });
    } catch (error) {
        console.error('Upload error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.issues },
                { status: 400 },
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate upload URL' },
            { status: 500 },
        );
    }
}
