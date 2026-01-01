'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/providers/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    MoreHorizontal,
    Edit,
    Trash2,
    Calendar,
    Clock,
    CheckCircle2,
    Circle,
    PauseCircle,
    XCircle,
    Eye,
    Users,
    Folder,
    UserRoundX,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { Can } from '@/providers/ability-provider';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';
import { EditSprintDialog } from '@/components/app/dashboard/sprints/edit-sprint-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, differenceInDays } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamPerformance } from '@/components/app/dashboard/sprints/team-performance';
import { TaskList } from '@/components/app/dashboard/tasks/task-list';

export default function SprintPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sprintId = parseInt(params.id as string);
    const activeTab = searchParams.get('tab') || 'tasks';
    const utils = trpc.useUtils();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Task list states
    const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
    const [selectedSprintIds, setSelectedSprintIds] = useState<number[]>([
        sprintId,
    ]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    const {
        data: sprint,
        isLoading,
        refetch,
    } = trpc.sprint.getById.useQuery({ id: sprintId });

    const { data: tasksWithMembers } =
        trpc.task.getBySprintWithMembers.useQuery(
            { sprintId },
            { enabled: !!sprint },
        );

    const deleteSprintMutation = trpc.sprint.delete.useMutation({
        onSuccess: () => {
            toast.success('Sprint deleted successfully');
            utils.sprint.search.invalidate();
            router.push('/dashboard/sprints');
        },
        onError: (error) => {
            toast.error('Failed to delete sprint', {
                description: error.message,
            });
        },
    });

    const tasks = tasksWithMembers || [];

    const taskStats = useMemo(() => {
        const total = tasks.length;
        const done = tasks.filter((t: any) => t.status === 'done').length;
        const inProgress = tasks.filter(
            (t: any) => t.status === 'in-progress',
        ).length;
        const todo = tasks.filter((t: any) => t.status === 'todo').length;
        const progressPercent =
            total > 0 ? Math.round((done / total) * 100) : 0;

        return { total, done, inProgress, todo, progressPercent };
    }, [tasks]);

    const memberPerformance = useMemo(() => {
        const memberMap: Record<string, any> = {};

        for (const task of tasks) {
            for (const member of task.members || []) {
                if (!memberMap[member.id]) {
                    memberMap[member.id] = {
                        id: member.id,
                        name: member.name,
                        image: member.image,
                    };
                }
            }
        }

        return Object.values(memberMap);
    }, [tasks]);

    const { data: projectsData } = trpc.project.search.useQuery(
        { organizationId: sprint?.project?.organizationId || 0, limit: 100 },
        { enabled: !!sprint?.project?.organizationId },
    );
    const projects = projectsData?.data || [];

    const handleTabChange = (value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set('tab', value);
        const search = current.toString();
        const query = search ? `?${search}` : '';
        router.push(`${window.location.pathname}${query}`);
    };

    const handleDelete = () => {
        if (sprint) {
            deleteSprintMutation.mutate({
                id: sprint.id,
                organizationId: sprint.project?.organizationId || 0,
            });
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'in-progress':
                return <Clock className="h-4 w-4 text-blue-500" />;
            case 'todo':
                return <Circle className="text-muted-foreground h-4 w-4" />;
            case 'on-hold':
                return <PauseCircle className="h-4 w-4 text-amber-500" />;
            case 'in-review':
                return <Eye className="h-4 w-4 text-indigo-500" />;
            case 'rejected':
                return <XCircle className="text-destructive h-4 w-4" />;
            default:
                return <Circle className="text-muted-foreground h-4 w-4" />;
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!sprint) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">Sprint Not Found</h2>
                <Button asChild variant="outline">
                    <Link href="/dashboard/sprints">Back to Sprints</Link>
                </Button>
            </div>
        );
    }

    const orgId = sprint.project?.organizationId || 0;
    const daysRemaining = sprint.endDate
        ? differenceInDays(new Date(sprint.endDate), new Date())
        : null;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">
                            {sprint.name}
                        </h1>
                        <Badge
                            variant={
                                sprint.status === 'active'
                                    ? 'default'
                                    : sprint.status === 'completed'
                                      ? 'secondary'
                                      : 'outline'
                            }
                        >
                            {sprint.status}
                        </Badge>
                        {sprint.project && (
                            <Link
                                href={`/dashboard/projects/${sprint.project.id}`}
                            >
                                <Badge
                                    variant="outline"
                                    className="hover:bg-accent cursor-pointer"
                                >
                                    <Folder className="mr-1 h-3 w-3" />
                                    {sprint.project.name}
                                </Badge>
                            </Link>
                        )}
                    </div>
                    <div className="mt-2 max-w-2xl">
                        {sprint.description ? (
                            <TiptapViewer
                                content={sprint.description}
                                className="text-muted-foreground line-clamp-2 text-sm"
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No description
                            </p>
                        )}
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <Can I="update" a={`org:${orgId}:projects:sprints`}>
                            <DropdownMenuItem
                                onClick={() => setIsEditDialogOpen(true)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Sprint
                            </DropdownMenuItem>
                        </Can>
                        <DropdownMenuSeparator />
                        <Can I="delete" a={`org:${orgId}:projects:sprints`}>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Sprint
                            </DropdownMenuItem>
                        </Can>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                            Duration
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Calendar className="text-muted-foreground h-4 w-4" />
                            <span className="text-sm">
                                {sprint.startDate
                                    ? format(
                                          new Date(sprint.startDate),
                                          'MMM d',
                                      )
                                    : '—'}
                                {' → '}
                                {sprint.endDate
                                    ? format(new Date(sprint.endDate), 'MMM d')
                                    : '—'}
                            </span>
                        </div>
                        {daysRemaining !== null && daysRemaining >= 0 && (
                            <p className="text-muted-foreground mt-1 text-xs">
                                {daysRemaining} days left
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                            Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Progress
                                value={taskStats.progressPercent}
                                className="h-2 flex-1"
                            />
                            <span className="text-sm font-medium">
                                {taskStats.progressPercent}%
                            </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {taskStats.done}/{taskStats.total} done
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                            In Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <span className="text-2xl font-bold">
                                {taskStats.inProgress}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-muted-foreground text-sm font-medium">
                            Team
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="text-muted-foreground h-5 w-5" />
                            <span className="text-2xl font-bold">
                                {memberPerformance.length}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs - Project Style */}
            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
            >
                <TabsList className="mb-4 flex h-auto w-fit min-w-full justify-start gap-6 rounded-none border-b bg-transparent p-0 sm:min-w-0">
                    <TabsTrigger
                        value="tasks"
                        className="data-[state=active]:border-primary rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Tasks ({tasks.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="team"
                        className="data-[state=active]:border-primary rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Team Performance
                    </TabsTrigger>
                </TabsList>

                <div className="mt-[-1rem] py-4">
                    <TabsContent value="tasks" className="m-0">
                        <TaskList
                            projectIds={selectedProjectIds}
                            setProjectIds={setSelectedProjectIds}
                            sprintIds={selectedSprintIds}
                            setSprintIds={setSelectedSprintIds}
                            statuses={selectedStatuses}
                            setStatuses={setSelectedStatuses}
                            projects={projects}
                            organizationId={
                                sprint?.project?.organizationId || 0
                            }
                            hideProjectFilter={true}
                        />
                    </TabsContent>

                    <TabsContent value="team" className="m-0">
                        <TeamPerformance tasks={tasks} />
                    </TabsContent>
                </div>
            </Tabs>

            {/* Dialogs */}
            <EditSprintDialog
                sprint={sprint}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSprintUpdated={refetch}
                organizationId={orgId}
            />

            <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the sprint <strong>{sprint.name}</strong> and
                            remove its association with tasks.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteSprintMutation.isPending}
                        >
                            {deleteSprintMutation.isPending
                                ? 'Deleting...'
                                : 'Delete Sprint'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
