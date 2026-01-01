'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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
import {
    Search,
    Loader2,
    MoreVertical,
    Trash2,
    Users,
    UserPlus,
} from 'lucide-react';
import { trpc } from '@/providers/trpc-provider';
import { toast } from 'sonner';
import { AddGroupMemberDialog } from './add-group-member-dialog';
import { Can, useAbility } from '@/providers/ability-provider';
import TiptapViewer from '../../tiptap/tiptap-viewer';

type GroupMember = {
    id: number;
    userId: string;
    role: 'member' | 'admin' | 'evaluator';
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
};

type GroupDetailsSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    group: {
        id: number;
        name: string;
        description: string | null;
        profilePicture: string | null;
        organizationId: number;
    } | null;
};

export function GroupDetailsSheet({
    open,
    onOpenChange,
    group,
}: GroupDetailsSheetProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [memberToDelete, setMemberToDelete] = useState<GroupMember | null>(
        null,
    );
    const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(
        null,
    );
    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const ability = useAbility();
    const limit = 10;

    // Fetch group members
    const {
        data: membersResponse,
        isLoading: isLoadingMembers,
        refetch: refetchMembers,
    } = trpc.organization.getGroupMembers.useQuery(
        {
            groupId: group?.id || 0,
            query: searchQuery,
            page: currentPage,
            limit,
        },
        {
            enabled: open && !!group,
            refetchOnWindowFocus: false,
        },
    );

    const updateMemberRoleMutation =
        trpc.organization.updateGroupMemberRole.useMutation({
            onSuccess: () => {
                toast.success('Role updated successfully');
                refetchMembers();
                setUpdatingRoleUserId(null);
            },
            onError: (error: any) => {
                toast.error('Failed to update role', {
                    description: error.message || 'An unknown error occurred',
                });
                setUpdatingRoleUserId(null);
            },
        });

    const deleteMemberMutation =
        trpc.organization.removeGroupMember.useMutation({
            onSuccess: () => {
                toast.success('Member removed successfully');
                refetchMembers();
                setMemberToDelete(null);
            },
            onError: (error: any) => {
                toast.error('Failed to remove member', {
                    description: error.message || 'An unknown error occurred',
                });
            },
        });

    const members = membersResponse?.data || [];
    const pagination = membersResponse?.pagination;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleRoleChange = (
        userId: string,
        newRole: 'member' | 'admin' | 'evaluator',
    ) => {
        if (!group) return;
        setUpdatingRoleUserId(userId);
        updateMemberRoleMutation.mutate({
            groupId: group.id,
            userId,
            role: newRole,
        });
    };

    const handleDeleteMember = () => {
        if (memberToDelete && group) {
            deleteMemberMutation.mutate({
                groupId: group.id,
                userId: memberToDelete.userId,
            });
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            // Reset state when closing
            setSearchQuery('');
            setCurrentPage(1);
            setMemberToDelete(null);
            setUpdatingRoleUserId(null);
        }
        onOpenChange(newOpen);
    };

    if (!group) return null;

    return (
        <>
            <Sheet open={open} onOpenChange={handleOpenChange}>
                <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
                    <SheetHeader>
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                                {group.profilePicture && (
                                    <AvatarImage src={group.profilePicture} />
                                )}
                                <AvatarFallback>
                                    {getInitials(group.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-1">
                                <SheetTitle className="text-2xl">
                                    {group.name}
                                </SheetTitle>
                                <SheetDescription>
                                    <TiptapViewer
                                        content={
                                            group.description
                                                ? group.description
                                                : '<p>No description</p>'
                                        }
                                    />
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="mt-6 space-y-4 px-4">
                        {/* Search and Add Member Button */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                                <Input
                                    placeholder="Search members..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                            <Can I="create" a={`group:${group.id}:members`}>
                                <Button
                                    onClick={() =>
                                        setIsAddMemberDialogOpen(true)
                                    }
                                >
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add Member
                                </Button>
                            </Can>
                        </div>

                        {/* Members Table */}
                        {isLoadingMembers ? (
                            <TableSkeleton
                                columns={4}
                                rows={10}
                                showAvatar={true}
                            />
                        ) : !members || members.length === 0 ? (
                            <div className="flex flex-col gap-4 p-8">
                                <Users className="text-muted-foreground mx-auto h-12 w-12" />
                                <p className="text-muted-foreground mx-auto text-center">
                                    {searchQuery
                                        ? 'No members found matching your search.'
                                        : 'No members in this group.'}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Member</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {members.map((member) => (
                                            <TableRow key={member.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            {member.user
                                                                .image && (
                                                                <AvatarImage
                                                                    src={
                                                                        member
                                                                            .user
                                                                            .image
                                                                    }
                                                                />
                                                            )}
                                                            <AvatarFallback>
                                                                {getInitials(
                                                                    member.user
                                                                        .name,
                                                                )}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">
                                                            {member.user.name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {member.user.email}
                                                </TableCell>
                                                <TableCell>
                                                    {ability.can(
                                                        'update',
                                                        `group:${group.id}:members`,
                                                    ) ? (
                                                        <Popover>
                                                            <PopoverTrigger
                                                                asChild
                                                                disabled={
                                                                    member.role ===
                                                                    'admin'
                                                                }
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-auto p-0 hover:bg-transparent"
                                                                    disabled={
                                                                        updatingRoleUserId ===
                                                                            member.userId ||
                                                                        member.role ===
                                                                            'admin'
                                                                    }
                                                                >
                                                                    {updatingRoleUserId ===
                                                                    member.userId ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                            <span className="text-xs">
                                                                                Updating...
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <Badge
                                                                            variant={
                                                                                member.role ===
                                                                                'admin'
                                                                                    ? 'default'
                                                                                    : 'secondary'
                                                                            }
                                                                            className={
                                                                                member.role ===
                                                                                'admin'
                                                                                    ? ''
                                                                                    : 'cursor-pointer'
                                                                            }
                                                                        >
                                                                            {
                                                                                member.role
                                                                            }
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
                                                                            member.role ===
                                                                            'member'
                                                                                ? 'default'
                                                                                : 'ghost'
                                                                        }
                                                                        className="w-full justify-start text-sm"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleRoleChange(
                                                                                member.userId,
                                                                                'member',
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            member.role ===
                                                                            'member'
                                                                        }
                                                                    >
                                                                        Member
                                                                    </Button>
                                                                    <Button
                                                                        variant={
                                                                            member.role ===
                                                                            'evaluator'
                                                                                ? 'default'
                                                                                : 'ghost'
                                                                        }
                                                                        className="w-full justify-start text-sm"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleRoleChange(
                                                                                member.userId,
                                                                                'evaluator',
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            member.role ===
                                                                            'evaluator'
                                                                        }
                                                                    >
                                                                        Evaluator
                                                                    </Button>
                                                                    <Button
                                                                        variant={
                                                                            member.role ===
                                                                            'admin'
                                                                                ? 'default'
                                                                                : 'ghost'
                                                                        }
                                                                        className="w-full justify-start text-sm"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            handleRoleChange(
                                                                                member.userId,
                                                                                'admin',
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            member.role ===
                                                                            'admin'
                                                                        }
                                                                    >
                                                                        Admin
                                                                    </Button>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    ) : (
                                                        <Badge
                                                            variant={
                                                                member.role ===
                                                                'admin'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {member.role}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Can
                                                        I="delete"
                                                        a={`group:${group.id}:members`}
                                                    >
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    disabled={
                                                                        member.role ===
                                                                        'admin'
                                                                    }
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
                                                                    className="text-destructive"
                                                                    onClick={() =>
                                                                        setMemberToDelete(
                                                                            member,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        member.role ===
                                                                        'admin'
                                                                    }
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Remove
                                                                    Member
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </Can>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() =>
                                                    pagination.hasPreviousPage &&
                                                    handlePageChange(
                                                        currentPage - 1,
                                                    )
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
                                            const showPage =
                                                page === 1 ||
                                                page ===
                                                    pagination.totalPages ||
                                                (page >= currentPage - 1 &&
                                                    page <= currentPage + 1);

                                            const showEllipsisBefore =
                                                page === currentPage - 2 &&
                                                currentPage > 3;
                                            const showEllipsisAfter =
                                                page === currentPage + 2 &&
                                                currentPage <
                                                    pagination.totalPages - 2;

                                            if (
                                                showEllipsisBefore ||
                                                showEllipsisAfter
                                            ) {
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
                                                            handlePageChange(
                                                                page,
                                                            )
                                                        }
                                                        isActive={
                                                            currentPage === page
                                                        }
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
                                                    handlePageChange(
                                                        currentPage + 1,
                                                    )
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
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Member Dialog */}
            <AlertDialog
                open={!!memberToDelete}
                onOpenChange={(open) => {
                    if (!open) {
                        setMemberToDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove{' '}
                            <strong>{memberToDelete?.user.name}</strong> from
                            the group. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteMember}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMemberMutation.isPending}
                        >
                            {deleteMemberMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                'Remove'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add Member Dialog */}
            <AddGroupMemberDialog
                open={isAddMemberDialogOpen}
                onOpenChange={setIsAddMemberDialogOpen}
                groupId={group?.id || 0}
                organizationId={group?.organizationId || 0}
                onMembersAdded={() => refetchMembers()}
            />
        </>
    );
}
