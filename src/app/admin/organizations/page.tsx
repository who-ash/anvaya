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
    Building2,
    MoreVertical,
    Loader2,
    Trash2,
    Edit,
    Building,
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
import { CreateOrganizationDialog } from '@/components/app/admin/organizations/create-organization-dialog';
import { EditOrganizationDialog } from '@/components/app/admin/organizations/edit-organization-dialog';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/use-pagination';
import { useSearchWithParams } from '@/hooks/use-search-with-params';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';

type Organization = {
    id: number;
    name: string;
    description: string | null;
    type: string;
    profilePicture: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
};

export default function OrganizationsPage() {
    const { searchQuery, debouncedSearchQuery, setSearchQuery } =
        useSearchWithParams();
    const { currentPage, limit, setCurrentPage, handlePageChange } =
        usePagination();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedOrganization, setSelectedOrganization] =
        useState<Organization | null>(null);
    const [organizationToDelete, setOrganizationToDelete] =
        useState<Organization | null>(null);

    const {
        data: response,
        isLoading,
        refetch,
    } = trpc.organization.search.useQuery(
        { query: debouncedSearchQuery, page: currentPage, limit },
        {
            refetchOnWindowFocus: false,
        },
    );

    const organizations = response?.data || [];
    const pagination = response?.pagination;

    const deleteOrganizationMutation = trpc.organization.delete.useMutation({
        onSuccess: () => {
            toast.success('Organization deleted successfully');
            refetch();
            setOrganizationToDelete(null);
        },
        onError: (error: any) => {
            toast.error('Failed to delete organization', {
                description: error.message || 'An unknown error occurred',
            });
        },
    });

    const handleOrganizationCreated = () => {
        refetch();
    };

    const handleOrganizationUpdated = () => {
        refetch();
    };

    const handleDeleteOrganization = () => {
        if (organizationToDelete) {
            deleteOrganizationMutation.mutate({ id: organizationToDelete.id });
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
                    <Building2 className="mt-1 h-6 w-6" />
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold tracking-tight">
                            Organization Management
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Manage all organizations and their settings
                        </p>
                    </div>
                </div>
                <CreateOrganizationDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    isLoading={isLoading}
                    onOrganizationCreated={handleOrganizationCreated}
                />
            </div>

            <div className="mb-4">
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                    <Input
                        placeholder="Search organizations by name, type, or description..."
                        className="max-w-sm pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <TableSkeleton columns={4} rows={10} showAvatar={true} />
            ) : !organizations || organizations.length === 0 ? (
                <div className="flex flex-col gap-4 p-8">
                    <Building className="text-muted-foreground mx-auto h-12 w-12" />
                    <p className="text-muted-foreground mx-auto">
                        {searchQuery
                            ? 'No organizations found matching your search.'
                            : 'No organizations found.'}
                    </p>
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Organization</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {organizations.map((org: Organization) => (
                                <TableRow
                                    key={org.id}
                                    className="hover:bg-muted/50 cursor-pointer"
                                    onClick={() =>
                                        (window.location.href = `/admin/organizations/${org.id}`)
                                    }
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                {org.profilePicture && (
                                                    <AvatarImage
                                                        src={org.profilePicture}
                                                    />
                                                )}
                                                <AvatarFallback>
                                                    {getInitials(org.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">
                                                {org.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {org.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-xs">
                                        <div className="line-clamp-2 overflow-hidden">
                                            <TiptapViewer
                                                content={
                                                    org.description
                                                        ? org.description
                                                        : '<p>No description</p>'
                                                }
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
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
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedOrganization(
                                                            org,
                                                        );
                                                        setIsEditDialogOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Organization
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOrganizationToDelete(
                                                            org,
                                                        );
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete Organization
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
                        Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} results
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

            <EditOrganizationDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                organization={selectedOrganization}
                onOrganizationUpdated={handleOrganizationUpdated}
            />

            <AlertDialog
                open={!!organizationToDelete}
                onOpenChange={(open) => !open && setOrganizationToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the organization{' '}
                            <strong>{organizationToDelete?.name}</strong> and
                            all associated data. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteOrganization}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteOrganizationMutation.isPending}
                        >
                            {deleteOrganizationMutation.isPending ? (
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
