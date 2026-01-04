import { db } from '@/server/db';
import { meetingRecordings } from '@/server/db/schema/meet-schema';
import { nanoid } from 'nanoid';

export class TranscriptionService {
    private deepgramApiKey: string;

    constructor() {
        this.deepgramApiKey = process.env.DEEPGRAM_API_KEY!;
    }

    async transcribeAudio(audioBuffer: Buffer, contentType: string) {
        try {
            const response = await fetch(
                'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Token ${this.deepgramApiKey}`,
                        'Content-Type': contentType,
                    },
                    body: new Uint8Array(audioBuffer),
                },
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    `Deepgram error: ${error.err_msg || response.statusText}`,
                );
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Transcription error:', error);
            throw error;
        }
    }

    async processRecording(
        meetingId: string,
        audioUrl: string,
        audioBuffer: Buffer,
    ) {
        // 1. Transcribe
        const transcriptJson = await this.transcribeAudio(
            audioBuffer,
            'audio/wav',
        );
        const transcriptText =
            transcriptJson.results?.channels[0]?.alternatives[0]?.transcript ||
            '';

        // 2. Store recording info in DB
        await db.insert(meetingRecordings).values({
            id: nanoid(),
            meetingId,
            wavUrl: audioUrl,
            transcriptJson: JSON.stringify(transcriptJson),
            // In a real app, you'd upload the transcript text as a file to R2 too
        });

        return { transcriptText, transcriptJson };
    }
}

export const transcriptionService = new TranscriptionService();
