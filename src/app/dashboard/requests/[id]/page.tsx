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
    Bug,
    Lightbulb,
    MessageSquare,
    HelpCircle,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    Send,
    User,
    Calendar,
    ChevronDown,
    ChevronUp,
    Reply,
    UserPlus,
    Folder,
    Zap,
    ListTodo,
    ExternalLink,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useOrganization } from '@/providers/organization-provider';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';
import TiptapEditor from '@/components/app/tiptap/tiptap-editor';
import { REQUEST_TEMPLATES, TemplateField } from '@/lib/request-templates';

const typeIcons: Record<string, React.ReactNode> = {
    bug: <Bug className="h-5 w-5" />,
    feature_request: <Lightbulb className="h-5 w-5" />,
    feedback: <MessageSquare className="h-5 w-5" />,
    query: <HelpCircle className="h-5 w-5" />,
};

const typeBgColors: Record<string, string> = {
    bug: 'bg-red-50 dark:bg-red-950/20',
    feature_request: 'bg-amber-50 dark:bg-amber-950/20',
    feedback: 'bg-blue-50 dark:bg-blue-950/20',
    query: 'bg-purple-50 dark:bg-purple-950/20',
};

const typeLabels: Record<string, string> = {
    bug: 'Bug Report',
    feature_request: 'Feature Request',
    feedback: 'Feedback',
    query: 'Query',
};

const statusIcons: Record<string, React.ReactNode> = {
    open: <AlertCircle className="h-4 w-4" />,
    'in-progress': <Clock className="h-4 w-4" />,
    resolved: <CheckCircle2 className="h-4 w-4" />,
    closed: <CheckCircle2 className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
};

