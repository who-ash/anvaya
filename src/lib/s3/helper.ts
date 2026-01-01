export interface UploadOptions {
    file: File;
    filePath?: string;
    onProgress?: (progress: number) => void;
}

export interface UploadResponse {
    presignedUrl: string;
    fileKey: string;
    publicUrl: string;
    expiresIn: number;
}

/**
 * Upload a file
 */
export async function uploadFile({
    file,
    filePath,
    onProgress,
}: UploadOptions): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
}> {
    try {
        const response = await fetch('/api/v1/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                filePath,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get upload URL');
        }

        const { presignedUrl, publicUrl, fileKey } =
            (await response.json()) as UploadResponse;

        const uploadResponse = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });

        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file to storage');
        }

        if (onProgress) {
            onProgress(100);
        }

        return {
            success: true,
            publicUrl,
        };
    } catch (error) {
        console.error('Upload error:', error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : 'Unknown error occurred',
        };
    }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
    files: File[],
    filePath?: string,
    onProgress?: (fileIndex: number, progress: number) => void,
): Promise<
    Array<{
        success: boolean;
        publicUrl?: string;
        error?: string;
        fileName: string;
    }>
> {
    const results = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFile({
            file,
            filePath,
            onProgress: onProgress
                ? (progress) => onProgress(i, progress)
                : undefined,
        });

        results.push({
            ...result,
            fileName: file.name,
        });
    }

    return results;
}
