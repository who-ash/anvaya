import { WebhookReceiver } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { meetingService } from '@/server/trpc/services/meet.service';

const receiver = new WebhookReceiver(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
);

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('Authorization');

    if (!sig) {
        return NextResponse.json({ error: 'No signature' }, { status: 401 });
    }

    try {
        const event = (await receiver.receive(body, sig)) as any;
        const roomName = event.room?.name || '';
        const participantIdentity = event.participant?.identity || '';

        switch (event.event) {
            case 'room_finished':
                if (roomName) {
                    await meetingService.endMeeting(roomName);
                }
                break;
            case 'participant_joined':
                if (roomName && participantIdentity) {
                    await meetingService.joinMeeting(
                        roomName,
                        participantIdentity,
                    );
                }
                break;
            case 'participant_left':
                if (roomName && participantIdentity) {
                    await meetingService.leaveMeeting(
                        roomName,
                        participantIdentity,
                    );
                    // Check if room is now empty and should be ended
                    const ended =
                        await meetingService.checkAndEndMeetingIfEmpty(
                            roomName,
                        );
                }
                break;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[LiveKit Webhook] Error:', error);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 },
        );
    }
}
