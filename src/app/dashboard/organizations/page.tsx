'use client';

import { useState } from 'react';
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
import { Search, Building2, Building } from 'lucide-react';
import { trpc } from '@/providers/trpc-provider';
import { useRouter } from 'next/navigation';
import { usePagination } from '@/hooks/use-pagination';
import { useSearchWithParams } from '@/hooks/use-search-with-params';

type Organization = {
    id: number;
    name: string;
    description: string | null;
    type: string;
    profilePicture: string | null;
    createdAt: Date;
};

export default function UserOrganizationsPage() {
    const router = useRouter();
    const { searchQuery, debouncedSearchQuery, setSearchQuery } =
        useSearchWithParams();
    const { currentPage, limit, setCurrentPage, handlePageChange } =
        usePagination();

    const { data: response, isLoading } =
        trpc.dashboard.getUserOrganizations.useQuery(
            { query: debouncedSearchQuery, page: currentPage, limit },
            {
                refetchOnWindowFocus: false,
            },
        );

    const organizations = response?.data || [];
    const pagination = response?.pagination;

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
                            My Organizations
                        </h2>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Organizations you are a member of
                        </p>
                    </div>
                </div>
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
                <TableSkeleton columns={3} rows={10} showAvatar={true} />
            ) : !organizations || organizations.length === 0 ? (
                <div className="flex flex-col gap-4 p-8">
                    <Building className="text-muted-foreground mx-auto h-12 w-12" />
                    <p className="text-muted-foreground mx-auto">
                        {searchQuery
                            ? 'No organizations found matching your search.'
                            : 'You are not a member of any organizations yet.'}
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {organizations.map((org: Organization) => (
                                <TableRow
                                    key={org.id}
                                    className="hover:bg-muted/50 cursor-pointer"
                                    onClick={() =>
                                        router.push(
                                            `/dashboard/organizations/${org.id}`,
                                        )
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
                                    <TableCell className="text-muted-foreground">
                                        {org.description || 'No description'}
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
        </main>
    );
}
