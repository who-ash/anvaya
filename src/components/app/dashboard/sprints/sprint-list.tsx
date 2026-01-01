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
    Calendar,
    Loader2,
    Zap,
} from 'lucide-react';
import { trpc } from '@/providers/trpc-provider';
import { usePagination } from '@/hooks/use-pagination';
import { useSearchWithParams } from '@/hooks/use-search-with-params';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { CreateSprintDialog } from './create-sprint-dialog';
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
import { EditSprintDialog } from './edit-sprint-dialog';
import { SprintFilters } from './sprint-filters';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface SprintListProps {
    projectIds: number[];
    setProjectIds: (ids: number[]) => void;
    statuses: string[];
    setStatuses: (statuses: string[]) => void;
    projects: any[];
    organizationId?: number; // Added to help with RBAC
    hideProjectFilter?: boolean;
}

export function SprintList({
    projectIds,
    setProjectIds,
    statuses,
    setStatuses,
    projects,
    organizationId,
    hideProjectFilter = false,
}: SprintListProps) {
    const { searchQuery, debouncedSearchQuery, setSearchQuery } =
        useSearchWithParams();
    const { currentPage, limit, handlePageChange } = usePagination();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedSprint, setSelectedSprint] = useState<any>(null);
    const [sprintToDelete, setSprintToDelete] = useState<any>(null);
    const orgIdForRbac = organizationId || 0;
    const router = useRouter();
    const utils = trpc.useUtils();

    const {
        data: response,
        isLoading,
        refetch,
    } = trpc.sprint.search.useQuery({
        organizationId: orgIdForRbac,
        projectIds: projectIds.length > 0 ? projectIds : undefined,
        statuses,
        query: debouncedSearchQuery,
        page: currentPage,
        limit,
    });

    const deleteSprintMutation = trpc.sprint.delete.useMutation({
        onSuccess: () => {
            toast.success('Sprint deleted successfully');
            refetch();
            utils.sprint.search.invalidate();
            setSprintToDelete(null);
        },
        onError: (error) => {
            toast.error('Failed to delete sprint', {
                description: error.message,
            });
        },
    });

    const sprints = response?.data || [];
    const pagination = response?.pagination;

    const handleDeleteSprint = () => {
        if (sprintToDelete) {
            deleteSprintMutation.mutate({
                id: sprintToDelete.id,
                organizationId: orgIdForRbac,
            });
        }
    };

    if (isLoading && !sprints.length) {
        return <TableSkeleton columns={4} rows={5} />;
    }

    const canCreate = projectIds.length === 1;

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex w-full max-w-xl flex-1 items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                        <Input
                            placeholder="Search sprints..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <SprintFilters
                        projects={projects}
                        selectedProjectIds={projectIds}
                        setSelectedProjectIds={setProjectIds}
                        selectedStatuses={statuses}
                        setSelectedStatuses={setStatuses}
                        hideProjectFilter={hideProjectFilter}
                    />
                </div>
                <Can I="create" a={`org:${orgIdForRbac}:projects:sprints`}>
                    <CreateSprintDialog
                        projectId={
                            projectIds.length === 1 ? projectIds[0] : undefined
                        }
                        organizationId={orgIdForRbac}
                        open={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                        onSprintCreated={refetch}
                    />
                </Can>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sprint</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sprints.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-muted-foreground h-24 text-center"
                                >
                                    No sprints found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sprints.map((sprint: any) => (
                                <TableRow
                                    key={sprint.id}
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/sprints/${sprint.id}`,
                                        )
                                    }
                                    className="hover:bg-accent hover:cursor-pointer"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Calendar className="text-muted-foreground h-4 w-4" />
                                            <div>
                                                <Link
                                                    href={`/dashboard/sprints/${sprint.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {sprint.name}
                                                </Link>
                                                <div className="text-muted-foreground text-xs">
                                                    {sprint.project?.name ||
                                                        'Unknown Project'}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <TiptapViewer
                                            content={
                                                sprint.description ||
                                                'No description'
                                            }
                                            className="preview-only"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {sprint.startDate
                                                ? format(
                                                      new Date(
                                                          sprint.startDate,
                                                      ),
                                                      'MMM d',
                                                  )
                                                : '-'}
                                            {' → '}
                                            {sprint.endDate
                                                ? format(
                                                      new Date(sprint.endDate),
                                                      'MMM d',
                                                  )
                                                : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                sprint.status === 'completed'
                                                    ? 'default'
                                                    : sprint.status === 'active'
                                                      ? 'secondary'
                                                      : 'outline'
                                            }
                                        >
                                            {sprint.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            sprint.createdAt,
                                        ).toLocaleDateString()}
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
                                                    a={`org:${orgIdForRbac}:projects:sprints`}
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedSprint(
                                                                sprint,
                                                            );
                                                            setIsEditDialogOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Sprint
                                                    </DropdownMenuItem>
                                                </Can>
                                                <Can
                                                    I="delete"
                                                    a={`org:${orgIdForRbac}:projects:sprints`}
                                                >
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() =>
                                                            setSprintToDelete(
                                                                sprint,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Sprint
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
            </div>

            <EditSprintDialog
                sprint={selectedSprint}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSprintUpdated={refetch}
                organizationId={orgIdForRbac}
            />

            <AlertDialog
                open={!!sprintToDelete}
                onOpenChange={(open) => !open && setSprintToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the sprint{' '}
                            <strong>{sprintToDelete?.name}</strong>. This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteSprint}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteSprintMutation.isPending}
                        >
                            {deleteSprintMutation.isPending ? (
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
