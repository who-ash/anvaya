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
import { trpc } from '@/providers/trpc-provider';

interface EditProjectDialogProps {
    project: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProjectUpdated: () => void;
    organizationId: number; // Added for RBAC
}

export function EditProjectDialog({
    project,
    open,
    onOpenChange,
    onProjectUpdated,
    organizationId,
}: EditProjectDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const utils = trpc.useUtils();

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDescription(project.description || '');
        }
    }, [project]);

    const updateProjectMutation = trpc.project.update.useMutation({
        onSuccess: () => {
            toast.success('Project updated successfully');
            onOpenChange(false);
            onProjectUpdated();
            utils.project.search.invalidate({ organizationId });
        },
        onError: (error) => {
            toast.error('Failed to update project', {
                description: error.message,
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !project) return;

        updateProjectMutation.mutate({
            id: project.id,
            organizationId,
            name,
            description,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        Update project details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Project Name</Label>
                        <Input
                            id="edit-name"
                            placeholder="Enter project name"
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
                            placeholder="Update project description..."
                            className="min-h-[200px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={updateProjectMutation.isPending || !name}
                        >
                            {updateProjectMutation.isPending
                                ? 'Updating...'
                                : 'Update Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
