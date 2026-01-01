'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    User,
    Check,
    CheckCheck,
    Paperclip,
    MoreHorizontal,
    Pencil,
    Trash,
    X,
    Check as CheckIcon,
} from 'lucide-react';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';
import TiptapEditor from '@/components/app/tiptap/tiptap-editor';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    readAt?: Date | null;
    sender: {
        id: string;
        name: string | null;
        image: string | null;
    };
    attachments?: {
        id: number;
        fileName: string;
        fileUrl: string;
    }[];
}

interface ChatMessagesProps {
    messages: Message[];
    currentUserId: string;
    onEditMessage: (messageId: number, content: string) => void;
    onDeleteMessage: (messageId: number) => void;
}

export function ChatMessages({
    messages,
    currentUserId,
    onEditMessage,
    onDeleteMessage,
}: ChatMessagesProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div
            className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4"
            ref={scrollRef}
        >
            <div className="space-y-6">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                            <User className="text-muted-foreground h-8 w-8" />
                        </div>
                        <h3 className="font-semibold">No messages yet</h3>
                        <p className="text-muted-foreground text-sm">
                            Start the conversation!
                        </p>
                    </div>
                ) : (
                    messages.map((message, idx) => {
                        const isMine = message.sender.id === currentUserId;
                        const showAvatar =
                            idx === 0 ||
                            messages[idx - 1].sender.id !== message.sender.id;

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    'group flex max-w-[85%] gap-4',
                                    isMine
                                        ? 'ml-auto flex-row-reverse'
                                        : 'flex-row',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex w-10 shrink-0 flex-col items-center',
                                        !showAvatar && 'invisible',
                                    )}
                                >
                                    <Avatar className="border-border h-10 w-10 border shadow-sm">
                                        <AvatarImage
                                            src={message.sender.image || ''}
                                        />
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                            {message.sender.name
                                                ? message.sender.name[0]
                                                : 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div
                                    className={cn(
                                        'flex max-w-full min-w-0 flex-col gap-1',
                                        isMine ? 'items-end' : 'items-start',
                                    )}
                                >
                                    {!isMine && showAvatar && (
                                        <span className="text-muted-foreground ml-1 text-[10px] font-bold">
                                            {message.sender.name}
                                        </span>
                                    )}
                                    <div className="group/msg relative max-w-full">
                                        <div
                                            className={cn(
                                                'relative min-w-[64px] rounded-2xl p-2.5 text-[14px] shadow-sm transition-all',
                                                isMine
                                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                                    : 'bg-muted text-foreground rounded-tl-none',
                                            )}
                                        >
                                            {/* Action Menu (Inside bubble, top-right, appears on hover) */}
                                            {isMine && !editingId && (
                                                <div className="absolute top-1 right-1 z-20 opacity-0 transition-opacity group-hover/msg:opacity-100">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                                                            >
                                                                <MoreHorizontal className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-32"
                                                        >
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setEditingId(
                                                                        message.id,
                                                                    );
                                                                    setEditContent(
                                                                        message.content,
                                                                    );
                                                                }}
                                                            >
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() =>
                                                                    onDeleteMessage(
                                                                        message.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}

                                            {editingId === message.id ? (
                                                <div className="bg-background border-border relative z-20 flex min-w-[280px] flex-col gap-2 rounded-lg border p-2">
                                                    <TiptapEditor
                                                        hideToolbar
                                                        initialContent={
                                                            message.content
                                                        }
                                                        onChange={
                                                            setEditContent
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    'Enter' &&
                                                                !e.shiftKey
                                                            ) {
                                                                onEditMessage(
                                                                    message.id,
                                                                    editContent,
                                                                );
                                                                setEditingId(
                                                                    null,
                                                                );
                                                                return true;
                                                            } else if (
                                                                e.key ===
                                                                'Escape'
                                                            ) {
                                                                setEditingId(
                                                                    null,
                                                                );
                                                                return true;
                                                            }
                                                            return false;
                                                        }}
                                                        editorClassName="min-h-0 border-0 p-2 max-h-[150px] overflow-y-auto "
                                                        className="border-0 shadow-none"
                                                    />
                                                    <div className="flex justify-end gap-1 px-1 pb-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-foreground hover:bg-muted h-7 w-7"
                                                            onClick={() =>
                                                                setEditingId(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-primary hover:bg-muted h-7 w-7"
                                                            onClick={() => {
                                                                onEditMessage(
                                                                    message.id,
                                                                    editContent,
                                                                );
                                                                setEditingId(
                                                                    null,
                                                                );
                                                            }}
                                                        >
                                                            <CheckIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="pr-4 pb-1">
                                                    <TiptapViewer
                                                        content={
                                                            message.content
                                                        }
                                                        className="chat-message-content prose-p:my-0"
                                                    />
                                                </div>
                                            )}

                                            {message.attachments &&
                                                message.attachments.length >
                                                    0 && (
                                                    <div className="mt-2 mb-2 space-y-1">
                                                        {message.attachments.map(
                                                            (attachment) => (
                                                                <a
                                                                    key={
                                                                        attachment.id
                                                                    }
                                                                    href={
                                                                        attachment.fileUrl
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={cn(
                                                                        'hover:bg-opacity-80 flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors',
                                                                        isMine
                                                                            ? 'bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground'
                                                                            : 'bg-background border-border text-primary',
                                                                    )}
                                                                >
                                                                    <Paperclip className="h-3 w-3" />
                                                                    <span className="max-w-[200px] truncate underline">
                                                                        {
                                                                            attachment.fileName
                                                                        }
                                                                    </span>
                                                                </a>
                                                            ),
                                                        )}
                                                    </div>
                                                )}

                                            {/* WhatsApp-style bottom-right timestamp */}
                                            <div
                                                className={cn(
                                                    'absolute right-2 bottom-1 flex items-center gap-1 text-[8px] opacity-60',
                                                    isMine
                                                        ? 'text-primary-foreground'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {message.updatedAt &&
                                                    new Date(
                                                        message.updatedAt,
                                                    ).getTime() >
                                                        new Date(
                                                            message.createdAt,
                                                        ).getTime() +
                                                            1000 && (
                                                        <span className="mr-0.5 italic">
                                                            (edited)
                                                        </span>
                                                    )}
                                                <span>
                                                    {format(
                                                        new Date(
                                                            message.createdAt,
                                                        ),
                                                        'h:mm a',
                                                    )}
                                                </span>
                                                {isMine &&
                                                    (message.readAt ? (
                                                        <CheckCheck className="h-2.5 w-2.5 text-blue-400" />
                                                    ) : (
                                                        <Check className="h-2.5 w-2.5" />
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
