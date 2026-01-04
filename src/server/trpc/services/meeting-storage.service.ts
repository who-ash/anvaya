import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3/client';
import { S3_BUCKET, S3_PUBLIC_URL } from '@/lib/const';
import { db } from '@/server/db';
import {
    meetingRecordings,
    meetingMessages,
} from '@/server/db/schema/meet-schema';
import { eq, asc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export class MeetingStorageService {
    /**
     * Upload a JSON file to R2 storage
     */
    async uploadJson(
        meetingId: string,
        fileName: string,
        data: any,
    ): Promise<string> {
        const key = `meetings/${meetingId}/${fileName}`;
        const jsonString = JSON.stringify(data, null, 2);

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: jsonString,
            ContentType: 'application/json',
        });

        await s3Client.send(command);
        return `${S3_PUBLIC_URL}/${key}`;
    }

    /**
     * Upload audio/video buffer to R2 storage
     */
    async uploadAudio(
        meetingId: string,
        buffer: Buffer,
        fileName: string,
    ): Promise<string> {
        const key = `meetings/${meetingId}/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: 'audio/wav',
        });

        await s3Client.send(command);
        return `${S3_PUBLIC_URL}/${key}`;
    }

    /**
     * Export and upload chat messages for a meeting
     * Returns the URL of the uploaded JSON file
     */
    async exportChatMessages(meetingId: string): Promise<string | null> {
        const messages = await db.query.meetingMessages.findMany({
            where: eq(meetingMessages.meetingId, meetingId),
            with: {
                sender: true,
            },
            orderBy: [asc(meetingMessages.createdAt)],
        });

        if (messages.length === 0) {
            return null;
        }

        // Format messages for export
        const exportData = {
            meetingId,
            exportedAt: new Date().toISOString(),
            messageCount: messages.length,
            messages: messages.map((msg) => ({
                id: msg.id,
                senderId: msg.senderId,
                senderName: msg.sender?.name || 'Unknown',
                content: msg.content,
                createdAt: msg.createdAt.toISOString(),
            })),
        };

        const url = await this.uploadJson(
            meetingId,
            'chat-messages.json',
            exportData,
        );
        return url;
    }

    /**
     * Save meeting recording and update DB with URLs
     */
    async saveRecording(
        meetingId: string,
        audioBuffer: Buffer,
        transcriptJson: any,
        messagesUrl: string | null,
    ): Promise<void> {
        // Upload audio to R2
        const wavUrl = await this.uploadAudio(
            meetingId,
            audioBuffer,
            'recording.wav',
        );

        // Upload transcript JSON to R2
        let transcriptUrl: string | null = null;
        if (transcriptJson) {
            transcriptUrl = await this.uploadJson(
                meetingId,
                'transcript.json',
                transcriptJson,
            );
        }

        // Save recording info in DB
        await db.insert(meetingRecordings).values({
            id: nanoid(),
            meetingId,
            wavUrl,
            transcriptUrl,
            messagesUrl,
            transcriptJson: JSON.stringify(transcriptJson),
        });
    }

    /**
     * Finalize meeting - export chat messages to R2
     * Called when meeting ends
     */
    async finalizeMeeting(
        meetingId: string,
    ): Promise<{ messagesUrl: string | null }> {
        console.log(`[MeetingStorage] Finalizing meeting ${meetingId}`);

        // Export chat messages to R2
        const messagesUrl = await this.exportChatMessages(meetingId);
        console.log(`[MeetingStorage] Chat exported to: ${messagesUrl}`);

        // Check if there's already a recording, and update it with messagesUrl
        const existingRecording = await db.query.meetingRecordings.findFirst({
            where: eq(meetingRecordings.meetingId, meetingId),
        });

        if (existingRecording && messagesUrl) {
            await db
                .update(meetingRecordings)
                .set({ messagesUrl })
                .where(eq(meetingRecordings.id, existingRecording.id));
        } else if (messagesUrl && !existingRecording) {
            // Create a recording entry just for chat export (no audio yet)
            await db.insert(meetingRecordings).values({
                id: nanoid(),
                meetingId,
                messagesUrl,
            });
        }

        return { messagesUrl };
    }
}

export const meetingStorageService = new MeetingStorageService();
