'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { trpc } from '@/providers/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// We will create these components next
import { ProjectSprints } from '@/components/app/dashboard/projects/project-sprints';
import { ProjectTasks } from '@/components/app/dashboard/projects/project-tasks';
import { ProjectMembers } from '@/components/app/dashboard/projects/project-members';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';
import { EditProjectDialog } from '@/components/app/dashboard/projects/edit-project-dialog';
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
import { Edit, Trash2 } from 'lucide-react';

export default function ProjectPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const projectId = parseInt(params.id as string);
    const activeTab = searchParams.get('tab') || 'members';
    const utils = trpc.useUtils();

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const {
        data: project,
        isLoading,
        refetch,
    } = trpc.project.getById.useQuery({ id: projectId });

    const deleteProjectMutation = trpc.project.delete.useMutation({
        onSuccess: () => {
            toast.success('Project deleted successfully');
            utils.project.search.invalidate();
            router.push('/dashboard/projects');
        },
        onError: (error) => {
            toast.error('Failed to delete project', {
                description: error.message,
            });
        },
    });

    const handleDelete = () => {
        if (project) {
            deleteProjectMutation.mutate({
                id: project.id,
                organizationId: project.organizationId,
            });
        }
    };

    const handleTabChange = (value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        current.set('tab', value);
        const search = current.toString();
        const query = search ? `?${search}` : '';
        router.push(`${window.location.pathname}${query}`);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
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

    if (!project) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">Project Not Found</h2>
                <Button asChild variant="outline">
                    <Link href="/dashboard/projects">Back to Projects</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 px-1">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {project.name}
                    </h1>
                    <div className="max-w-2xl">
                        {project.description ? (
                            <TiptapViewer
                                content={project.description}
                                className="notice-preview text-muted-foreground line-clamp-1 text-sm"
                            />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No description provided
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
                        <Can
                            I="update"
                            a={`org:${project.organizationId}:projects`}
                        >
                            <DropdownMenuItem
                                onClick={() => setIsEditDialogOpen(true)}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Project
                            </DropdownMenuItem>
                        </Can>
                        <DropdownMenuSeparator />
                        <Can
                            I="delete"
                            a={`org:${project.organizationId}:projects`}
                        >
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setIsDeleteDialogOpen(true)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Project
                            </DropdownMenuItem>
                        </Can>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
            >
                <TabsList className="mb-4 flex h-auto w-fit min-w-full justify-start gap-6 rounded-none border-b bg-transparent p-0 sm:min-w-0">
                    <TabsTrigger
                        value="members"
                        className="data-[state=active]:border-primary rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Members
                    </TabsTrigger>
                    <TabsTrigger
                        value="sprints"
                        className="data-[state=active]:border-primary rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Sprints
                    </TabsTrigger>
                    <TabsTrigger
                        value="tasks"
                        className="data-[state=active]:border-primary rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Tasks
                    </TabsTrigger>
                    <TabsTrigger
                        value="issues"
                        className="data-[state=active]:border-primary rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Issues
                    </TabsTrigger>
                    <TabsTrigger
                        value="report"
                        className="data-[state=active]:border-primary rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-transparent px-2 py-3 text-sm font-medium shadow-none transition-all data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                        Report
                    </TabsTrigger>
                </TabsList>
                <div className="mt-[-1rem] py-4">
                    <TabsContent value="members" className="m-0">
                        <ProjectMembers
                            projectId={projectId}
                            organizationId={project.organizationId}
                        />
                    </TabsContent>
                    <TabsContent value="sprints" className="m-0">
                        <ProjectSprints
                            projectId={projectId}
                            organizationId={project.organizationId}
                        />
                    </TabsContent>
                    <TabsContent value="tasks" className="m-0">
                        <ProjectTasks
                            projectId={projectId}
                            organizationId={project.organizationId}
                        />
                    </TabsContent>
                    <TabsContent value="issues" className="m-0">
                        <div className="text-muted-foreground flex items-center justify-center py-20">
                            Issues module coming soon...
                        </div>
                    </TabsContent>
                    <TabsContent value="report" className="m-0">
                        <div className="text-muted-foreground flex items-center justify-center py-20">
                            Reports coming soon...
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            <EditProjectDialog
                project={project}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onProjectUpdated={refetch}
                organizationId={project.organizationId}
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
                            delete the project and all its data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteProjectMutation.isPending}
                        >
                            {deleteProjectMutation.isPending
                                ? 'Deleting...'
                                : 'Delete Project'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
