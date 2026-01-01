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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/providers/trpc-provider';
import { Loader2 } from 'lucide-react';

interface EditUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        id: string;
        name: string;
        email: string;
    } | null;
    onUserUpdated: () => void;
}

export function EditUserDialog({
    open,
    onOpenChange,
    user,
    onUserUpdated,
}: EditUserDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const updateUserMutation = trpc.user.update.useMutation({
        onSuccess: () => {
            toast.success('User updated successfully');
            onOpenChange(false);
            onUserUpdated();
        },
        onError: (error: any) => {
            toast.error('Failed to update user', {
                description: error.message || 'An unknown error occurred',
            });
        },
    });

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        updateUserMutation.mutate({
            id: user.id,
            name: formData.name,
            email: formData.email,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                            htmlFor="edit-name"
                            className="after:ml-0.1 text-right after:text-red-500 after:content-['*']"
                        >
                            Name
                        </Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            className="col-span-3"
                            required
                            disabled={updateUserMutation.isPending}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                            htmlFor="edit-email"
                            className="after:ml-0.1 text-right after:text-red-500 after:content-['*']"
                        >
                            Email
                        </Label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value,
                                })
                            }
                            className="col-span-3"
                            required
                            disabled={true}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={
                                updateUserMutation.isPending ||
                                !formData.name ||
                                !formData.email
                            }
                        >
                            {updateUserMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update User'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
