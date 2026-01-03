'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/providers/trpc-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
    Search,
    Plus,
    Bug,
    Lightbulb,
    MessageSquare,
    HelpCircle,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Inbox,
} from 'lucide-react';
import { RequestFilters } from '@/components/app/dashboard/requests/request-filters';
import { useOrganization } from '@/providers/organization-provider';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

const typeIcons: Record<string, React.ReactNode> = {
    bug: <Bug className="h-4 w-4" />,
    feature_request: <Lightbulb className="h-4 w-4" />,
    feedback: <MessageSquare className="h-4 w-4" />,
    query: <HelpCircle className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
    bug: 'Bug Report',
    feature_request: 'Feature Request',
    feedback: 'Feedback',
    query: 'Query',
};

const statusIcons: Record<string, React.ReactNode> = {
    open: <AlertCircle className="h-3 w-3" />,
    'in-progress': <Clock className="h-3 w-3" />,
    resolved: <CheckCircle2 className="h-3 w-3" />,
    closed: <CheckCircle2 className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
};

const priorityColors: Record<string, string> = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
};

const templateCards = [
    {
        type: 'bug' as const,
        title: 'Bug Report',
        description: 'Report a bug with steps to reproduce',
        icon: Bug,
        bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
    {
        type: 'feature_request' as const,
        title: 'Feature Request',
        description: 'Suggest a new feature with use cases',
        icon: Lightbulb,
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    },
    {
        type: 'feedback' as const,
        title: 'Feedback',
        description: 'Share your experience and suggestions',
        icon: MessageSquare,
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
        type: 'query' as const,
        title: 'Query',
        description: 'Ask questions or seek clarification',
        icon: HelpCircle,
        bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
];

export default function RequestsPage() {
    const { activeOrgId } = useOrganization();
    const [search, setSearch] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
    const [page, setPage] = useState(1);

    const { data, isLoading } = trpc.request.search.useQuery(
        {
            organizationId: activeOrgId || 0,
            types: selectedTypes.length > 0 ? selectedTypes : undefined,
            statuses:
                selectedStatuses.length > 0 ? selectedStatuses : undefined,
            priorities:
                selectedPriorities.length > 0 ? selectedPriorities : undefined,
            query: search || undefined,
            page,
            limit: 10,
        },
        { enabled: !!activeOrgId },
    );

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const hasRequests = data && data.data.length > 0;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Requests
                    </h1>
                    <p className="text-muted-foreground">
                        Track bugs, feature requests, feedback, and queries.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/requests/new">
                        <Plus className="mr-2 h-4 w-4" /> New Request
                    </Link>
                </Button>
            </div>

            {/* Template Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {templateCards.map((template) => (
                    <Link
                        key={template.type}
                        href={`/dashboard/requests/new?type=${template.type}`}
                    >
                        <Card className="hover:border-primary/50 h-full cursor-pointer transition-all hover:shadow-md">
                            <CardHeader className="pb-3">
                                <div
                                    className={`h-10 w-10 rounded-lg ${template.bgColor} mb-2 flex items-center justify-center`}
                                >
                                    <template.icon className={`h-5 w-5`} />
                                </div>
                                <CardTitle className="text-base">
                                    {template.title}
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    {template.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative max-w-sm flex-1">
                    <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                    <Input
                        className="pl-8"
                        placeholder="Search requests..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <RequestFilters
                    selectedTypes={selectedTypes}
                    setSelectedTypes={setSelectedTypes}
                    selectedStatuses={selectedStatuses}
                    setSelectedStatuses={setSelectedStatuses}
                    selectedPriorities={selectedPriorities}
                    setSelectedPriorities={setSelectedPriorities}
                />
            </div>

            {/* Requests List */}
            {isLoading || !activeOrgId ? (
                <TableSkeleton columns={6} rows={5} />
            ) : !hasRequests ? (
                <div className="bg-background flex flex-col items-center justify-center rounded-lg border py-16 text-center shadow-sm">
                    <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                        <Inbox className="text-muted-foreground/50 h-8 w-8" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">
                        No requests yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md px-4 text-sm">
                        Get started by creating your first request. Choose from
                        bug reports, feature requests, feedback, or queries
                        using the templates above.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard/requests/new">
                            <Plus className="mr-2 h-4 w-4" /> Create your first
                            request
                        </Link>
                    </Button>
                </div>
            ) : (
                <>
                    <div className="overflow-hidden rounded-md border">
                        <div className="bg-muted/50 grid grid-cols-[60px_1fr_140px_100px_100px_100px] border-b p-4 text-sm font-medium">
                            <div>ID</div>
                            <div>Title</div>
                            <div>Type</div>
                            <div>Status</div>
                            <div>Priority</div>
                            <div>Assignee</div>
                        </div>
                        {data?.data.map((request) => (
                            <Link
                                key={request.id}
                                href={`/dashboard/requests/${request.id}`}
                                className="hover:bg-muted/30 group grid cursor-pointer grid-cols-[60px_1fr_140px_100px_100px_100px] border-b p-4 transition-colors last:border-0"
                            >
                                <div className="text-muted-foreground font-mono text-xs">
                                    #{request.id}
                                </div>
                                <div className="flex flex-col">
                                    <span className="group-hover:text-primary truncate text-sm font-medium transition-colors">
                                        {request.title}
                                    </span>
                                    <span className="text-muted-foreground mt-0.5 text-[10px]">
                                        {formatDistanceToNow(
                                            new Date(request.createdAt),
                                            {
                                                addSuffix: true,
                                            },
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {typeIcons[request.type]}
                                    <span className="text-xs">
                                        {typeLabels[request.type]}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <Badge
                                        variant={
                                            request.status === 'resolved'
                                                ? 'default'
                                                : request.status ===
                                                    'in-progress'
                                                  ? 'secondary'
                                                  : request.status ===
                                                      'rejected'
                                                    ? 'destructive'
                                                    : 'outline'
                                        }
                                        className="gap-1 text-[10px]"
                                    >
                                        {statusIcons[request.status]}
                                        {request.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className={`h-2 w-2 rounded-full ${priorityColors[request.priority]}`}
                                    />
                                    <span className="text-xs capitalize">
                                        {request.priority}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {request.assignee ? (
                                        <>
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage
                                                    src={
                                                        request.assignee
                                                            .image || ''
                                                    }
                                                    alt={
                                                        request.assignee.name ||
                                                        ''
                                                    }
                                                />
                                                <AvatarFallback className="text-[8px]">
                                                    {getInitials(
                                                        request.assignee.name ||
                                                            'U',
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="truncate text-xs">
                                                {request.assignee.name}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">
                                            Unassigned
                                        </span>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>

                    {data && data.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground text-sm">
                                Showing {(page - 1) * 10 + 1} to{' '}
                                {Math.min(page * 10, data.pagination.total)} of{' '}
                                {data.pagination.total} requests
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={!data.pagination.hasPreviousPage}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">
                                    Page {page} of {data.pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={!data.pagination.hasNextPage}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
