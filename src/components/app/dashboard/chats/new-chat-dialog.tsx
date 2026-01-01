'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/providers/trpc-provider';
import { useOrganization } from '@/providers/organization-provider';
import { Search, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface NewChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectMember: (userId: string) => void;
}

export function NewChatDialog({
    open,
    onOpenChange,
    onSelectMember,
}: NewChatDialogProps) {
    const { activeOrgId } = useOrganization();
    const [search, setSearch] = useState('');

    const { data: members, isLoading } =
        trpc.chat.getOrganizationMembers.useQuery(
            { organizationId: activeOrgId! },
            { enabled: !!activeOrgId && open },
        );

    const filteredMembers = members?.filter(
        (member) =>
            member.name?.toLowerCase().includes(search.toLowerCase()) ||
            member.email?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                        <Input
                            placeholder="Search members..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-1">
                            {isLoading ? (
                                <div className="text-muted-foreground py-4 text-center text-sm">
                                    Loading members...
                                </div>
                            ) : filteredMembers?.length === 0 ? (
                                <div className="text-muted-foreground py-4 text-center text-sm">
                                    No members found
                                </div>
                            ) : (
                                filteredMembers?.map((member) => (
                                    <Button
                                        key={member.id}
                                        variant="ghost"
                                        className="h-14 w-full justify-start gap-3 p-2"
                                        onClick={() => {
                                            onSelectMember(member.id);
                                            onOpenChange(false);
                                        }}
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={member.image || ''}
                                            />
                                            <AvatarFallback>
                                                <User className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex min-w-0 flex-1 flex-col items-start">
                                            <p className="truncate text-sm font-medium">
                                                {member.name}
                                            </p>
                                            <p className="text-muted-foreground truncate text-xs">
                                                {member.email}
                                            </p>
                                        </div>
                                    </Button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
