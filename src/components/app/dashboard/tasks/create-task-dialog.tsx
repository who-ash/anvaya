'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CreateTaskDialogProps {
    projectId?: number; // Made optional
    organizationId: number;
    sprintId?: number; // Made optional
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaskCreated: () => void;
}

export function CreateTaskDialog({
    projectId,
    organizationId,
    sprintId,
    open,
    onOpenChange,
    onTaskCreated,
}: CreateTaskDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<
        'todo' | 'in-progress' | 'done' | 'on-hold' | 'in-review' | 'rejected'
    >('todo');
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [assignees, setAssignees] = useState<string[]>([]);
    const [internalSelectedProjectId, setInternalSelectedProjectId] = useState<
        string | undefined
    >(projectId?.toString());
    const [internalSelectedSprintId, setInternalSelectedSprintId] = useState<
        string | undefined
    >(sprintId?.toString() || 'none');

    const utils = trpc.useUtils();

    const { data: projectsData, isLoading: isLoadingProjects } =
        trpc.project.search.useQuery(
            { organizationId, limit: 100 },
            { enabled: open },
        );

    const { data: sprintsData, isLoading: isLoadingSprints } =
        trpc.sprint.search.useQuery(
            {
                projectIds: [parseInt(internalSelectedProjectId || '0')],
                limit: 100,
            },
            { enabled: !!internalSelectedProjectId },
        );

    // Fetch project members for the selected project
    const { data: projectMembers, isLoading: isLoadingMembers } =
        trpc.project.getMembers.useQuery(
            { projectId: parseInt(internalSelectedProjectId || '0') },
            { enabled: !!internalSelectedProjectId && open },
        );

    const createTaskMutation = trpc.task.create.useMutation({
        onSuccess: () => {
            toast.success('Task created successfully');
            onOpenChange(false);
            onTaskCreated();
            if (internalSelectedProjectId) {
                utils.task.search.invalidate({
                    projectIds: [parseInt(internalSelectedProjectId)],
                    sprintIds:
                        internalSelectedSprintId !== 'none'
                            ? [parseInt(internalSelectedSprintId!)]
                            : undefined,
                });
            }
            resetForm();
        },
        onError: (error) => {
            toast.error('Failed to create task', {
                description: error.message,
            });
        },
    });

    const resetForm = () => {
        setName('');
        setDescription('');
        setStatus('todo');
        setStartDate(undefined);
        setEndDate(undefined);
        setAssignees([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !internalSelectedProjectId) return;

        createTaskMutation.mutate({
            name,
            description,
            projectId: parseInt(internalSelectedProjectId),
            organizationId,
            sprintId:
                internalSelectedSprintId !== 'none'
                    ? parseInt(internalSelectedSprintId!)
                    : undefined,
            status,
            startDate,
            endDate,
            assignees,
        });
    };

    useEffect(() => {
        if (projectId) setInternalSelectedProjectId(projectId.toString());
        if (sprintId) setInternalSelectedSprintId(sprintId.toString());
    }, [projectId, sprintId]);

    // Clear assignees when project changes
    useEffect(() => {
        setAssignees([]);
    }, [internalSelectedProjectId]);

    const projects = projectsData?.data || [];
    const sprints = sprintsData?.data || [];

    // Create options for the multi-select from project members
    const memberOptions: MultiSelectOption[] = useMemo(() => {
        if (!projectMembers) return [];
        return projectMembers.map((member: any) => ({
            value: member.user?.id || member.userId,
            label: member.user?.name || member.user?.email || 'Unknown',
            icon: (
                <Avatar className="h-5 w-5">
                    <AvatarImage
                        src={member.user?.image || ''}
                        alt={member.user?.name || ''}
                    />
                    <AvatarFallback className="text-[10px]">
                        {(member.user?.name || '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            ),
        }));
    }, [projectMembers]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to your project or sprint.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-select">Project</Label>
                            <Select
                                value={internalSelectedProjectId}
                                onValueChange={(val) => {
                                    setInternalSelectedProjectId(val);
                                    setInternalSelectedSprintId('none');
                                }}
                                required
                            >
                                <SelectTrigger id="project-select">
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {isLoadingProjects ? (
                                        <div className="p-2 text-center text-sm">
                                            Loading...
                                        </div>
                                    ) : (
                                        projects.map((p: any) => (
                                            <SelectItem
                                                key={p.id}
                                                value={p.id.toString()}
                                            >
                                                {p.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sprint-select">
                                Sprint (Optional)
                            </Label>
                            <Select
                                value={internalSelectedSprintId}
                                onValueChange={setInternalSelectedSprintId}
                                disabled={!internalSelectedProjectId}
                            >
                                <SelectTrigger id="sprint-select">
                                    <SelectValue placeholder="Select sprint" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        No Sprint
                                    </SelectItem>
                                    {isLoadingSprints ? (
                                        <div className="p-2 text-center text-sm">
                                            Loading...
                                        </div>
                                    ) : (
                                        sprints.map((s: any) => (
                                            <SelectItem
                                                key={s.id}
                                                value={s.id.toString()}
                                            >
                                                {s.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="task-name">Task Name</Label>
                        <Input
                            id="task-name"
                            placeholder="What needs to be done?"
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
                            placeholder="Add more details..."
                            className="min-h-[150px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Assignees</Label>
                        <MultiSelect
                            options={memberOptions}
                            selected={assignees}
                            onChange={setAssignees}
                            placeholder={
                                !internalSelectedProjectId
                                    ? 'Select a project first'
                                    : 'Select team members...'
                            }
                            emptyMessage="No members found in this project"
                            disabled={
                                !internalSelectedProjectId || isLoadingMembers
                            }
                            loading={isLoadingMembers}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="task-status">Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value: any) => setStatus(value)}
                        >
                            <SelectTrigger id="task-status">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in-progress">
                                    In Progress
                                </SelectItem>
                                <SelectItem value="in-review">
                                    In Review
                                </SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                                <SelectItem value="on-hold">On Hold</SelectItem>
                                <SelectItem value="rejected">
                                    Rejected
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
                            <Label>Due Date & Time</Label>
                            <DatePicker
                                date={endDate}
                                onDateChange={setEndDate}
                                placeholder="Select due date"
                                showTime
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={
                                createTaskMutation.isPending ||
                                !name ||
                                !internalSelectedProjectId
                            }
                        >
                            {createTaskMutation.isPending
                                ? 'Creating...'
                                : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
