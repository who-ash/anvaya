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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { trpc } from '@/providers/trpc-provider';
import { Search, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddGroupMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: number;
    organizationId: number;
    onMembersAdded: () => void;
}

type OrgMember = {
    id: number;
    userId: string;
    name: string;
    email: string;
    image: string | null;
};

type SelectedMember = OrgMember & {
    role: 'member' | 'admin' | 'evaluator';
};

export function AddGroupMemberDialog({
    open,
    onOpenChange,
    groupId,
    organizationId,
    onMembersAdded,
}: AddGroupMemberDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<SelectedMember[]>(
        [],
    );
    const [defaultRole, setDefaultRole] = useState<
        'member' | 'admin' | 'evaluator'
    >('member');
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    const { data: membersData, isLoading: isSearching } =
        trpc.organization.getAddGroupMembers.useQuery(
            {
                groupId,
                organizationId,
                query: searchQuery,
                page: currentPage,
                limit,
            },
            {
                enabled: open && groupId > 0 && organizationId > 0,
                refetchOnWindowFocus: false,
            },
        );

    const members = membersData?.data || [];
    const pagination = membersData?.pagination;

    const addMembersMutation = trpc.organization.addGroupMembers.useMutation({
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
        setSelectedMembers([]);
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

    const handleMemberToggle = (member: OrgMember) => {
        const isSelected = selectedMembers.some(
            (m) => m.userId === member.userId,
        );

        if (isSelected) {
            setSelectedMembers(
                selectedMembers.filter((m) => m.userId !== member.userId),
            );
        } else {
            setSelectedMembers([
                ...selectedMembers,
                { ...member, role: defaultRole },
            ]);
        }
    };

    const handleRoleChange = (
        userId: string,
        role: 'member' | 'admin' | 'evaluator',
    ) => {
        setSelectedMembers(
            selectedMembers.map((m) =>
                m.userId === userId ? { ...m, role } : m,
            ),
        );
    };

    const handleRemoveMember = (userId: string) => {
        setSelectedMembers(selectedMembers.filter((m) => m.userId !== userId));
    };

    const handleAddMembers = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedMembers.length === 0) {
            toast.error('Please select at least one member');
            return;
        }

        addMembersMutation.mutate({
            groupId,
            members: selectedMembers.map((m) => ({
                userId: m.userId,
                role: m.role,
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
            <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add Members to Group</DialogTitle>
                    <DialogDescription>
                        Search for organization members and add them to this
                        group with specific roles.
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleAddMembers}
                    className="flex flex-1 flex-col gap-4 overflow-hidden"
                >
                    {/* Default Role Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="defaultRole" className="text-right">
                            Default Role
                        </Label>
                        <Select
                            value={defaultRole}
                            onValueChange={(value) =>
                                setDefaultRole(
                                    value as 'member' | 'admin' | 'evaluator',
                                )
                            }
                            disabled={isSubmitting}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select default role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="evaluator">
                                    Evaluator
                                </SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Member Search */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="search" className="pt-2 text-right">
                            Search Members
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
                                        ) : members && members.length > 0 ? (
                                            <div className="space-y-2">
                                                {members.map((member) => {
                                                    const isSelected =
                                                        selectedMembers.some(
                                                            (m) =>
                                                                m.userId ===
                                                                member.userId,
                                                        );
                                                    return (
                                                        <Label
                                                            key={member.id}
                                                            className="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md p-2"
                                                        >
                                                            <Checkbox
                                                                checked={
                                                                    isSelected
                                                                }
                                                                onCheckedChange={() =>
                                                                    handleMemberToggle(
                                                                        member,
                                                                    )
                                                                }
                                                            />
                                                            <Avatar className="h-8 w-8">
                                                                {member.image && (
                                                                    <AvatarImage
                                                                        src={
                                                                            member.image
                                                                        }
                                                                    />
                                                                )}
                                                                <AvatarFallback>
                                                                    {getInitials(
                                                                        member.name,
                                                                    )}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium">
                                                                    {
                                                                        member.name
                                                                    }
                                                                </p>
                                                                <p className="text-muted-foreground text-xs">
                                                                    {
                                                                        member.email
                                                                    }
                                                                </p>
                                                            </div>
                                                        </Label>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground p-4 text-center text-sm">
                                                No members found
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

                    {/* Selected Members */}
                    {selectedMembers.length > 0 && (
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="pt-2 text-right">
                                Selected ({selectedMembers.length})
                            </Label>
                            <ScrollArea className="col-span-3 h-[200px] rounded-md border p-2">
                                <div className="space-y-2">
                                    {selectedMembers.map((member) => (
                                        <div
                                            key={member.userId}
                                            className="bg-muted flex items-center gap-3 rounded-md p-2"
                                        >
                                            <Avatar className="h-8 w-8">
                                                {member.image && (
                                                    <AvatarImage
                                                        src={member.image}
                                                    />
                                                )}
                                                <AvatarFallback>
                                                    {getInitials(member.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    {member.name}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    {member.email}
                                                </p>
                                            </div>
                                            <Select
                                                value={member.role}
                                                onValueChange={(role) =>
                                                    handleRoleChange(
                                                        member.userId,
                                                        role as
                                                            | 'member'
                                                            | 'admin'
                                                            | 'evaluator',
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
                                                    <SelectItem value="evaluator">
                                                        Evaluator
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
                                                    handleRemoveMember(
                                                        member.userId,
                                                    )
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
                                isSubmitting || selectedMembers.length === 0
                            }
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                `Add ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
