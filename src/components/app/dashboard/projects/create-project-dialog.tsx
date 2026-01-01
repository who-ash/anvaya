'use client';

import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { trpc } from '@/providers/trpc-provider';

interface CreateProjectDialogProps {
    organizationId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProjectCreated: () => void;
}

export function CreateProjectDialog({
    organizationId,
    open,
    onOpenChange,
    onProjectCreated,
}: CreateProjectDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const utils = trpc.useUtils();

    const createProjectMutation = trpc.project.create.useMutation({
        onSuccess: () => {
            toast.success('Project created successfully');
            onOpenChange(false);
            onProjectCreated();
            utils.project.search.invalidate({ organizationId });
            setName('');
            setDescription('');
        },
        onError: (error) => {
            toast.error('Failed to create project', {
                description: error.message,
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        createProjectMutation.mutate({
            name,
            description,
            organizationId,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Add a new project to your organization.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            id="name"
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
                            placeholder="Briefly describe the project..."
                            className="min-h-[200px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={createProjectMutation.isPending || !name}
                        >
                            {createProjectMutation.isPending
                                ? 'Creating...'
                                : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
