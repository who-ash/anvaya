'use client';

import { useParams, useRouter } from 'next/navigation';
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
    Folder,
    Zap,
    CalendarDays,
    Send,
    MessageSquare,
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
import { useState } from 'react';
import { Can } from '@/providers/ability-provider';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';
import { EditTaskDialog } from '@/components/app/dashboard/tasks/edit-task-dialog';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

export default function TaskPage() {
    const params = useParams();
    const router = useRouter();
    const taskId = parseInt(params.id as string);
    const utils = trpc.useUtils();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [newComment, setNewComment] = useState('');

    const {
        data: task,
        isLoading,
        refetch,
    } = trpc.task.getById.useQuery({ id: taskId });
    const { data: comments, refetch: refetchComments } =
        trpc.taskComment.getByTaskId.useQuery({ taskId }, { enabled: !!task });

    const createCommentMutation = trpc.taskComment.create.useMutation({
        onSuccess: () => {
            setNewComment('');
            refetchComments();
            toast.success('Comment added');
        },
        onError: (error) => {
            toast.error('Failed to add comment', {
                description: error.message,
            });
        },
    });

    const deleteTaskMutation = trpc.task.delete.useMutation({
        onSuccess: () => {
            toast.success('Task deleted successfully');
            utils.task.search.invalidate();
            router.push('/dashboard/tasks');
        },
        onError: (error) => {
            toast.error('Failed to delete task', {
                description: error.message,
            });
        },
    });

    const handleDelete = () => {
        if (task) {
            deleteTaskMutation.mutate({
                id: task.id,
                organizationId: task.project?.organizationId || 0,
            });
        }
    };

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        createCommentMutation.mutate({
            taskId,
            comment: newComment,
        });
    };

    const getStatusIcon = (status: string, size = 'h-5 w-5') => {
        switch (status) {
            case 'done':
                return <CheckCircle2 className={`${size} text-green-500`} />;
            case 'in-progress':
                return <Clock className={`${size} text-blue-500`} />;
            case 'todo':
                return <Circle className={`${size} text-muted-foreground`} />;
            case 'on-hold':
                return <PauseCircle className={`${size} text-amber-500`} />;
            case 'in-review':
                return <Eye className={`${size} text-indigo-500`} />;
            case 'rejected':
                return <XCircle className={`${size} text-destructive`} />;
            default:
                return <Circle className={`${size} text-muted-foreground`} />;
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            todo: 'To Do',
            'in-progress': 'In Progress',
            done: 'Done',
            'on-hold': 'On Hold',
            'in-review': 'In Review',
            rejected: 'Rejected',
        };
        return labels[status] || status;
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
            <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="w-72 space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">Task Not Found</h2>
                <Button asChild variant="outline">
                    <Link href="/dashboard/tasks">Back to Tasks</Link>
                </Button>
            </div>
        );
    }

    const orgId = task.project?.organizationId || 0;

    return (
        <div className="flex flex-col gap-6 lg:flex-row">
            {/* Main Content */}
            <div className="min-w-0 flex-1 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                        {getStatusIcon(task.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="mb-1 text-xl font-bold tracking-tight break-words lg:text-2xl">
                                    {task.name}
                                </h1>
                                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                                    <Badge
                                        variant={
                                            task.status === 'done'
                                                ? 'default'
                                                : task.status === 'in-progress'
                                                  ? 'secondary'
                                                  : task.status === 'rejected'
                                                    ? 'destructive'
                                                    : 'outline'
                                        }
                                        className="gap-1"
                                    >
                                        {getStatusIcon(task.status, 'h-3 w-3')}
                                        {getStatusLabel(task.status)}
                                    </Badge>
                                    <span>•</span>
                                    <span>
                                        {formatDistanceToNow(
                                            new Date(task.createdAt),
                                            { addSuffix: true },
                                        )}
                                    </span>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0"
                                    >
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <Can
                                        I="update"
                                        a={`org:${orgId}:projects:tasks`}
                                    >
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setIsEditDialogOpen(true)
                                            }
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Task
                                        </DropdownMenuItem>
                                    </Can>
                                    <DropdownMenuSeparator />
                                    <Can
                                        I="delete"
                                        a={`org:${orgId}:projects:tasks`}
                                    >
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() =>
                                                setIsDeleteDialogOpen(true)
                                            }
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Task
                                        </DropdownMenuItem>
                                    </Can>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h2 className="text-muted-foreground mb-2 text-sm font-medium">
                        Description
                    </h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {task.description ? (
                            <TiptapViewer content={task.description} />
                        ) : (
                            <p className="text-muted-foreground italic">
                                No description provided
                            </p>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Comments Section */}
                <div>
                    <h2 className="text-muted-foreground mb-4 flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="h-4 w-4" />
                        Comments ({comments?.length || 0})
                    </h2>

                    {/* Add Comment Form */}
                    <form onSubmit={handleSubmitComment} className="mb-6">
                        <div className="flex gap-3">
                            <Textarea
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-[80px] resize-none"
                            />
                        </div>
                        <div className="mt-2 flex justify-end">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={
                                    !newComment.trim() ||
                                    createCommentMutation.isPending
                                }
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {createCommentMutation.isPending
                                    ? 'Sending...'
                                    : 'Comment'}
                            </Button>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4">
                        {comments?.length === 0 ? (
                            <p className="text-muted-foreground py-8 text-center">
                                No comments yet. Be the first to comment!
                            </p>
                        ) : (
                            comments?.map((comment: any) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage
                                            src={comment.user?.image || ''}
                                            alt={comment.user?.name || ''}
                                        />
                                        <AvatarFallback className="text-xs">
                                            {comment.user?.name
                                                ? getInitials(comment.user.name)
                                                : '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {comment.user?.name ||
                                                    'Unknown'}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {formatDistanceToNow(
                                                    new Date(comment.createdAt),
                                                    { addSuffix: true },
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">
                                            {comment.comment}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <aside className="w-full shrink-0 space-y-6 lg:w-72 lg:border-l lg:pl-6">
                {/* Project */}
                <div>
                    <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                        Project
                    </h3>
                    {task.project ? (
                        <Link
                            href={`/dashboard/projects/${task.project.id}`}
                            className="hover:text-primary flex items-center gap-2 text-sm transition-colors"
                        >
                            <Folder className="h-4 w-4 text-blue-500" />
                            <span className="truncate">
                                {task.project.name}
                            </span>
                        </Link>
                    ) : (
                        <span className="text-muted-foreground text-sm">
                            No project
                        </span>
                    )}
                </div>

                {/* Sprint */}
                <div>
                    <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                        Sprint
                    </h3>
                    {task.sprint ? (
                        <Link
                            href={`/dashboard/sprints/${task.sprint.id}`}
                            className="hover:text-primary flex items-center gap-2 text-sm transition-colors"
                        >
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="truncate">{task.sprint.name}</span>
                        </Link>
                    ) : (
                        <span className="text-muted-foreground text-sm">
                            No sprint
                        </span>
                    )}
                </div>

                <Separator />

                {/* Timeline */}
                <div>
                    <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                        Timeline
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                            <Calendar className="text-muted-foreground mt-0.5 h-4 w-4" />
                            <div>
                                <span className="text-muted-foreground block">
                                    Start Date
                                </span>
                                <span className="font-medium">
                                    {task.startDate
                                        ? format(
                                              new Date(task.startDate),
                                              'MMM d, yyyy h:mm a',
                                          )
                                        : 'Not set'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <CalendarDays className="text-muted-foreground mt-0.5 h-4 w-4" />
                            <div>
                                <span className="text-muted-foreground block">
                                    Due Date
                                </span>
                                <span
                                    className={cn(
                                        'font-medium',
                                        task.endDate &&
                                            new Date(task.endDate) <
                                                new Date() &&
                                            task.status !== 'done'
                                            ? 'text-destructive'
                                            : '',
                                    )}
                                >
                                    {task.endDate
                                        ? format(
                                              new Date(task.endDate),
                                              'MMM d, yyyy h:mm a',
                                          )
                                        : 'Not set'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Assignees */}
                <div>
                    <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                        Assignees ({task.members?.length || 0})
                    </h3>
                    {task.members && task.members.length > 0 ? (
                        <div className="space-y-2">
                            {task.members.map((member: any) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-2"
                                >
                                    <Avatar className="h-7 w-7">
                                        <AvatarImage
                                            src={member.image || ''}
                                            alt={member.name}
                                        />
                                        <AvatarFallback className="text-xs">
                                            {getInitials(
                                                member.name || 'Unknown',
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {member.name || 'Unknown'}
                                        </p>
                                        <p className="text-muted-foreground truncate text-xs">
                                            {member.email}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-muted-foreground text-sm">
                            <p>No assignees</p>
                            <Can I="update" a={`org:${orgId}:projects:tasks`}>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs"
                                    onClick={() => setIsEditDialogOpen(true)}
                                >
                                    + Add assignees
                                </Button>
                            </Can>
                        </div>
                    )}
                </div>
            </aside>

            {/* Dialogs */}
            <EditTaskDialog
                task={task}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onTaskUpdated={refetch}
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
                            delete the task <strong>{task.name}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteTaskMutation.isPending}
                        >
                            {deleteTaskMutation.isPending
                                ? 'Deleting...'
                                : 'Delete Task'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
