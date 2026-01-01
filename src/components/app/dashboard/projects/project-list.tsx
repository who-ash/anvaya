'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Zap,
    ListTodo,
    LayoutGrid,
    List,
    MoreVertical,
    Search,
    Plus,
    Edit,
    Trash2,
    Folder,
    Loader2,
    Calendar,
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { trpc } from '@/providers/trpc-provider';
import { usePagination } from '@/hooks/use-pagination';
import { useSearchWithParams } from '@/hooks/use-search-with-params';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EditProjectDialog } from './edit-project-dialog';
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
import { CreateProjectDialog } from './create-project-dialog';
import { cn } from '@/lib/utils';

interface ProjectListProps {
    organizationId: number;
}

export function ProjectList({ organizationId }: ProjectListProps) {
    const { searchQuery, debouncedSearchQuery, setSearchQuery } =
        useSearchWithParams();
    const { currentPage, limit, handlePageChange } = usePagination();
    const router = useRouter();
    const [view, setView] = useState<'grid' | 'list'>('grid');

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [projectToDelete, setProjectToDelete] = useState<any>(null);
    const utils = trpc.useUtils();

    const {
        data: response,
        isLoading,
        refetch,
    } = trpc.project.search.useQuery(
        {
            organizationId,
            query: debouncedSearchQuery,
            page: currentPage,
            limit,
        },
        { enabled: !!organizationId },
    );

    const deleteProjectMutation = trpc.project.delete.useMutation({
        onSuccess: () => {
            toast.success('Project deleted successfully');
            refetch();
            utils.project.search.invalidate({ organizationId });
            setProjectToDelete(null);
        },
        onError: (error) => {
            toast.error('Failed to delete project', {
                description: error.message,
            });
        },
    });

    const projects = response?.data || [];
    const pagination = response?.pagination;

    const handleDeleteProject = () => {
        if (projectToDelete) {
            deleteProjectMutation.mutate({
                id: projectToDelete.id,
                organizationId,
            });
        }
    };

    if (isLoading && !projects.length) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="bg-muted h-10 w-64 animate-pulse rounded-md" />
                    <div className="bg-muted h-10 w-32 animate-pulse rounded-md" />
                </div>
                {view === 'list' ? (
                    <TableSkeleton columns={4} rows={5} />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-48 w-full" />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="relative w-full max-w-md flex-1">
                    <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                    <Input
                        placeholder="Search projects..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                    <div className="bg-muted/50 flex items-center rounded-md border p-1">
                        <Button
                            variant={view === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setView('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={view === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setView('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                    <Can I="create" a={`org:${organizationId}:projects`}>
                        <CreateProjectDialog
                            organizationId={organizationId}
                            open={isCreateDialogOpen}
                            onOpenChange={setIsCreateDialogOpen}
                            onProjectCreated={refetch}
                        />
                    </Can>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="bg-muted/20 flex h-64 flex-col items-center justify-center rounded-md border border-dashed">
                    <Folder className="text-muted-foreground mb-4 h-12 w-12" />
                    <h3 className="text-lg font-semibold">No projects found</h3>
                    <p className="text-muted-foreground">
                        Try adjusting your search or create a new project.
                    </p>
                </div>
            ) : view === 'grid' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project: any) => (
                        <Card
                            key={project.id}
                            className="group hover:border-primary/50 transition-colors hover:cursor-pointer"
                            onClick={() =>
                                router.push(`/dashboard/projects/${project.id}`)
                            }
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        {project.profilePicture ? (
                                            <AvatarImage
                                                src={project.profilePicture}
                                            />
                                        ) : (
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                <Folder className="h-5 w-5" />
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <div>
                                        <CardTitle className="line-clamp-1 text-base">
                                            {project.name}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-1 text-xs">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(
                                                project.createdAt,
                                            ).toLocaleDateString()}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
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
                                                a={`org:${organizationId}:projects`}
                                            >
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedProject(
                                                            project,
                                                        );
                                                        setIsEditDialogOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Project
                                                </DropdownMenuItem>
                                            </Can>
                                            <Can
                                                I="delete"
                                                a={`org:${organizationId}:projects`}
                                            >
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        setProjectToDelete(
                                                            project,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Project
                                                </DropdownMenuItem>
                                            </Can>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pt-2">
                                <TiptapViewer
                                    content={
                                        project.description || 'No description'
                                    }
                                    className="preview-only text-muted-foreground mb-4 line-clamp-2 text-sm"
                                />

                                <div className="text-muted-foreground flex items-center justify-between gap-4 text-sm">
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {project.members
                                            ?.slice(0, 3)
                                            .map((member: any) => (
                                                <TooltipProvider
                                                    key={member.id}
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Avatar className="border-background h-8 w-8 border-2 ring-0">
                                                                <AvatarImage
                                                                    src={
                                                                        member.image ||
                                                                        ''
                                                                    }
                                                                />
                                                                <AvatarFallback className="bg-secondary text-[10px]">
                                                                    {member.name
                                                                        ?.split(
                                                                            ' ',
                                                                        )
                                                                        .map(
                                                                            (
                                                                                n: string,
                                                                            ) =>
                                                                                n[0],
                                                                        )
                                                                        .join(
                                                                            '',
                                                                        )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{member.name}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}
                                        {(project.members?.length || 0) > 3 && (
                                            <div className="border-background bg-muted flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-medium">
                                                +
                                                {(project.members?.length ||
                                                    0) - 3}
                                            </div>
                                        )}
                                        {(project.members?.length || 0) ===
                                            0 && (
                                            <span className="text-muted-foreground pl-2 text-xs italic">
                                                No members
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className="flex items-center gap-1.5"
                                        title="Sprints"
                                    >
                                        <Zap className="h-4 w-4" />
                                        <span>
                                            {project.sprintCount || 0} Sprints
                                        </span>
                                    </div>
                                    <div
                                        className="flex items-center gap-1.5"
                                        title="Tasks"
                                    >
                                        <ListTodo className="h-4 w-4" />
                                        <span>
                                            {project.taskCount || 0} Tasks
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Project</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.map((project: any) => (
                                <TableRow
                                    key={project.id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/projects/${project.id}`,
                                        )
                                    }
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                {project.profilePicture && (
                                                    <AvatarImage
                                                        src={
                                                            project.profilePicture
                                                        }
                                                    />
                                                )}
                                                <AvatarFallback>
                                                    <Folder className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">
                                                {project.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <TiptapViewer
                                            content={
                                                project.description ||
                                                'No description'
                                            }
                                            className="preview-only"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            project.createdAt,
                                        ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell
                                        className="text-right"
                                        onClick={(e) => e.stopPropagation()}
                                    >
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
                                                    a={`org:${organizationId}:projects`}
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedProject(
                                                                project,
                                                            );
                                                            setIsEditDialogOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit Project
                                                    </DropdownMenuItem>
                                                </Can>
                                                <Can
                                                    I="delete"
                                                    a={`org:${organizationId}:projects`}
                                                >
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() =>
                                                            setProjectToDelete(
                                                                project,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Project
                                                    </DropdownMenuItem>
                                                </Can>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <EditProjectDialog
                project={selectedProject}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onProjectUpdated={refetch}
                organizationId={organizationId}
            />

            <AlertDialog
                open={!!projectToDelete}
                onOpenChange={(open) => !open && setProjectToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the project{' '}
                            <strong>{projectToDelete?.name}</strong>. This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProject}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteProjectMutation.isPending}
                        >
                            {deleteProjectMutation.isPending ? (
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
