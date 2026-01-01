'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TiptapEditor from '@/components/app/tiptap/tiptap-editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { trpc } from '@/providers/trpc-provider';
import { DatePicker } from '@/components/ui/date-picker';

interface CreateSprintDialogProps {
    projectId?: number; // Made optional
    organizationId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSprintCreated: () => void;
}

export function CreateSprintDialog({
    projectId,
    organizationId,
    open,
    onOpenChange,
    onSprintCreated,
}: CreateSprintDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive' | 'completed'>(
        'inactive',
    );
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [internalSelectedProjectId, setInternalSelectedProjectId] = useState<
        string | undefined
    >(projectId?.toString());
    const utils = trpc.useUtils();

    const { data: projectsData, isLoading: isLoadingProjects } =
        trpc.project.search.useQuery(
            { organizationId, limit: 100 },
            { enabled: open },
        );

    const createSprintMutation = trpc.sprint.create.useMutation({
        onSuccess: () => {
            toast.success('Sprint created successfully');
            onOpenChange(false);
            onSprintCreated();
            if (internalSelectedProjectId) {
                utils.sprint.search.invalidate({
                    projectIds: [parseInt(internalSelectedProjectId)],
                });
            }
            setName('');
            setDescription('');
            setStatus('inactive');
            setStartDate(undefined);
            setEndDate(undefined);
        },
        onError: (error) => {
            toast.error('Failed to create sprint', {
                description: error.message,
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !internalSelectedProjectId) return;

        createSprintMutation.mutate({
            name,
            description,
            projectId: parseInt(internalSelectedProjectId),
            organizationId,
            status,
            startDate,
            endDate,
        });
    };

    useEffect(() => {
        if (projectId) {
            setInternalSelectedProjectId(projectId.toString());
        }
    }, [projectId]);

    const projects = projectsData?.data || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Sprint
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Sprint</DialogTitle>
                    <DialogDescription>
                        Define a new sprint cycle for your project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-select">Project</Label>
                        <Select
                            value={internalSelectedProjectId}
                            onValueChange={setInternalSelectedProjectId}
                            required
                        >
                            <SelectTrigger id="project-select">
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingProjects ? (
                                    <div className="p-2 text-center text-sm">
                                        Loading projects...
                                    </div>
                                ) : projects.length === 0 ? (
                                    <div className="p-2 text-center text-sm">
                                        No projects found
                                    </div>
                                ) : (
                                    projects.map((project: any) => (
                                        <SelectItem
                                            key={project.id}
                                            value={project.id.toString()}
                                        >
                                            {project.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sprint-name">Sprint Name</Label>
                        <Input
                            id="sprint-name"
                            placeholder="e.g. Q1 Sprint 1"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <TiptapEditor
                            initialContent={description}
                            onChange={setDescription}
                            placeholder="What are the goals of this sprint?"
                            className="min-h-[200px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sprint-status">Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value: any) => setStatus(value)}
                        >
                            <SelectTrigger id="sprint-status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="inactive">
                                    Planned (Inactive)
                                </SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">
                                    Completed
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date & Time</Label>
                            <DatePicker
                                date={startDate}
                                onDateChange={setStartDate}
                                placeholder="Select start date"
                                showTime
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date & Time</Label>
                            <DatePicker
                                date={endDate}
                                onDateChange={setEndDate}
                                placeholder="Select end date"
                                showTime
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={
                                createSprintMutation.isPending ||
                                !name ||
                                !internalSelectedProjectId
                            }
                        >
                            {createSprintMutation.isPending
                                ? 'Creating...'
                                : 'Create Sprint'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
