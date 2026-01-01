'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    MoreVertical,
    Search,
    Edit,
    Trash2,
    CheckCircle2,
    Circle,
    Clock,
    PauseCircle,
    XCircle,
    Eye,
    Loader2,
} from 'lucide-react';
import { trpc } from '@/providers/trpc-provider';
import { usePagination } from '@/hooks/use-pagination';
import { useSearchWithParams } from '@/hooks/use-search-with-params';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';
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
import { useAbility, Can } from '@/providers/ability-provider';
import { CreateTaskDialog } from './create-task-dialog';
import { EditTaskDialog } from './edit-task-dialog';
import { format } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from '@/components/ui/tooltip';

import { TaskFilters } from './task-filters';
import { useRouter } from 'next/navigation';

interface TaskListProps {
    projectIds: number[];
    setProjectIds: (ids: number[]) => void;
    sprintIds: number[];
    setSprintIds: (ids: number[]) => void;
    statuses: string[];
    setStatuses: (statuses: string[]) => void;
    projects: any[];
    organizationId?: number; // Added for RBAC
    hideProjectFilter?: boolean;
}

export function TaskList({
    projectIds,
    setProjectIds,
    sprintIds,
    setSprintIds,
    statuses,
    setStatuses,
    projects,
    organizationId,
    hideProjectFilter = false,
}: TaskListProps) {
    const { searchQuery, debouncedSearchQuery, setSearchQuery } =
        useSearchWithParams();
    const { currentPage, limit, handlePageChange } = usePagination();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [taskToDelete, setTaskToDelete] = useState<any>(null);
    const router = useRouter();
    const utils = trpc.useUtils();

    const {
        data: response,
        isLoading,
        refetch,
    } = trpc.task.search.useQuery({
        organizationId,
        projectIds: projectIds.length > 0 ? projectIds : undefined,
        sprintIds: sprintIds.length > 0 ? sprintIds : undefined,
        statuses: statuses.length > 0 ? statuses : undefined,
        query: debouncedSearchQuery,
        page: currentPage,
        limit,
    });

    const { data: sprintsData } = trpc.sprint.search.useQuery(
        {
            organizationId,
            projectIds: projectIds.length > 0 ? projectIds : undefined,
            limit: 1000,
        },
        { enabled: !!organizationId },
    );
    const sprints = sprintsData?.data || [];

    const deleteTaskMutation = trpc.task.delete.useMutation({
        onSuccess: () => {
            toast.success('Task deleted successfully');
            refetch();
            utils.task.search.invalidate();
            setTaskToDelete(null);
        },
        onError: (error) => {
            toast.error('Failed to delete task', {
                description: error.message,
            });
        },
    });

    const tasks = response?.data || [];
    const pagination = response?.pagination;

    const handleDeleteTask = () => {
        if (taskToDelete) {
            deleteTaskMutation.mutate({
                id: taskToDelete.id,
                organizationId: orgIdForRbac,
            });
        }
    };

    if (isLoading && !tasks.length) {
        return <TableSkeleton columns={4} rows={5} />;
    }

    const orgIdForRbac = organizationId || 0;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                );
            case 'in-progress':
                return (
                    <Clock className="h-4 w-4 flex-shrink-0 text-blue-500" />
                );
            case 'todo':
                return (
                    <Circle className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                );
            case 'on-hold':
                return (
                    <PauseCircle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                );
            case 'in-review':
                return (
                    <Eye className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                );
            case 'rejected':
                return (
                    <XCircle className="text-destructive h-4 w-4 flex-shrink-0" />
                );
            default:
                return (
                    <CheckCircle2 className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                );
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex w-full max-w-xl flex-1 items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <TaskFilters
                        projects={projects}
                        selectedProjectIds={projectIds}
                        setSelectedProjectIds={setProjectIds}
                        sprints={sprints}
                        selectedSprintIds={sprintIds}
                        setSelectedSprintIds={setSprintIds}
                        selectedStatuses={statuses}
                        setSelectedStatuses={setStatuses}
                        hideProjectFilter={hideProjectFilter}
                    />
                </div>
                <Can I="create" a={`org:${orgIdForRbac}:projects:tasks`}>
                    <CreateTaskDialog
                        projectId={
                            projectIds.length === 1 ? projectIds[0] : undefined
                        }
                        organizationId={orgIdForRbac}
                        sprintId={
                            sprintIds.length === 1 ? sprintIds[0] : undefined
                        }
                        open={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                        onTaskCreated={refetch}
                    />
                </Can>
            </div>

            <div className="overflow-x-auto rounded-md border">
                <TooltipProvider>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Task Name</TableHead>
                                {!hideProjectFilter && (
                                    <TableHead>Project</TableHead>
                                )}
                                <TableHead>Created By</TableHead>
                                <TableHead>Assignees</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={hideProjectFilter ? 5 : 6}
                                        className="h-24 text-center"
                                    >
                                        No tasks found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tasks.map((task: any) => (
                                    <TableRow
                                        key={task.id}
                                        className="hover:bg-accent hover:cursor-pointer"
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/tasks/${task.id}`,
                                            )
                                        }
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(task.status)}
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={`/dashboard/tasks/${task.id}`}
                                                        className="hover:text-primary font-medium transition-colors hover:underline"
                                                    >
                                                        {task.name}
                                                    </Link>
                                                    {hideProjectFilter && (
                                                        <span className="text-muted-foreground text-xs">
                                                            {task.sprint
                                                                ?.name ||
                                                                'No Sprint'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        {!hideProjectFilter && (
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">
                                                        {task.project?.name ||
                                                            'No Project'}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {task.sprint?.name ||
                                                            'No Sprint'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        )}
                                        <TableCell
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {task.creator ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage
                                                            src={
                                                                task.creator
                                                                    .image || ''
                                                            }
                                                            alt={
                                                                task.creator
                                                                    .name
                                                            }
                                                        />
                                                        <AvatarFallback className="text-[10px]">
                                                            {(
                                                                task.creator
                                                                    .name || '?'
                                                            )
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium">
                                                        {
                                                            task.creator.name?.split(
                                                                ' ',
                                                            )[0]
                                                        }
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">
                                                    Unknown
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {task.members &&
                                            task.members.length > 0 ? (
                                                <div className="flex items-center">
                                                    <div className="flex -space-x-2">
                                                        {task.members
                                                            .slice(0, 3)
                                                            .map(
                                                                (
                                                                    member: any,
                                                                ) => (
                                                                    <Tooltip
                                                                        key={
                                                                            member.id
                                                                        }
                                                                    >
                                                                        <TooltipTrigger
                                                                            asChild
                                                                        >
                                                                            <Avatar className="border-background h-7 w-7 border-2">
                                                                                <AvatarImage
                                                                                    src={
                                                                                        member.image ||
                                                                                        ''
                                                                                    }
                                                                                    alt={
                                                                                        member.name
                                                                                    }
                                                                                />
                                                                                <AvatarFallback className="text-xs">
                                                                                    {(
                                                                                        member.name ||
                                                                                        '?'
                                                                                    )
                                                                                        .slice(
                                                                                            0,
                                                                                            2,
                                                                                        )
                                                                                        .toUpperCase()}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>
                                                                                {
                                                                                    member.name
                                                                                }
                                                                            </p>
                                                                            <p className="text-muted-foreground text-xs">
                                                                                {
                                                                                    member.email
                                                                                }
                                                                            </p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                ),
                                                            )}
                                                        {task.members.length >
                                                            3 && (
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <div className="bg-muted border-background flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-medium">
                                                                        +
                                                                        {task
                                                                            .members
                                                                            .length -
                                                                            3}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {task.members
                                                                        .slice(
                                                                            3,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                m: any,
                                                                            ) => (
                                                                                <p
                                                                                    key={
                                                                                        m.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        m.name
                                                                                    }
                                                                                </p>
                                                                            ),
                                                                        )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">
                                                    Unassigned
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    task.status === 'done'
                                                        ? 'default'
                                                        : task.status ===
                                                            'in-progress'
                                                          ? 'secondary'
                                                          : task.status ===
                                                              'rejected'
                                                            ? 'destructive'
                                                            : 'outline'
                                                }
                                            >
                                                {task.status.replace('-', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {task.endDate ? (
                                                <span className="text-sm">
                                                    {format(
                                                        new Date(task.endDate),
                                                        'MMM d, yyyy',
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">
                                                    No due date
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>
                                                        Actions
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <Can
                                                        I="update"
                                                        a={`org:${orgIdForRbac}:projects:tasks`}
                                                    >
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedTask(
                                                                    task,
                                                                );
                                                                setIsEditDialogOpen(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Task
                                                        </DropdownMenuItem>
                                                    </Can>
                                                    <Can
                                                        I="delete"
                                                        a={`org:${orgIdForRbac}:projects:tasks`}
                                                    >
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() =>
                                                                setTaskToDelete(
                                                                    task,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Task
                                                        </DropdownMenuItem>
                                                    </Can>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TooltipProvider>
            </div>

            <EditTaskDialog
                task={selectedTask}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onTaskUpdated={refetch}
                organizationId={orgIdForRbac}
            />

            <AlertDialog
                open={!!taskToDelete}
                onOpenChange={(open) => !open && setTaskToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the task{' '}
                            <strong>{taskToDelete?.name}</strong>. This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteTask}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteTaskMutation.isPending}
                        >
                            {deleteTaskMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
