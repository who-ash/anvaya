'use client';

import { useState } from 'react';
import { trpc } from '@/providers/trpc-provider';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, MoreVertical, Trash2 } from 'lucide-react';
import { AddProjectMemberDialog } from './add-project-member-dialog';
import { Can } from '@/providers/ability-provider';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ProjectMembersProps {
    projectId: number;
    organizationId: number;
}

export function ProjectMembers({
    projectId,
    organizationId,
}: ProjectMembersProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const {
        data: members,
        isLoading,
        refetch,
    } = trpc.project.getMembers.useQuery({ projectId });
    const utils = trpc.useUtils();

    const removeMemberMutation = trpc.project.removeMember.useMutation({
        onSuccess: () => {
            toast.success('Member removed from project');
            refetch();
            utils.project.getById.invalidate({ id: projectId });
        },
        onError: (error) => {
            toast.error('Failed to remove member', {
                description: error.message,
            });
        },
    });

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="bg-muted h-8 w-32 animate-pulse rounded" />
                    <div className="bg-muted h-10 w-32 animate-pulse rounded" />
                </div>
                <div className="bg-muted/20 h-64 animate-pulse rounded-md border" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Project Members</h2>
                    <p className="text-muted-foreground text-sm">
                        Manage who has access to this project.
                    </p>
                </div>
                <Can I="update" a={`org:${organizationId}:projects`}>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Member
                    </Button>
                </Can>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members?.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-muted-foreground h-24 text-center"
                                >
                                    No members found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            members?.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                {member.user.image && (
                                                    <AvatarImage
                                                        src={member.user.image}
                                                    />
                                                )}
                                                <AvatarFallback>
                                                    {getInitials(
                                                        member.user.name,
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">
                                                {member.user.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{member.user.email}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                member.role === 'admin'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {member.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Can
                                            I="update"
                                            a={`org:${organizationId}:projects`}
                                        >
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
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() =>
                                                            removeMemberMutation.mutate(
                                                                {
                                                                    id: member.id,
                                                                    organizationId,
                                                                },
                                                            )
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AddProjectMemberDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                projectId={projectId}
                organizationId={organizationId}
                onMembersAdded={refetch}
            />
        </div>
    );
}
