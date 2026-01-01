'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
    Search,
    UserPlus,
    MoreVertical,
    Loader2,
    Trash2,
    Edit,
    Users,
    UserX,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
import { trpc } from '@/providers/trpc-provider';
import { CreateUserDialog } from '@/components/app/admin/users/create-user-dialog';
import { EditUserDialog } from '@/components/app/admin/users/edit-user-dialog';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/use-pagination';
import { useSearchWithParams } from '@/hooks/use-search-with-params';

type User = {
    id: string;
    name: string;
    email: string;
    role: string | null;
    image: string | null;
    emailVerified: boolean;
    createdAt: Date | null;
};

export default function UsersPage() {
    const { searchQuery, debouncedSearchQuery, setSearchQuery } =
        useSearchWithParams();
    const { currentPage, limit, setCurrentPage, handlePageChange } =
        usePagination();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(
        null,
    );

    const {
        data: response,
        isLoading,
        refetch,
    } = trpc.user.search.useQuery(
        { query: debouncedSearchQuery, page: currentPage, limit },
        {
            refetchOnWindowFocus: false,
        },
    );

    const users = response?.data || [];
    const pagination = response?.pagination;

    const updateRoleMutation = trpc.user.updateRole.useMutation({
        onSuccess: () => {
            toast.success('Role updated successfully');
            refetch();
            setUpdatingRoleUserId(null);
        },
        onError: (error: any) => {
            toast.error('Failed to update role', {
                description: error.message || 'An unknown error occurred',
            });
            setUpdatingRoleUserId(null);
        },
    });

    const deleteUserMutation = trpc.user.delete.useMutation({
        onSuccess: () => {
            toast.success('User deleted successfully');
            refetch();
            setUserToDelete(null);
        },
        onError: (error: any) => {
            toast.error('Failed to delete user', {
                description: error.message || 'An unknown error occurred',
            });
        },
    });

    const handleUserCreated = () => {
        refetch();
    };

    const handleUserUpdated = () => {
        refetch();
    };

    const handleRoleChange = (userId: string, newRole: 'admin' | 'user') => {
        setUpdatingRoleUserId(userId);
        updateRoleMutation.mutate({ id: userId, role: newRole });
    };

    const handleDeleteUser = () => {
        if (userToDelete) {
            deleteUserMutation.mutate({ id: userToDelete.id });
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2">
                    <Users className="mt-1 h-6 w-6" />
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold tracking-tight">
                            User Management
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Manage all users and their permissions
                        </p>
                    </div>
                </div>
                <CreateUserDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    isLoading={isLoading}
                    onUserCreated={handleUserCreated}
                />
            </div>

            <div className="mb-4">
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                    <Input
                        placeholder="Search users by name or email..."
                        className="max-w-sm pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <TableSkeleton columns={5} rows={10} showAvatar={true} />
            ) : !users || users.length === 0 ? (
                <div className="flex flex-col gap-4 p-8">
                    <UserX className="text-muted-foreground mx-auto h-12 w-12" />
                    <p className="text-muted-foreground mx-auto">
                        {searchQuery
                            ? 'No users found matching your search.'
                            : 'No users found.'}
                    </p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Email Verified</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user: User) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
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
                                            <span className="font-medium">
                                                {user.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.email}
                                    </TableCell>
                                    <TableCell>
                                        <Popover>
                                            <PopoverTrigger
                                                asChild
                                                disabled={user.role === 'admin'}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className="h-auto p-0 hover:bg-transparent"
                                                    disabled={
                                                        updatingRoleUserId ===
                                                            user.id ||
                                                        user.role === 'admin'
                                                    }
                                                >
                                                    {updatingRoleUserId ===
                                                    user.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                            <span className="text-xs">
                                                                Updating...
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <Badge
                                                            variant={
                                                                user.role ===
                                                                'admin'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className={
                                                                user.role ===
                                                                'admin'
                                                                    ? ''
                                                                    : 'cursor-pointer'
                                                            }
                                                        >
                                                            {user.role ||
                                                                'No Role'}
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-40 p-2"
                                                align="start"
                                            >
                                                <div className="space-y-1">
                                                    <Button
                                                        variant={
                                                            user.role ===
                                                            'admin'
                                                                ? 'default'
                                                                : 'ghost'
                                                        }
                                                        className="w-full justify-start text-sm"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleRoleChange(
                                                                user.id,
                                                                'admin',
                                                            )
                                                        }
                                                        disabled={
                                                            user.role ===
                                                            'admin'
                                                        }
                                                    >
                                                        Admin
                                                    </Button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                user.emailVerified
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                        >
                                            {user.emailVerified
                                                ? 'Verified'
                                                : 'Not Verified'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>
                                                    Actions
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsEditDialogOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit User
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        setUserToDelete(user)
                                                    }
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center">
                    {/* <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pagination.limit) + 1}/{pagination.total} results
                    </div> */}
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        pagination.hasPreviousPage &&
                                        handlePageChange(currentPage - 1)
                                    }
                                    className={
                                        !pagination.hasPreviousPage
                                            ? 'pointer-events-none opacity-50'
                                            : 'cursor-pointer'
                                    }
                                />
                            </PaginationItem>

                            {Array.from(
                                { length: pagination.totalPages },
                                (_, i) => i + 1,
                            ).map((page) => {
                                // Show first page, last page, current page, and pages around current
                                const showPage =
                                    page === 1 ||
                                    page === pagination.totalPages ||
                                    (page >= currentPage - 1 &&
                                        page <= currentPage + 1);

                                const showEllipsisBefore =
                                    page === currentPage - 2 && currentPage > 3;
                                const showEllipsisAfter =
                                    page === currentPage + 2 &&
                                    currentPage < pagination.totalPages - 2;

                                if (showEllipsisBefore || showEllipsisAfter) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    );
                                }

                                if (!showPage) return null;

                                return (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            onClick={() =>
                                                handlePageChange(page)
                                            }
                                            isActive={currentPage === page}
                                            className="cursor-pointer"
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        pagination.hasNextPage &&
                                        handlePageChange(currentPage + 1)
                                    }
                                    className={
                                        !pagination.hasNextPage
                                            ? 'pointer-events-none opacity-50'
                                            : 'cursor-pointer'
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            <EditUserDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                user={selectedUser}
                onUserUpdated={handleUserUpdated}
            />

            <AlertDialog
                open={!!userToDelete}
                onOpenChange={(open) => !open && setUserToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user{' '}
                            <strong>{userToDelete?.name}</strong> and all
                            associated data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteUserMutation.isPending}
                        >
                            {deleteUserMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}