export default function RequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { activeOrgId } = useOrganization();
    const requestId = parseInt(params.id as string);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyToId, setReplyToId] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [expandedSections, setExpandedSections] = useState<
        Record<string, boolean>
    >({});
    const replyFormRef = useRef<HTMLFormElement>(null);

    // Scroll to reply form when it opens
    useEffect(() => {
        if (replyToId && replyFormRef.current) {
            replyFormRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [replyToId]);

    const {
        data: request,
        isLoading,
        refetch,
    } = trpc.request.getById.useQuery({ id: requestId });

    const { data: comments, refetch: refetchComments } =
        trpc.request.getComments.useQuery(
            { requestId },
            { enabled: !!request },
        );

    // Get project members for assignee dropdown
    const { data: projectMembers } = trpc.project.getMembers.useQuery(
        { projectId: request?.projectId || 0 },
        { enabled: !!request?.projectId },
    );

    const createCommentMutation = trpc.request.createComment.useMutation({
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

    const updateRequestMutation = trpc.request.update.useMutation({
        onSuccess: () => {
            refetch();
            toast.success('Request updated');
        },
        onError: (error) => {
            toast.error('Failed to update request', {
                description: error.message,
            });
        },
    });

    const deleteRequestMutation = trpc.request.delete.useMutation({
        onSuccess: () => {
            toast.success('Request deleted successfully');
            router.push('/dashboard/requests');
        },
        onError: (error) => {
            toast.error('Failed to delete request', {
                description: error.message,
            });
        },
    });

    const handleDelete = () => {
        if (request && activeOrgId) {
            deleteRequestMutation.mutate({
                id: request.id,
                organizationId: activeOrgId,
            });
        }
    };

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || newComment === '<p></p>') return;
        createCommentMutation.mutate({
            requestId,
            content: newComment,
        });
    };

    const handleStatusChange = (status: string) => {
        if (request && activeOrgId) {
            updateRequestMutation.mutate({
                id: request.id,
                organizationId: activeOrgId,
                status: status as any,
            });
        }
    };

    const handleAssigneeChange = (assigneeId: string) => {
        if (request && activeOrgId) {
            updateRequestMutation.mutate({
                id: request.id,
                organizationId: activeOrgId,
                assigneeId: assigneeId === 'unassigned' ? null : assigneeId,
            });
        }
    };

    const handleSubmitReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim() || replyContent === '<p></p>' || !replyToId)
            return;
        createCommentMutation.mutate({
            requestId,
            parentId: replyToId,
            content: replyContent,
        });
        setReplyToId(null);
        setReplyContent('');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
        }));
    };

    // Get content from the request's structured content JSON
    const getFieldContent = (fieldId: string) => {
        const content = request?.content as Record<string, any> | null;
        return content?.[fieldId] || null;
    };

    // Get the template for this request type
    const template = request ? REQUEST_TEMPLATES[request.type] : null;

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

    if (!request) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">Request Not Found</h2>
                <Button asChild variant="outline">
                    <Link href="/dashboard/requests">Back to Requests</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 scroll-smooth lg:flex-row lg:items-start">
            {/* Main Content */}
            <div className="min-w-0 flex-1 space-y-6 p-1">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="mb-1 text-xl font-bold tracking-tight break-words lg:text-2xl">
                                    {request.title}
                                </h1>
                                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                                    <span>#{request.id}</span>
                                    <span>•</span>
                                    <span>
                                        {formatDistanceToNow(
                                            new Date(request.createdAt),
                                            {
                                                addSuffix: true,
                                            },
                                        )}
                                    </span>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className="h-7 gap-1.5 px-2"
                                    >
                                        {typeIcons[request.type]}
                                        {typeLabels[request.type]}
                                    </Badge>

                                    <Badge
                                        variant="secondary"
                                        className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 transition-colors"
                                        asChild
                                    >
                                        <Link
                                            href={`/dashboard/projects/${request.projectId}`}
                                        >
                                            <Folder className="h-3.5 w-3.5" />
                                            {request.project?.name || 'Project'}
                                        </Link>
                                    </Badge>
                                    {request.sprint && (
                                        <Badge
                                            variant="secondary"
                                            className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 transition-colors"
                                            asChild
                                        >
                                            <Link
                                                href={`/dashboard/projects/${request.projectId}/sprints/${request.sprintId}`}
                                            >
                                                <Zap className="h-3.5 w-3.5" />
                                                {request.sprint.name}
                                            </Link>
                                        </Badge>
                                    )}
                                    {request.task && (
                                        <Badge
                                            variant="secondary"
                                            className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 transition-colors"
                                            asChild
                                        >
                                            <Link
                                                href={`/dashboard/projects/${request.projectId}/tasks/${request.taskId}`}
                                            >
                                                <ListTodo className="h-3.5 w-3.5" />
                                                {request.task.name}
                                            </Link>
                                        </Badge>
                                    )}
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
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/dashboard/requests/${request.id}/edit`}
                                        >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Request
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() =>
                                            setIsDeleteDialogOpen(true)
                                        }
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Request
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Structured Content based on template */}
                {template && (
                    <div className="space-y-6">
                        {template.schema.fields
                            .filter((field) => {
                                const content = getFieldContent(field.id);
                                if (typeof content === 'string') {
                                    return (
                                        content.trim() && content !== '<p></p>'
                                    );
                                }
                                return !!content;
                            })
                            .map((field) => {
                                const content = getFieldContent(field.id);
                                const isRichText =
                                    field.type === 'richtext' ||
                                    field.type === 'textarea';

                                return (
                                    <div key={field.id} className="space-y-1.5">
                                        <h3 className="text-foreground/80 text-sm font-bold">
                                            {field.label}
                                        </h3>
                                        <div className="text-foreground/90 text-sm leading-relaxed">
                                            {isRichText ? (
                                                <TiptapViewer
                                                    content={content}
                                                />
                                            ) : field.type === 'select' ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="font-normal"
                                                >
                                                    {content}
                                                </Badge>
                                            ) : field.type === 'file' &&
                                              Array.isArray(content) ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {content.map(
                                                        (
                                                            url: string,
                                                            i: number,
                                                        ) => (
                                                            <a
                                                                key={i}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary inline-flex items-center gap-1.5 hover:underline"
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5" />
                                                                Attachment{' '}
                                                                {i + 1}
                                                            </a>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <p>{String(content)}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}

                {/* Fallback description if no structured content */}
                {!template && request.description && (
                    <div className="space-y-1.5">
                        <h3 className="text-foreground/80 text-sm font-semibold">
                            Description
                        </h3>
                        <div className="text-foreground/90 text-sm leading-relaxed">
                            <TiptapViewer content={request.description} />
                        </div>
                    </div>
                )}

                <Separator />

                {/* Comments Section */}
                <div>
                    <h2 className="text-muted-foreground mb-4 flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="h-4 w-4" />
                        Discussion ({comments?.length || 0})
                    </h2>

                    {/* Add Comment Form */}
                    <form onSubmit={handleSubmitComment} className="mb-6">
                        <div className="rounded-md border">
                            <TiptapEditor
                                initialContent={newComment || '<p></p>'}
                                placeholder="Add to the discussion..."
                                onChange={setNewComment}
                                className="min-h-[100px]"
                            />
                        </div>
                        <div className="mt-2 flex justify-end">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={
                                    !newComment.trim() ||
                                    newComment === '<p></p>' ||
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

                    <div className="space-y-4">
                        {comments?.length === 0 ? (
                            <p className="text-muted-foreground bg-muted/20 rounded-lg py-8 text-center">
                                No comments yet. Start the discussion!
                            </p>
                        ) : (
                            comments
                                ?.filter((c: any) => !c.parentId) // Top-level comments
                                .map((comment: any) => (
                                    <div key={comment.id} className="space-y-4">
                                        <div className="flex gap-3">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarImage
                                                    src={
                                                        comment.user?.image ||
                                                        ''
                                                    }
                                                    alt={
                                                        comment.user?.name || ''
                                                    }
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {comment.user?.name
                                                        ? getInitials(
                                                              comment.user.name,
                                                          )
                                                        : '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold">
                                                            {comment.user
                                                                ?.name ||
                                                                'Unknown'}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs">
                                                            {formatDistanceToNow(
                                                                new Date(
                                                                    comment.createdAt,
                                                                ),
                                                                {
                                                                    addSuffix: true,
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground hover:text-primary h-7 px-2 text-xs"
                                                        onClick={() =>
                                                            setReplyToId(
                                                                replyToId ===
                                                                    comment.id
                                                                    ? null
                                                                    : comment.id,
                                                            )
                                                        }
                                                    >
                                                        <Reply className="mr-1 h-3 w-3" />
                                                        Reply
                                                    </Button>
                                                </div>
                                                <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                                                    <TiptapViewer
                                                        content={
                                                            comment.content
                                                        }
                                                    />
                                                </div>

                                                {/* Replies List */}
                                                {comments.some(
                                                    (c: any) =>
                                                        c.parentId ===
                                                        comment.id,
                                                ) && (
                                                    <div className="mt-4 space-y-4 border-l-2 pl-4">
                                                        {comments
                                                            .filter(
                                                                (c: any) =>
                                                                    c.parentId ===
                                                                    comment.id,
                                                            )
                                                            .map(
                                                                (
                                                                    reply: any,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            reply.id
                                                                        }
                                                                        className="flex gap-2"
                                                                    >
                                                                        <Avatar className="mt-0.5 h-6 w-6 shrink-0">
                                                                            <AvatarImage
                                                                                src={
                                                                                    reply
                                                                                        .user
                                                                                        ?.image ||
                                                                                    ''
                                                                                }
                                                                                alt={
                                                                                    reply
                                                                                        .user
                                                                                        ?.name ||
                                                                                    ''
                                                                                }
                                                                            />
                                                                            <AvatarFallback className="text-[10px]">
                                                                                {reply
                                                                                    .user
                                                                                    ?.name
                                                                                    ? getInitials(
                                                                                          reply
                                                                                              .user
                                                                                              .name,
                                                                                      )
                                                                                    : '?'}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="mb-0.5 flex items-center gap-2">
                                                                                <span className="text-xs font-semibold">
                                                                                    {reply
                                                                                        .user
                                                                                        ?.name ||
                                                                                        'Unknown'}
                                                                                </span>
                                                                                <span className="text-muted-foreground text-[10px]">
                                                                                    {formatDistanceToNow(
                                                                                        new Date(
                                                                                            reply.createdAt,
                                                                                        ),
                                                                                        {
                                                                                            addSuffix: true,
                                                                                        },
                                                                                    )}
                                                                                </span>
                                                                            </div>
                                                                            <div className="text-xs">
                                                                                <TiptapViewer
                                                                                    content={
                                                                                        reply.content
                                                                                    }
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                    </div>
                                                )}

                                                {/* Reply field at bottom of thread */}
                                                {replyToId === comment.id && (
                                                    <form
                                                        ref={replyFormRef}
                                                        onSubmit={
                                                            handleSubmitReply
                                                        }
                                                        className="mt-4 space-y-2"
                                                    >
                                                        <div className="bg-background overflow-hidden rounded-md border">
                                                            <TiptapEditor
                                                                initialContent={
                                                                    replyContent
                                                                }
                                                                placeholder={`Reply to ${comment.user?.name}...`}
                                                                onChange={
                                                                    setReplyContent
                                                                }
                                                                className="min-h-[80px]"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setReplyToId(
                                                                        null,
                                                                    );
                                                                    setReplyContent(
                                                                        '',
                                                                    );
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                type="submit"
                                                                size="sm"
                                                                disabled={
                                                                    !replyContent.trim() ||
                                                                    replyContent ===
                                                                        '<p></p>' ||
                                                                    createCommentMutation.isPending
                                                                }
                                                            >
                                                                {createCommentMutation.isPending
                                                                    ? 'Sending...'
                                                                    : 'Post Reply'}
                                                            </Button>
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <aside className="bg-background/50 sticky top-[5.5rem] w-full shrink-0 space-y-6 self-start pb-10 backdrop-blur-sm lg:w-72 lg:border-l lg:pl-6">
                {/* Status */}
                <div>
                    <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                        Status
                    </h3>
                    <Select
                        value={request.status}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue>
                                <div className="flex items-center gap-2">
                                    {statusIcons[request.status]}
                                    <span className="capitalize">
                                        {request.status}
                                    </span>
                                </div>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="open">
                                <div className="flex items-center gap-2">
                                    Open
                                </div>
                            </SelectItem>
                            <SelectItem value="in-progress">
                                <div className="flex items-center gap-2">
                                    In Progress
                                </div>
                            </SelectItem>
                            <SelectItem value="resolved">
                                <div className="flex items-center gap-2">
                                    Resolved
                                </div>
                            </SelectItem>
                            <SelectItem value="closed">
                                <div className="flex items-center gap-2">
                                    Closed
                                </div>
                            </SelectItem>
                            <SelectItem value="rejected">
                                <div className="flex items-center gap-2">
                                    Rejected
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Priority */}
                <div>
                    <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                        Priority
                    </h3>
                    <Badge variant="secondary" className="capitalize">
                        {request.priority}
                    </Badge>
                </div>

                <Separator />

                {/* Assignee */}
                <div>
                    <h3 className="text-muted-foreground mb-3 text-[10px] font-semibold tracking-wider uppercase">
                        Assignee
                    </h3>
                    <Select
                        value={request.assigneeId || 'unassigned'}
                        onValueChange={handleAssigneeChange}
                    >
                        <SelectTrigger className="hover:bg-muted/50 h-auto w-full border-none bg-transparent px-0 shadow-none transition-colors focus:ring-0">
                            <SelectValue>
                                {request.assignee ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage
                                                src={
                                                    request.assignee.image || ''
                                                }
                                                alt={
                                                    request.assignee.name || ''
                                                }
                                            />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(
                                                    request.assignee.name ||
                                                        'U',
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="truncate text-sm font-medium">
                                                {request.assignee.name ||
                                                    'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed">
                                            <UserPlus className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-sm">
                                            Assign to someone
                                        </span>
                                    </div>
                                )}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                value="unassigned"
                                className="text-muted-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Unassigned
                                </div>
                            </SelectItem>
                            {projectMembers?.map((member) => (
                                <SelectItem
                                    key={member.id}
                                    value={member.userId}
                                >
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage
                                                src={member.user.image || ''}
                                                alt={member.user.name || ''}
                                            />
                                            <AvatarFallback className="text-[10px]">
                                                {getInitials(
                                                    member.user.name || 'U',
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">
                                            {member.user.name}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                {/* Created */}
                <div>
                    <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                        Created
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="text-muted-foreground h-4 w-4" />
                        <span>
                            {format(new Date(request.createdAt), 'MMM d, yyyy')}
                        </span>
                    </div>
                    {request.creator && (
                        <div className="mt-2 flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                                <AvatarImage
                                    src={request.creator.image || ''}
                                    alt={request.creator.name || ''}
                                />
                                <AvatarFallback className="text-[8px]">
                                    {getInitials(request.creator.name || 'U')}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground text-xs">
                                by {request.creator.name}
                            </span>
                        </div>
                    )}
                </div>
            </aside>

            {/* Delete Dialog */}
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
                            delete the request <strong>{request.title}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteRequestMutation.isPending}
                        >
                            {deleteRequestMutation.isPending
                                ? 'Deleting...'
                                : 'Delete Request'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
