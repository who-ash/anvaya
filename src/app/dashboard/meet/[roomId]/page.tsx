'use client';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/server/trpc/client';
import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Track } from 'livekit-client';
import {
    LiveKitRoom,
    GridLayout,
    ParticipantTile,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
    LayoutContextProvider,
    useLayoutContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { toast } from 'sonner';

import { MeetingChat } from '@/components/app/dashboard/meet/meeting-chat';

function useMeetingRecorder(meetingId: string) {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
        null,
    );
    const [chunks, setChunks] = useState<Blob[]>([]);
    const uploadMutation = trpc.meet.uploadRecording.useMutation();

    const startRecording = async (stream: MediaStream) => {
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                setChunks((prev) => [...prev, e.data]);
            }
        };
        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                uploadMutation.mutate({ meetingId, audioBase64: base64 });
            };
        };
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorder?.stop();
        setIsRecording(false);
    };

    return { isRecording, startRecording, stopRecording };
}

function CustomMeetingLayout({ meetingId }: { meetingId: string }) {
    const layoutContext = useLayoutContext();
    const showChat = layoutContext.widget.state?.showChat ?? false;

    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false },
    );

    const customThemeStyles: React.CSSProperties = {
        height: 'calc(100vh - 8rem)',
        maxWidth: '100%',
        overflow: 'hidden',
        ['--lk-bg' as string]: 'hsl(0 0% 100%)',
        ['--lk-bg2' as string]: 'hsl(0 0% 98%)',
        ['--lk-bg3' as string]: 'hsl(0 0% 96%)',
        ['--lk-fg' as string]: 'hsl(240 10% 3.9%)',
        ['--lk-border-color' as string]: 'hsl(240 5.9% 90%)',
        ['--lk-control-bg' as string]: 'hsl(0 0% 96%)',
        ['--lk-control-fg' as string]: 'hsl(240 5.9% 10%)',
        ['--lk-control-hover-bg' as string]: 'hsl(240 4.8% 95.9%)',
        ['--lk-accent-bg' as string]: 'hsl(240 4.8% 95.9%)',
        ['--lk-accent-fg' as string]: 'hsl(240 5.9% 10%)',
        ['--lk-danger' as string]: 'hsl(0 84.2% 60.2%)',
    };

    return (
        <div
            className="lk-video-conference flex w-full flex-col"
            data-lk-theme="default"
            style={customThemeStyles}
        >
            <div className="flex min-h-0 w-full flex-1 overflow-hidden">
                <div
                    className="relative flex-1 overflow-hidden"
                    style={{
                        backgroundColor: 'hsl(0 0% 98%)',
                        minWidth: 0,
                    }}
                >
                    <GridLayout
                        tracks={tracks}
                        style={{
                            height: '100%',
                            width: '100%',
                            backgroundColor: 'hsl(0 0% 98%)',
                        }}
                    >
                        <ParticipantTile />
                    </GridLayout>
                </div>

                {showChat && (
                    <div
                        className="flex h-full flex-shrink-0 flex-col overflow-hidden border-l"
                        style={{
                            width: '320px',
                            maxWidth: '40%',
                            backgroundColor: 'hsl(0 0% 100%)',
                            borderColor: 'hsl(240 5.9% 90%)',
                        }}
                    >
                        <MeetingChat meetingId={meetingId} />
                    </div>
                )}
            </div>

            <div className="flex-shrink-0">
                <ControlBar
                    controls={{
                        camera: true,
                        microphone: true,
                        screenShare: true,
                        chat: true,
                        leave: true,
                    }}
                    variation="minimal"
                />
            </div>
        </div>
    );
}

function MeetingLayoutContent({ meetingId }: { meetingId: string }) {
    return <CustomMeetingLayout meetingId={meetingId} />;
}

function MeetingLayoutWrapper({ meetingId }: { meetingId: string }) {
    return (
        <LayoutContextProvider>
            <MeetingLayoutContent meetingId={meetingId} />
        </LayoutContextProvider>
    );
}

export default function RoomPage() {
    const { roomId } = useParams() as { roomId: string };
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const hasJoined = useRef(false);
    const hasLeft = useRef(false);
    const [connectionState, setConnectionState] =
        useState<string>('initializing');

    const joinMutation = trpc.meet.join.useMutation({
        onSuccess: (data) => {
            setToken(data.token);
            setConnectionState('token-received');
        },
        onError: (err) => {
            toast.error(err.message);
            setConnectionState('error');
            router.push('/dashboard/meet');
        },
    });

    const leaveMutation = trpc.meet.leave.useMutation({
        onSuccess: (data) => {
            if (data.ended) {
                toast.info('Meeting ended');
            }
        },
    });

    useEffect(() => {
        if (roomId && !hasJoined.current && !joinMutation.isPending) {
            hasJoined.current = true;
            setConnectionState('joining');
            joinMutation.mutate({ meetingId: roomId });
        }
    }, [roomId]);

    const { isRecording, startRecording, stopRecording } =
        useMeetingRecorder(roomId);

    const handleLeave = () => {
        if (!hasLeft.current) {
            hasLeft.current = true;
            leaveMutation.mutate({ meetingId: roomId });
        }
        stopRecording();
        router.push('/dashboard/meet');
    };

    if (!token) {
        return (
            <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4">
                <Loader2 className="text-primary h-10 w-10 animate-spin" />
                <p className="text-muted-foreground animate-pulse">
                    {connectionState === 'joining'
                        ? 'Joining meeting...'
                        : connectionState === 'token-received'
                          ? 'Token received, initializing...'
                          : 'Connecting to meeting...'}
                </p>
                <p className="text-muted-foreground/60 text-xs">
                    State: {connectionState}
                </p>
            </div>
        );
    }

    return (
        <div
            className="w-full overflow-hidden"
            style={{ height: 'calc(100vh - 8rem)' }}
        >
            <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={'wss://anvaya-test-12husxpx.livekit.cloud'}
                style={{ height: '100%', width: '100%' }}
                onConnected={() => {
                    setConnectionState('connected');
                    toast.success('Connected to meeting');
                }}
                onDisconnected={() => {
                    setConnectionState('disconnected');
                    handleLeave();
                }}
                onError={(error) => {
                    setConnectionState('error');
                    toast.error('Connection error: ' + error.message);
                }}
                data-lk-theme="default"
            >
                <MeetingLayoutWrapper meetingId={roomId} />
                <RoomAudioRenderer />
            </LiveKitRoom>
        </div>
    );
}
