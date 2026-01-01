'use client';

import { useEffect, useState } from 'react';
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

interface EditSprintDialogProps {
    sprint: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSprintUpdated: () => void;
    organizationId: number; // Added for RBAC
}

export function EditSprintDialog({
    sprint,
    open,
    onOpenChange,
    onSprintUpdated,
    organizationId,
}: EditSprintDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive' | 'completed'>(
        'inactive',
    );
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const utils = trpc.useUtils();

    useEffect(() => {
        if (sprint) {
            setName(sprint.name);
            setDescription(sprint.description || '');
            setStatus(sprint.status);
            setStartDate(
                sprint.startDate ? new Date(sprint.startDate) : undefined,
            );
            setEndDate(sprint.endDate ? new Date(sprint.endDate) : undefined);
        }
    }, [sprint]);

    const updateSprintMutation = trpc.sprint.update.useMutation({
        onSuccess: () => {
            toast.success('Sprint updated successfully');
            onOpenChange(false);
            onSprintUpdated();
            if (sprint?.projectId) {
                utils.sprint.search.invalidate({
                    projectIds: [sprint.projectId],
                });
            }
        },
        onError: (error) => {
            toast.error('Failed to update sprint', {
                description: error.message,
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !sprint) return;

        updateSprintMutation.mutate({
            id: sprint.id,
            organizationId,
            name,
            description,
            status,
            startDate,
            endDate,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Sprint</DialogTitle>
                    <DialogDescription>
                        Update sprint details and status.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-sprint-name">Sprint Name</Label>
                        <Input
                            id="edit-sprint-name"
                            placeholder="Enter sprint name"
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
                            placeholder="Update sprint goals..."
                            className="min-h-[200px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-sprint-status">Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value: any) => setStatus(value)}
                        >
                            <SelectTrigger id="edit-sprint-status">
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
                            disabled={updateSprintMutation.isPending || !name}
                        >
                            {updateSprintMutation.isPending
                                ? 'Updating...'
                                : 'Update Sprint'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
