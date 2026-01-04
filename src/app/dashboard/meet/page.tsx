'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    Video,
    Plus,
    History,
    Link as LinkIcon,
    Loader2,
    Calendar,
    User,
    ArrowRight,
    VideoOff,
    Users,
    FolderKanban,
    Radio,
} from 'lucide-react';
import { trpc } from '@/server/trpc/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useOrganization } from '@/providers/organization-provider';

export default function MeetPage() {
    const router = useRouter();
    const { activeOrgId, isLoading: orgLoading } = useOrganization();

    const [roomName, setRoomName] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<
        number | undefined
    >();
    const [inviteCode, setInviteCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Fetch projects for current org
    const { data: projectsData } = trpc.project.search.useQuery(
        { organizationId: activeOrgId!, limit: 100 },
        { enabled: !!activeOrgId },
    );

    // Fetch active sessions for current org
    const { data: activeSessions, isLoading: activeLoading } =
        trpc.meet.getActiveSessions.useQuery(
            { organizationId: activeOrgId! },
            { enabled: !!activeOrgId },
        );

    // Fetch history for current org (only meetings user participated in)
    const { data: history, isLoading: historyLoading } =
        trpc.meet.getHistory.useQuery(
            { organizationId: activeOrgId ?? undefined },
            { enabled: !!activeOrgId },
        );

    const createMeeting = trpc.meet.create.useMutation({
        onSuccess: (meeting: any) => {
            toast.success('Meeting created!');
            router.push(`/dashboard/meet/${meeting.id}`);
        },
        onError: (err: any) => {
            toast.error(err.message);
            setIsCreating(false);
        },
    });

    const handleCreate = () => {
        if (!roomName) return toast.error('Please enter a room name');
        if (!activeOrgId) return toast.error('Please select an organization');

        setIsCreating(true);
        createMeeting.mutate({
            name: roomName,
            organizationId: activeOrgId,
            projectId: selectedProjectId,
        });
    };

    const utils = trpc.useUtils();

    const handleJoin = () => {
        if (!inviteCode) return toast.error('Please enter an invite code');
        toast.promise(
            (async () => {
                const meeting = await utils.meet.getRoom.fetch({ inviteCode });
                if (!meeting) throw new Error('Meeting not found');
                router.push(`/dashboard/meet/${meeting.id}`);
            })(),
            {
                loading: 'Joining meeting...',
                success: 'Joined!',
                error: (err: any) => err.message || 'Failed to join meeting',
            },
        );
    };

    if (orgLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin opacity-20" />
            </div>
        );
    }

    if (!activeOrgId) {
        return (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-4 p-12">
                <VideoOff className="h-12 w-12" />
                <p className="text-md text-center">
                    Please select an organization to view meetings.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 px-4">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
                <p className="text-muted-foreground">
                    Start a new meeting, join one, or view active sessions.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Create Room */}
                <Card className="border-primary/20 border-2 shadow-lg transition-shadow hover:shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="text-primary h-5 w-5" />
                            Create New Room
                        </CardTitle>
                        <CardDescription>
                            Start a new session for your organization.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Room name (e.g. Weekly Sync)"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && handleCreate()
                            }
                        />

                        <Select
                            value={selectedProjectId?.toString() || 'none'}
                            onValueChange={(val) =>
                                setSelectedProjectId(
                                    val === 'none' ? undefined : parseInt(val),
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select project (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No project</SelectItem>
                                {projectsData?.data?.map((project: any) => (
                                    <SelectItem
                                        key={project.id}
                                        value={project.id.toString()}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FolderKanban className="h-4 w-4" />
                                            {project.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            className="w-full"
                            onClick={handleCreate}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Video className="mr-2 h-4 w-4" />
                            )}
                            Start Meeting
                        </Button>
                    </CardContent>
                </Card>

                {/* Join Room */}
                <Card className="border-muted border-2 shadow-md transition-shadow hover:shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LinkIcon className="h-5 w-5" />
                            Join with Code
                        </CardTitle>
                        <CardDescription>
                            Enter an invite code to join a meeting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Invite code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        />
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleJoin}
                        >
                            Join
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Active Sessions & History Tabs */}
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger
                        value="active"
                        className="flex items-center gap-2"
                    >
                        <Radio className="h-4 w-4" />
                        Active Sessions
                        {activeSessions && activeSessions.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {activeSessions.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="flex items-center gap-2"
                    >
                        <History className="h-4 w-4" />
                        History
                    </TabsTrigger>
                </TabsList>

                {/* Active Sessions Tab */}
                <TabsContent value="active" className="mt-4">
                    {activeLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin opacity-20" />
                        </div>
                    ) : activeSessions && activeSessions.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {activeSessions.map((session: any) => (
                                <Card
                                    key={session.id}
                                    className="hover:bg-muted/50 border-l-4 border-l-green-500 transition-colors"
                                >
                                    <CardContent className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                                                <Radio className="h-5 w-5 animate-pulse" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">
                                                        {session.name}
                                                    </h3>
                                                    <Badge
                                                        variant="default"
                                                        className="bg-green-500"
                                                    >
                                                        Live
                                                    </Badge>
                                                </div>
                                                <div className="text-muted-foreground mt-1 flex items-center gap-4 text-xs">
                                                    {session.project && (
                                                        <span className="flex items-center gap-1">
                                                            <FolderKanban className="h-3 w-3" />
                                                            {
                                                                session.project
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {
                                                            session.activeParticipantCount
                                                        }{' '}
                                                        participant
                                                        {session.activeParticipantCount !==
                                                        1
                                                            ? 's'
                                                            : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4" />
                                                <span>
                                                    {session.host?.name ||
                                                        'Unknown'}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    router.push(
                                                        `/dashboard/meet/${session.id}`,
                                                    )
                                                }
                                            >
                                                Join
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="text-muted-foreground flex flex-col items-center justify-center gap-2 border-dashed p-12">
                            <VideoOff className="h-8 w-8" />
                            <p className="text-md text-center">
                                No active meetings in this organization.
                            </p>
                        </Card>
                    )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="mt-4">
                    {historyLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin opacity-20" />
                        </div>
                    ) : history && history.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                            {history.map((item: any, index: number) => (
                                <Card
                                    key={`${index}-${item.meeting.id}`}
                                    className="hover:bg-muted/50 transition-colors"
                                >
                                    <CardContent className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">
                                                    {item.meeting.name}
                                                </h3>
                                                <div className="text-muted-foreground mt-1 flex items-center gap-4 text-xs">
                                                    <span>
                                                        {format(
                                                            new Date(
                                                                item.joinedAt,
                                                            ),
                                                            'PPP p',
                                                        )}
                                                    </span>
                                                    {item.meeting.project && (
                                                        <span className="flex items-center gap-1">
                                                            <FolderKanban className="h-3 w-3" />
                                                            {
                                                                item.meeting
                                                                    .project
                                                                    .name
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4" />
                                                <span>
                                                    Hosted by{' '}
                                                    {item.meeting.host?.name ||
                                                        'Unknown'}
                                                </span>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    router.push(
                                                        `/dashboard/meet/history/${item.meeting.id}`,
                                                    )
                                                }
                                            >
                                                View Details{' '}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="text-muted-foreground flex flex-col items-center justify-center gap-2 border-dashed p-12">
                            <VideoOff className="h-8 w-8" />
                            <p className="text-md text-center">
                                No meeting history found.
                            </p>
                            <p className="text-sm">
                                Completed meetings you participated in will
                                appear here.
                            </p>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
