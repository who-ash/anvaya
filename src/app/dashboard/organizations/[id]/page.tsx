'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Search,
    UserPlus,
    Users,
    Building2,
    Loader2,
    MoreVertical,
    Trash2,
    Pencil,
    ShieldCheck,
    Shield,
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
import { AddMemberDialog } from '@/components/app/admin/organizations/add-member-dialog';
import { CreateGroupDialog } from '@/components/app/admin/organizations/create-group-dialog';
import { EditGroupDialog } from '@/components/app/admin/organizations/edit-group-dialog';
import { GroupDetailsSheet } from '@/components/app/admin/organizations/group-details-sheet';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/use-pagination';
import { useSearchWithParams } from '@/hooks/use-search-with-params';
import { Can, useAbility } from '@/providers/ability-provider';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';

type OrganizationMember = {
    id: number;
    userId: string;
    role: 'member' | 'admin';
    user: {
        id: string;
        name: string;
        email: string;
        image: string | null;
    };
};

type OrganizationGroup = {
    id: number;
    name: string;
    description: string | null;
    profilePicture: string | null;
    organizationId: number;
};

export default function UserOrganizationDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const organizationId = parseInt(params.id as string);

    const [activeTab, setActiveTab] = useState(
        searchParams.get('tab') || 'members',
    );
    const { searchQuery, debouncedSearchQuery, setSearchQuery } =
        useSearchWithParams();
    const { currentPage, limit, setCurrentPage, handlePageChange } =
        usePagination();
    const ability = useAbility();

    const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
    const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] =
        useState(false);
    const [memberToDelete, setMemberToDelete] =
        useState<OrganizationMember | null>(null);
    const [groupToDelete, setGroupToDelete] =
        useState<OrganizationGroup | null>(null);
    const [groupToEdit, setGroupToEdit] = useState<OrganizationGroup | null>(
        null,
    );
    const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(
        null,
    );
    const [selectedGroup, setSelectedGroup] =
        useState<OrganizationGroup | null>(null);

    // Fetch organization details
    const { data: organization, isLoading: isLoadingOrg } =
        trpc.organization.getById.useQuery(
            { id: organizationId },
            { refetchOnWindowFocus: false },
        );

    // Fetch members
    const {
        data: membersResponse,
        isLoading: isLoadingMembers,
        refetch: refetchMembers,
    } = trpc.organization.getMembers.useQuery(
        {
            organizationId,
            query: debouncedSearchQuery,
            page: currentPage,
            limit,
        },
        {
            refetchOnWindowFocus: false,
            enabled: activeTab === 'members',
        },
    );

    // Fetch groups
    const {
        data: groupsResponse,
        isLoading: isLoadingGroups,
        refetch: refetchGroups,
    } = trpc.organization.getGroups.useQuery(
        {
            organizationId,
            query: debouncedSearchQuery,
            page: currentPage,
            limit,
        },
        {
            refetchOnWindowFocus: false,
            enabled: activeTab === 'groups',
        },
    );

    const updateMemberRoleMutation =
        trpc.organization.updateMemberRole.useMutation({
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

    const deleteMemberMutation = trpc.organization.removeMember.useMutation({
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

    const deleteGroupMutation = trpc.organization.deleteGroup.useMutation({
        onSuccess: () => {
            toast.success('Group deleted successfully');
            refetchGroups();
            setGroupToDelete(null);
        },
        onError: (error: any) => {
            toast.error('Failed to delete group', {
                description: error.message || 'An unknown error occurred',
            });
        },
    });

    const members = membersResponse?.data || [];
    const membersPagination = membersResponse?.pagination;

    const groups = groupsResponse?.data || [];
    const groupsPagination = groupsResponse?.pagination;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setSearchQuery('');
        setCurrentPage(1);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', value);
        window.history.pushState({}, '', url.toString());
    };

    const handleRoleChange = (userId: string, newRole: 'member' | 'admin') => {
        setUpdatingRoleUserId(userId);
        updateMemberRoleMutation.mutate({
            organizationId,
            userId,
            role: newRole,
        });
    };

    const handleDeleteMember = () => {
        if (memberToDelete) {
            deleteMemberMutation.mutate({
                organizationId,
                userId: memberToDelete.userId,
            });
        }
    };

    const handleDeleteGroup = () => {
        if (groupToDelete) {
            deleteGroupMutation.mutate({
                groupId: groupToDelete.id,
            });
        }
    };

    if (isLoadingOrg) {
        return (
            <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4">
                <div className="flex items-start gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>
            </main>
        );
    }

    if (!organization) {
        return (
            <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4">
                <div className="flex flex-col gap-4 p-8">
                    <Building2 className="text-muted-foreground mx-auto h-12 w-12" />
                    <p className="text-muted-foreground mx-auto">
                        Organization not found
                    </p>
                </div>
            </main>
        );
    }

    const currentPagination =
        activeTab === 'members' ? membersPagination : groupsPagination;

    return (
        <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4">
            {/* Tabs with Content */}
            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-full"
            >
                {/* Header with Organization Info and Tabs */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Organization Info */}
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                            {organization.profilePicture && (
                                <AvatarImage
                                    src={organization.profilePicture}
                                />
                            )}
                            <AvatarFallback>
                                {getInitials(organization.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {organization.name}
                            </h2>
                            <div className="text-muted-foreground text-sm">
                                <TiptapViewer
                                    content={
                                        organization.description ||
                                        '<p>No description</p>'
                                    }
                                />
                            </div>
                            <Badge variant="secondary" className="mt-1 w-fit">
                                {organization.type}
                            </Badge>
                        </div>
                    </div>

                    {/* Tabs */}
                    <TabsList>
                        {/* <TabsTrigger value="members">
                            <Users className="h-4 w-4 mr-2" />
                            Members
                        </TabsTrigger> */}
                        {/* <TabsTrigger value="groups">
                            <Building2 className="h-4 w-4 mr-2" />
                            Groups
                        </TabsTrigger>
                        <TabsTrigger value="rbac">
                            <Shield className="h-4 w-4 mr-2" />
                            RBAC
                        </TabsTrigger> */}
                    </TabsList>
                </div>

                {/* Search and Action Button */}
                <div className="mt-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                        <Input
                            placeholder={`Search ${activeTab}...`}
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {activeTab === 'rbac' ? null : activeTab === 'members' ? (
                        <Can I="create" a={`org:${organizationId}:members`}>
                            <Button
                                onClick={() => setIsAddMemberDialogOpen(true)}
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Members
                            </Button>
                        </Can>
                    ) : (
                        <Can I="create" a={`org:${organizationId}:groups`}>
                            <Button
                                onClick={() => setIsCreateGroupDialogOpen(true)}
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Create Group
                            </Button>
                        </Can>
                    )}
                </div>

                <TabsContent value="members" className="mt-4">
                    {isLoadingMembers ? (
                        <TableSkeleton
                            columns={4}
                            rows={10}
                            showAvatar={true}
                        />
                    ) : !members || members.length === 0 ? (
                        <div className="flex flex-col gap-4 p-8">
                            <Users className="text-muted-foreground mx-auto h-12 w-12" />
                            <p className="text-muted-foreground mx-auto">
                                {searchQuery
                                    ? 'No members found matching your search.'
                                    : 'No members found.'}
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
                                                        {member.user.image && (
                                                            <AvatarImage
                                                                src={
                                                                    member.user
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
                                                    `org:${organizationId}:members`,
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
                                                    a={`org:${organizationId}:members`}
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
                                                                Remove Member
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
                </TabsContent>

                <TabsContent value="groups" className="mt-4">
                    {isLoadingGroups ? (
                        <TableSkeleton
                            columns={3}
                            rows={10}
                            showAvatar={true}
                        />
                    ) : !groups || groups.length === 0 ? (
                        <div className="flex flex-col gap-4 p-8">
                            <Building2 className="text-muted-foreground mx-auto h-12 w-12" />
                            <p className="text-muted-foreground mx-auto">
                                {searchQuery
                                    ? 'No groups found matching your search.'
                                    : 'No groups found.'}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Group</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groups.map((group) => (
                                        <TableRow
                                            key={group.id}
                                            className="cursor-pointer"
                                            onClick={() =>
                                                setSelectedGroup({
                                                    ...group,
                                                    organizationId,
                                                } as OrganizationGroup)
                                            }
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        {group.profilePicture && (
                                                            <AvatarImage
                                                                src={
                                                                    group.profilePicture
                                                                }
                                                            />
                                                        )}
                                                        <AvatarFallback>
                                                            {getInitials(
                                                                group.name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">
                                                        {group.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <TiptapViewer
                                                    content={
                                                        group.description ||
                                                        '<p>No description</p>'
                                                    }
                                                    className="preview-only"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Can
                                                    I="delete"
                                                    a={`org:${organizationId}:groups`}
                                                >
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
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
                                                            <Can
                                                                I="update"
                                                                a={`group:${group.id}`}
                                                            >
                                                                <DropdownMenuItem
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        setGroupToEdit(
                                                                            {
                                                                                ...group,
                                                                                organizationId,
                                                                            } as OrganizationGroup,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit Group
                                                                </DropdownMenuItem>
                                                            </Can>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setGroupToDelete(
                                                                        {
                                                                            ...group,
                                                                            organizationId,
                                                                        } as OrganizationGroup,
                                                                    );
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Group
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
                </TabsContent>

                <TabsContent value="rbac" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="text-primary h-5 w-5" />
                                Role-Based Access Control
                            </CardTitle>
                            <CardDescription>
                                Overview of roles and permissions within{' '}
                                {organization.name}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Badge>Admin</Badge>
                                        <span>Full Access</span>
                                    </div>
                                    <ul className="text-muted-foreground list-disc space-y-2 pl-4 text-sm">
                                        <li>
                                            Manage organization settings and
                                            members
                                        </li>
                                        <li>Create, edit, and delete groups</li>
                                        <li>Manage roles of all members</li>
                                        <li>
                                            Full access to all projects,
                                            sprints, and tasks
                                        </li>
                                        <li>
                                            Invite new members to the
                                            organization
                                        </li>
                                    </ul>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <Badge variant="secondary">
                                            Member
                                        </Badge>
                                        <span>Standard Access</span>
                                    </div>
                                    <ul className="text-muted-foreground list-disc space-y-2 pl-4 text-sm">
                                        <li>
                                            View organization members and groups
                                        </li>
                                        <li>
                                            Participate in assigned groups and
                                            projects
                                        </li>
                                        <li>
                                            View and manage tasks they are
                                            assigned to
                                        </li>
                                        <li>Create and track time on tasks</li>
                                        <li>
                                            Cannot manage organization-level
                                            settings
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">
                                    Group & Project Level RBAC
                                </h4>
                                <p className="text-muted-foreground text-sm">
                                    Additional roles can be assigned at the
                                    Group and Project levels. Org Admins
                                    automatically inherit administrative
                                    permissions across all child entities.
                                </p>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-lg border p-3">
                                        <div className="mb-1 text-xs font-medium">
                                            Group Admin
                                        </div>
                                        <p className="text-muted-foreground text-xs italic">
                                            Full group management
                                        </p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <div className="mb-1 text-xs font-medium">
                                            Group Evaluator
                                        </div>
                                        <p className="text-muted-foreground text-xs italic">
                                            Review and assessment
                                        </p>
                                    </div>
                                    <div className="rounded-lg border p-3">
                                        <div className="mb-1 text-xs font-medium">
                                            Project Admin
                                        </div>
                                        <p className="text-muted-foreground text-xs italic">
                                            Sprints & tasks management
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AddMemberDialog
                open={isAddMemberDialogOpen}
                onOpenChange={setIsAddMemberDialogOpen}
                organizationId={organizationId}
                onMembersAdded={() => refetchMembers()}
            />
            <CreateGroupDialog
                open={isCreateGroupDialogOpen}
                onOpenChange={setIsCreateGroupDialogOpen}
                organizationId={organizationId}
                onGroupCreated={() => refetchGroups()}
            />
            <EditGroupDialog
                open={!!groupToEdit}
                onOpenChange={(open) => !open && setGroupToEdit(null)}
                group={groupToEdit}
                onGroupUpdated={() => refetchGroups()}
            />
            <GroupDetailsSheet
                open={!!selectedGroup}
                onOpenChange={(open) => !open && setSelectedGroup(null)}
                group={selectedGroup}
            />

            {/* Pagination */}
            {currentPagination && currentPagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        currentPagination.hasPreviousPage &&
                                        handlePageChange(currentPage - 1)
                                    }
                                    className={
                                        !currentPagination.hasPreviousPage
                                            ? 'pointer-events-none opacity-50'
                                            : 'cursor-pointer'
                                    }
                                />
                            </PaginationItem>

                            {Array.from(
                                { length: currentPagination.totalPages },
                                (_, i) => i + 1,
                            ).map((page) => {
                                const showPage =
                                    page === 1 ||
                                    page === currentPagination.totalPages ||
                                    (page >= currentPage - 1 &&
                                        page <= currentPage + 1);

                                const showEllipsisBefore =
                                    page === currentPage - 2 && currentPage > 3;
                                const showEllipsisAfter =
                                    page === currentPage + 2 &&
                                    currentPage <
                                        currentPagination.totalPages - 2;

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
                                        currentPagination.hasNextPage &&
                                        handlePageChange(currentPage + 1)
                                    }
                                    className={
                                        !currentPagination.hasNextPage
                                            ? 'pointer-events-none opacity-50'
                                            : 'cursor-pointer'
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* Delete Member Dialog */}
            <AlertDialog
                open={!!memberToDelete}
                onOpenChange={(open) => !open && setMemberToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove{' '}
                            <strong>{memberToDelete?.user.name}</strong> from
                            the organization. This action cannot be undone.
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

            {/* Delete Group Dialog */}
            <AlertDialog
                open={!!groupToDelete}
                onOpenChange={(open) => !open && setGroupToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete{' '}
                            <strong>{groupToDelete?.name}</strong> from the
                            organization. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteGroup}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteGroupMutation.isPending}
                        >
                            {deleteGroupMutation.isPending ? (
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
