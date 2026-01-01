'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/providers/trpc-provider';
import { Eye, UserPlus } from 'lucide-react';

interface CreateUserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isLoading: boolean;
    onUserCreated: () => void;
}

type NewUserForm = {
    name: string;
    email: string;
    password: string;
    role: string;
    emailVerified: boolean;
};

export function CreateUserDialog({
    open,
    onOpenChange,
    isLoading,
    onUserCreated,
}: CreateUserDialogProps) {
    const [formData, setFormData] = useState<NewUserForm>({
        name: '',
        email: '',
        password: '',
        role: 'user',
        emailVerified: true,
    });
    const [showPassword, setShowPassword] = useState(false);

    const createUserMutation = trpc.user.create.useMutation({
        onSuccess: () => {
            toast.success('User created successfully');
            onOpenChange(false);
            onUserCreated();
            resetForm();
        },
        onError: (error: any) => {
            toast.error('Failed to create user', {
                description: error.message || 'An unknown error occurred',
            });
        },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'user',
            emailVerified: true,
        });
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        createUserMutation.mutate({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role as 'admin' | 'user',
            emailVerified: formData.emailVerified,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span>Create User</span>
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                        Create a new user account with specific role
                        permissions.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                            htmlFor="name"
                            className="after:ml-0.1 text-right after:text-red-500 after:content-['*']"
                        >
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            className="col-span-3"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                            htmlFor="email"
                            className="after:ml-0.1 text-right after:text-red-500 after:content-['*']"
                        >
                            Email
                        </Label>
                        <Input
                            id="email"
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
                            disabled={isLoading}
                        />
                    </div>
                    <div className="relative grid grid-cols-4 items-center gap-4">
                        <Label
                            htmlFor="password"
                            className="after:ml-0.1 text-right after:text-red-500 after:content-['*']"
                        >
                            Password
                        </Label>
                        <div className="relative col-span-3">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="absolute top-2 right-2 p-1"
                                onClick={() => setShowPassword((prev) => !prev)}
                                tabIndex={-1}
                            >
                                <Eye className="h-4 w-4 opacity-50" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                            Role
                        </Label>
                        <Select
                            value={formData.role}
                            onValueChange={(value: string) =>
                                setFormData({ ...formData, role: value })
                            }
                            disabled={isLoading}
                        >
                            <SelectTrigger className="col-span-3 w-full">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mt-6 grid grid-cols-4 items-center gap-4">
                        <Label
                            htmlFor="emailVerified"
                            className="col-span-1 text-left"
                        >
                            Status
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Checkbox
                                id="emailVerified"
                                checked={formData.emailVerified}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        emailVerified: checked === true,
                                    })
                                }
                                disabled={isLoading}
                            />
                            <Label
                                htmlFor="emailVerified"
                                className="text-sm leading-none font-normal"
                            >
                                Mark email as verified
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={
                                createUserMutation.isPending ||
                                !formData.name ||
                                !formData.email ||
                                !formData.password
                            }
                        >
                            {createUserMutation.isPending
                                ? 'Creating...'
                                : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
