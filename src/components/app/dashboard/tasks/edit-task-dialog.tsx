'use client';

import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { trpc } from '@/providers/trpc-provider';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EditTaskDialogProps {
    task: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaskUpdated: () => void;
    organizationId: number; // Added for RBAC
}

export function EditTaskDialog({
    task,
    open,
    onOpenChange,
    onTaskUpdated,
    organizationId,
}: EditTaskDialogProps) {
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
    >(undefined);
    const [internalSelectedSprintId, setInternalSelectedSprintId] = useState<
        string | undefined
    >(undefined);

    const utils = trpc.useUtils();

    // Fetch all projects for selection
    const { data: projectsData, isLoading: isLoadingProjects } =
        trpc.project.search.useQuery(
            { organizationId, limit: 100 },
            { enabled: open },
        );

    // Fetch sprints for the selected project
    const { data: sprintsData, isLoading: isLoadingSprints } =
        trpc.sprint.search.useQuery(
            {
                projectIds: [parseInt(internalSelectedProjectId || '0')],
                limit: 100,
            },
            { enabled: !!internalSelectedProjectId && open },
        );

    // Fetch project members for the currently selected project
    const { data: projectMembers, isLoading: isLoadingMembers } =
        trpc.project.getMembers.useQuery(
            { projectId: parseInt(internalSelectedProjectId || '0') },
            { enabled: !!internalSelectedProjectId && open },
        );

    useEffect(() => {
        if (task) {
            setName(task.name);
            setDescription(task.description || '');
            setStatus(task.status);
            setStartDate(task.startDate ? new Date(task.startDate) : undefined);
            setEndDate(task.endDate ? new Date(task.endDate) : undefined);
            setInternalSelectedProjectId(task.projectId?.toString());
            setInternalSelectedSprintId(task.sprintId?.toString() || 'none');
            // Set assignees from task members
            if (task.members && task.members.length > 0) {
                setAssignees(task.members.map((m: any) => m.id));
            } else {
                setAssignees([]);
            }
        }
    }, [task]);

    // Clear assignees if project changes from the task's original project
    useEffect(() => {
        if (task && internalSelectedProjectId !== task.projectId?.toString()) {
            setAssignees([]);
        } else if (task && task.members) {
            setAssignees(task.members.map((m: any) => m.id));
        }
    }, [internalSelectedProjectId, task]);

    const updateTaskMutation = trpc.task.update.useMutation({
        onSuccess: () => {
            toast.success('Task updated successfully');
            onOpenChange(false);
            onTaskUpdated();
            if (internalSelectedProjectId) {
                utils.task.search.invalidate({
                    projectIds: [parseInt(internalSelectedProjectId)],
                });
                utils.task.getById.invalidate({ id: task.id });
                // If the project changed, also invalidate the old project's search
                if (
                    task.projectId &&
                    internalSelectedProjectId !== task.projectId.toString()
                ) {
                    utils.task.search.invalidate({
                        projectIds: [task.projectId],
                    });
                }
            }
        },
        onError: (error) => {
            toast.error('Failed to update task', {
                description: error.message,
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !task || !internalSelectedProjectId) return;

        updateTaskMutation.mutate({
            id: task.id,
            organizationId,
            name,
            description,
            status,
            startDate,
            endDate,
            assignees,
            projectId: parseInt(internalSelectedProjectId),
            sprintId:
                internalSelectedSprintId === 'none'
                    ? null
                    : parseInt(internalSelectedSprintId || '0'),
        });
    };

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                    <DialogDescription>
                        Update task details, project, sprint, and assignees.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-project-select">Project</Label>
                            <Select
                                value={internalSelectedProjectId}
                                onValueChange={(val) => {
                                    setInternalSelectedProjectId(val);
                                    setInternalSelectedSprintId('none');
                                }}
                                required
                            >
                                <SelectTrigger id="edit-project-select">
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
                            <Label htmlFor="edit-sprint-select">
                                Sprint (Optional)
                            </Label>
                            <Select
                                value={internalSelectedSprintId}
                                onValueChange={setInternalSelectedSprintId}
                                disabled={!internalSelectedProjectId}
                            >
                                <SelectTrigger id="edit-sprint-select">
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
                        <Label htmlFor="edit-task-name">Task Name</Label>
                        <Input
                            id="edit-task-name"
                            placeholder="Enter task name"
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
                            placeholder="Update task details..."
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
                        <Label htmlFor="edit-task-status">Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value: any) => setStatus(value)}
                        >
                            <SelectTrigger id="edit-task-status">
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
                                updateTaskMutation.isPending ||
                                !name ||
                                !internalSelectedProjectId
                            }
                        >
                            {updateTaskMutation.isPending
                                ? 'Updating...'
                                : 'Update Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
