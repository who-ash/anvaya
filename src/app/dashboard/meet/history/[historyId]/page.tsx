'use client';

import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/server/trpc/client';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    ArrowLeft,
    Download,
    FileText,
    Play,
    User,
    Calendar,
    Clock,
    Loader2,
    Users,
    MessageSquare,
    FolderKanban,
    Music,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';

export default function MeetingHistoryDetailPage() {
    const { historyId } = useParams() as { historyId: string };
    const router = useRouter();

    const {
        data: meeting,
        isLoading,
        error,
    } = trpc.meet.getById.useQuery({
        id: historyId,
    });

    const { data: messages } = trpc.meet.getMessages.useQuery(
        { meetingId: historyId },
        { enabled: !!meeting },
    );

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin opacity-20" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 p-12">
                <p>{error.message}</p>
                <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/meet')}
                >
                    Back to Meetings
                </Button>
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 p-12">
                <p>Meeting not found</p>
                <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/meet')}
                >
                    Back to Meetings
                </Button>
            </div>
        );
    }

    const recording = meeting.recordings?.[0];
    const hasTranscript = recording?.transcriptJson;
    const hasAudio = recording?.wavUrl;

    // Parse transcript if available
    let transcriptText = '';
    if (hasTranscript && recording?.transcriptJson) {
        try {
            const parsed = JSON.parse(recording.transcriptJson);
            transcriptText =
                parsed.results?.channels?.[0]?.alternatives?.[0]?.transcript ||
                '';
        } catch {
            transcriptText = '';
        }
    }

    return (
        <div className="flex flex-col gap-6 px-4">
            {/* Header */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {meeting.name}
                    </h1>
                    <Badge variant="secondary">Ended</Badge>
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(meeting.createdAt), 'PPP')}
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(meeting.createdAt), 'p')}
                        {meeting.endedAt && (
                            <span>
                                {' '}
                                - {format(new Date(meeting.endedAt), 'p')}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Hosted by {meeting.host?.name || 'Unknown'}
                    </div>
                    {meeting.project && (
                        <div className="flex items-center gap-1">
                            <FolderKanban className="h-4 w-4" />
                            {meeting.project.name}
                        </div>
                    )}
                </div>
            </div>

            {/* Links for Recording and Transcript */}
            {(hasAudio || transcriptText) && (
                <div className="flex flex-wrap gap-4 text-sm">
                    {hasAudio && recording?.wavUrl && (
                        <a
                            href={recording.wavUrl}
                            target="_blank"
                            className="text-primary flex items-center gap-1.5 hover:underline"
                        >
                            <Music className="h-4 w-4" />
                            Download Recording
                        </a>
                    )}
                    {recording?.transcriptUrl && (
                        <a
                            href={recording.transcriptUrl}
                            target="_blank"
                            className="text-primary flex items-center gap-1.5 hover:underline"
                        >
                            <FileText className="h-4 w-4" />
                            View Transcript
                        </a>
                    )}
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Chat Messages */}
                <div className="lg:col-span-2">
                    <div className="mb-3 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Chat Messages</h2>
                        {messages && messages.length > 0 && (
                            <Badge variant="secondary">{messages.length}</Badge>
                        )}
                    </div>
                    {messages && messages.length > 0 ? (
                        <ScrollArea className="h-96">
                            <div className="space-y-1">
                                {messages.map((msg: any, idx: number) => {
                                    const showHeader =
                                        idx === 0 ||
                                        messages[idx - 1].senderId !==
                                            msg.senderId;

                                    return (
                                        <div
                                            key={msg.id}
                                            className="flex gap-3"
                                        >
                                            <div
                                                className={`w-8 flex-shrink-0 ${!showHeader ? 'invisible' : ''}`}
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage
                                                        src={
                                                            msg.sender?.image ||
                                                            undefined
                                                        }
                                                    />
                                                    <AvatarFallback className="bg-primary/10 text-xs">
                                                        {(
                                                            msg.sender?.name ||
                                                            'U'
                                                        )
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                {showHeader && (
                                                    <div className="mb-0.5 flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {msg.sender?.name ||
                                                                'Unknown'}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs">
                                                            {new Date(
                                                                msg.createdAt,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="text-sm">
                                                    <TiptapViewer
                                                        content={msg.content}
                                                        className="chat-message-content"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="bg-muted text-muted-foreground rounded-lg p-4 text-sm italic">
                            No chat messages in this meeting.
                        </div>
                    )}
                </div>

                {/* Participants */}
                <div>
                    <div className="mb-3 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Participants</h2>
                        <Badge variant="secondary">
                            {/* Deduplicate by userId */}
                            {
                                [
                                    ...new Set(
                                        meeting.participants?.map(
                                            (p: any) => p.userId,
                                        ) || [],
                                    ),
                                ].length
                            }
                        </Badge>
                    </div>
                    {meeting.participants && meeting.participants.length > 0 ? (
                        <div className="space-y-2">
                            {/* Deduplicate participants by userId, keep first join time */}
                            {Object.values(
                                meeting.participants.reduce(
                                    (acc: any, p: any) => {
                                        if (!acc[p.userId]) {
                                            acc[p.userId] = p;
                                        }
                                        return acc;
                                    },
                                    {},
                                ),
                            ).map((p: any) => (
                                <div
                                    key={p.userId}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full">
                                            <User className="h-3 w-3" />
                                        </div>
                                        <span>{p.user?.name || 'Unknown'}</span>
                                    </div>
                                    <span className="text-muted-foreground text-xs">
                                        {format(new Date(p.joinedAt), 'p')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-muted-foreground text-sm italic">
                            No participant data available.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
