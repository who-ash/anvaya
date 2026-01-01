'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';

interface Chat {
    id: number;
    name: string | null;
    image?: string | null;
    type: 'direct' | 'group';
    lastMessage?: string | null;
    lastMessageAt?: Date | null;
}

interface ChatSidebarProps {
    chats: Chat[];
    activeChatId: number | null;
    onSelectChat: (id: number) => void;
    onNewChat: () => void;
    isLoading?: boolean;
}

export function ChatSidebar({
    chats,
    activeChatId,
    onSelectChat,
    onNewChat,
    isLoading,
}: ChatSidebarProps) {
    const [search, setSearch] = useState('');

    const filteredChats = chats.filter((chat) =>
        chat.name?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div className="border-border bg-muted/30 flex w-80 flex-col border-r">
            <div className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="font-heading text-xl font-bold">Chats</h1>
                    <Button variant="ghost" size="icon" onClick={onNewChat}>
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                    <Input
                        className="bg-background/50 pl-8"
                        placeholder="Search chats..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="space-y-1 p-2">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex animate-pulse items-center gap-3 p-3"
                            >
                                <div className="bg-muted h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="bg-muted h-4 w-3/4 rounded" />
                                    <div className="bg-muted h-3 w-1/2 rounded" />
                                </div>
                            </div>
                        ))
                    ) : filteredChats.length === 0 ? (
                        <div className="text-muted-foreground py-8 text-center text-sm">
                            No chats found
                        </div>
                    ) : (
                        filteredChats.map((chat) => (
                            <div
                                key={chat.id}
                                className={cn(
                                    'hover:bg-muted group flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all',
                                    activeChatId === chat.id &&
                                        'bg-muted shadow-sm',
                                )}
                                onClick={() => onSelectChat(chat.id)}
                            >
                                <Avatar className="group-hover:border-primary/20 h-10 w-10 border-2 border-transparent transition-all">
                                    <AvatarImage src={chat.image || ''} />
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        {chat.name ? (
                                            chat.name[0]
                                        ) : (
                                            <User className="h-5 w-5" />
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-0.5 flex items-center justify-between">
                                        <p className="truncate text-sm font-semibold">
                                            {chat.name}
                                        </p>
                                        {chat.lastMessageAt && (
                                            <span className="text-muted-foreground text-[10px]">
                                                {formatDistanceToNow(
                                                    new Date(
                                                        chat.lastMessageAt,
                                                    ),
                                                    { addSuffix: false },
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        {chat.lastMessage ? (
                                            <TiptapViewer
                                                content={chat.lastMessage}
                                                className="preview-only text-muted-foreground pointer-events-none line-clamp-1 text-xs"
                                            />
                                        ) : (
                                            <p className="text-muted-foreground truncate text-xs leading-relaxed">
                                                No messages yet
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
