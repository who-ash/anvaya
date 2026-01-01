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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { trpc } from '@/providers/trpc-provider';
import {
    Search,
    UserPlus,
    Loader2,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organizationId: number;
    onMembersAdded: () => void;
}

type User = {
    id: string;
    name: string;
    email: string;
    image: string | null;
};

type SelectedUser = User & {
    role: 'member' | 'admin';
};

export function AddMemberDialog({
    open,
    onOpenChange,
    organizationId,
    onMembersAdded,
}: AddMemberDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
    const [defaultRole, setDefaultRole] = useState<'member' | 'admin'>(
        'member',
    );
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    const { data: usersData, isLoading: isSearching } =
        trpc.organization.getAddMembers.useQuery(
            { organizationId, query: searchQuery, page: currentPage, limit },
            {
                enabled: open && searchQuery.length > 0,
                refetchOnWindowFocus: false,
            },
        );

    // Handle paginated response
    const users = usersData && 'data' in usersData ? usersData.data : [];
    const pagination =
        usersData && 'pagination' in usersData ? usersData.pagination : null;

    const addMembersMutation = trpc.organization.addMembers.useMutation({
        onSuccess: () => {
            toast.success('Members added successfully');
            handleClose();
            onMembersAdded();
        },
        onError: (error: any) => {
            toast.error('Failed to add members', {
                description: error.message || 'An unknown error occurred',
            });
        },
    });

    const resetForm = () => {
        setSearchQuery('');
        setSelectedUsers([]);
        setDefaultRole('member');
        setCurrentPage(1);
    };

    const handleClose = () => {
        resetForm();
        onOpenChange(false);
    };

    // Reset page when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleUserToggle = (user: User) => {
        const isSelected = selectedUsers.some((u) => u.id === user.id);

        if (isSelected) {
            setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
        } else {
            setSelectedUsers([
                ...selectedUsers,
                { ...user, role: defaultRole },
            ]);
        }
    };

    const handleRoleChange = (userId: string, role: 'member' | 'admin') => {
        setSelectedUsers(
            selectedUsers.map((u) => (u.id === userId ? { ...u, role } : u)),
        );
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
    };

    const handleAddMembers = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedUsers.length === 0) {
            toast.error('Please select at least one user');
            return;
        }

        addMembersMutation.mutate({
            organizationId,
            members: selectedUsers.map((u) => ({
                userId: u.id,
                role: u.role,
            })),
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const isSubmitting = addMembersMutation.isPending;

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleClose();
                }
            }}
        >
            <DialogContent className="scrollbar-thin max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Add Members</DialogTitle>
                    <DialogDescription>
                        Search for users and add them to the organization with
                        specific roles.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleAddMembers}
                    className="flex flex-col gap-4"
                >
                    {/* Default Role Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="defaultRole" className="text-right">
                            Default Role
                        </Label>
                        <Select
                            value={defaultRole}
                            onValueChange={(value) =>
                                setDefaultRole(value as 'member' | 'admin')
                            }
                            disabled={isSubmitting}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select default role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* User Search */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="search" className="pt-2 text-right">
                            Search Users
                        </Label>
                        <div className="col-span-3 space-y-2">
                            <div className="relative">
                                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                                <Input
                                    id="search"
                                    placeholder="Search by name or email..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Search Results */}
                            {searchQuery && (
                                <div className="space-y-2">
                                    <ScrollArea className="h-[200px] rounded-md border p-2">
                                        {isSearching ? (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            </div>
                                        ) : users && users.length > 0 ? (
                                            <div className="space-y-2">
                                                {users.map((user) => {
                                                    const isSelected =
                                                        selectedUsers.some(
                                                            (u) =>
                                                                u.id ===
                                                                user.id,
                                                        );
                                                    return (
                                                        <Label
                                                            key={user.id}
                                                            className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md p-2"
                                                        >
                                                            <Checkbox
                                                                checked={
                                                                    isSelected
                                                                }
                                                                onCheckedChange={() =>
                                                                    handleUserToggle(
                                                                        user,
                                                                    )
                                                                }
                                                            />
                                                            <Avatar className="h-8 w-8">
                                                                {user.image && (
                                                                    <AvatarImage
                                                                        src={
                                                                            user.image
                                                                        }
                                                                    />
                                                                )}
                                                                <AvatarFallback>
                                                                    {getInitials(
                                                                        user.name,
                                                                    )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">
                                                                    {user.name}
                                                                </p>
                                                                <p className="text-muted-foreground text-xs">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                        </Label>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground p-4 text-center text-sm">
                                                No users found
                                            </p>
                                        )}
                                    </ScrollArea>

                                    {/* Pagination */}
                                    {pagination &&
                                        pagination.totalPages > 1 && (
                                            <div className="flex items-center justify-between px-2">
                                                <p className="text-muted-foreground text-xs">
                                                    Page {currentPage} of{' '}
                                                    {pagination.totalPages}
                                                </p>
                                                <div className="flex gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setCurrentPage(
                                                                (p) =>
                                                                    Math.max(
                                                                        1,
                                                                        p - 1,
                                                                    ),
                                                            )
                                                        }
                                                        disabled={
                                                            !pagination.hasPreviousPage ||
                                                            isSubmitting
                                                        }
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setCurrentPage(
                                                                (p) => p + 1,
                                                            )
                                                        }
                                                        disabled={
                                                            !pagination.hasNextPage ||
                                                            isSubmitting
                                                        }
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="pt-2 text-right">
                                Selected ({selectedUsers.length})
                            </Label>
                            <ScrollArea className="col-span-3 h-[200px] rounded-md border p-2">
                                <div className="space-y-2">
                                    {selectedUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="bg-muted flex items-center gap-3 rounded-md p-2"
                                        >
                                            <Avatar className="h-8 w-8">
                                                {user.image && (
                                                    <AvatarImage
                                                        src={user.image}
                                                    />
                                                )}
                                                <AvatarFallback>
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {user.email}
                                                </p>
                                            </div>
                                            <Select
                                                value={user.role}
                                                onValueChange={(role) =>
                                                    handleRoleChange(
                                                        user.id,
                                                        role as
                                                            | 'member'
                                                            | 'admin',
                                                    )
                                                }
                                                disabled={isSubmitting}
                                            >
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="member">
                                                        Member
                                                    </SelectItem>
                                                    <SelectItem value="admin">
                                                        Admin
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    handleRemoveUser(user.id)
                                                }
                                                disabled={isSubmitting}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={
                                isSubmitting || selectedUsers.length === 0
                            }
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                `Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
