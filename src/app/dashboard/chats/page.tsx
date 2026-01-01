'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/providers/trpc-provider';
import { useOrganization } from '@/providers/organization-provider';
import { ChatSidebar } from '@/components/app/dashboard/chats/chat-sidebar';
import { ChatMessages } from '@/components/app/dashboard/chats/chat-messages';
import { ChatInput } from '@/components/app/dashboard/chats/chat-input';
import { NewChatDialog } from '@/components/app/dashboard/chats/new-chat-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';

import { Suspense } from 'react';

function ChatsContent() {
    const { activeOrgId } = useOrganization();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const activeChatIdParam = searchParams.get('chat');
    const parsedId = activeChatIdParam ? parseInt(activeChatIdParam) : null;
    const activeChatId = parsedId && !isNaN(parsedId) ? parsedId : null;

    const setActiveChatId = (id: number | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (id) {
            params.set('chat', id.toString());
        } else {
            params.delete('chat');
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);

    const utils = trpc.useUtils();

    // Queries
    const { data: session } = trpc.user.getSession.useQuery();
    const currentUserId = session?.user?.id;

    const { data: chats, isLoading: isLoadingChats } =
        trpc.chat.getChats.useQuery(
            { organizationId: activeOrgId! },
            { enabled: !!activeOrgId },
        );

    const { data: messages, isLoading: isLoadingMessages } =
        trpc.chat.getMessages.useQuery(
            { chatId: activeChatId! },
            {
                enabled: !!activeChatId,
                refetchInterval: 3000, // Poll for new messages every 3 seconds for simplicity
            },
        );

    // Mutations
    const createChatMutation = trpc.chat.getOrCreateDirectChat.useMutation({
        onSuccess: (chat) => {
            utils.chat.getChats.invalidate();
            setActiveChatId(chat.id);
            setIsNewChatDialogOpen(false);
        },
        onError: (err) => {
            toast.error(err.message || 'Failed to start chat');
        },
    });

    const sendMessageMutation = trpc.chat.sendMessage.useMutation({
        onSuccess: () => {
            if (activeChatId) {
                utils.chat.getMessages.invalidate({ chatId: activeChatId });
            }
            utils.chat.getChats.invalidate();
        },
        onError: (err) => {
            toast.error(err.message || 'Failed to send message');
        },
    });

    const markAsReadMutation = trpc.chat.markAsRead.useMutation({
        onSuccess: () => {
            if (activeChatId) {
                utils.chat.getMessages.invalidate({ chatId: activeChatId });
            }
        },
    });

    const editMessageMutation = trpc.chat.editMessage.useMutation({
        onSuccess: () => {
            if (activeChatId) {
                utils.chat.getMessages.invalidate({ chatId: activeChatId });
            }
        },
        onError: (err) => {
            toast.error(err.message || 'Failed to edit message');
        },
    });

    const deleteMessageMutation = trpc.chat.deleteMessage.useMutation({
        onSuccess: () => {
            if (activeChatId) {
                utils.chat.getMessages.invalidate({ chatId: activeChatId });
            }
            utils.chat.getChats.invalidate();
        },
        onError: (err) => {
            toast.error(err.message || 'Failed to delete message');
        },
    });

    // Mark as read when active chat changes or messages change
    useEffect(() => {
        if (
            activeChatId &&
            messages &&
            Array.isArray(messages) &&
            currentUserId
        ) {
            const hasUnread = messages.some(
                (m) => !m.readAt && m.sender.id !== currentUserId,
            );
            if (hasUnread) {
                markAsReadMutation.mutate({ chatId: activeChatId });
            }
        }
    }, [activeChatId, messages, currentUserId]);

    const activeChat = chats?.find((c) => c.id === activeChatId);

    const handleSendMessage = (content: string, attachments?: any[]) => {
        if (!activeChatId) return;
        sendMessageMutation.mutate({
            chatId: activeChatId,
            content,
            attachments: attachments?.map((a) => ({
                fileName: a.fileName,
                fileUrl: a.fileUrl,
                fileType: a.fileType,
                fileSize: a.fileSize,
            })),
        });
    };

    const handleSelectMember = (userId: string) => {
        if (!activeOrgId) return;
        createChatMutation.mutate({
            organizationId: activeOrgId,
            userId,
        });
    };

    return (
        <div className="bg-background -m-4 flex h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] flex-1 overflow-hidden">
            <ChatSidebar
                chats={chats || []}
                activeChatId={activeChatId}
                onSelectChat={setActiveChatId}
                onNewChat={() => setIsNewChatDialogOpen(true)}
                isLoading={isLoadingChats}
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 z-10 flex h-16 shrink-0 items-center justify-between border-b px-6 backdrop-blur">
                            <div className="flex items-center gap-3">
                                <Avatar className="ring-primary/10 h-10 w-10 ring-2">
                                    <AvatarImage src={activeChat.image || ''} />
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        {activeChat.name ? (
                                            activeChat.name[0]
                                        ) : (
                                            <User className="h-5 w-5" />
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold">
                                        {activeChat.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                            {isLoadingMessages ? (
                                <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                                </div>
                            ) : null}
                            <ChatMessages
                                messages={messages || []}
                                currentUserId={currentUserId || ''}
                                onEditMessage={(messageId, content) =>
                                    editMessageMutation.mutate({
                                        messageId,
                                        content,
                                    })
                                }
                                onDeleteMessage={(messageId) =>
                                    deleteMessageMutation.mutate({ messageId })
                                }
                            />
                        </div>

                        {/* Input */}
                        <ChatInput
                            onSendMessage={handleSendMessage}
                            disabled={sendMessageMutation.isPending}
                        />
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-6 text-center">
                        <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full shadow-inner">
                            <User className="text-muted-foreground h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-heading text-2xl font-bold">
                                Your Messages
                            </h2>
                            <p className="text-muted-foreground max-w-sm">
                                Select a conversation from the sidebar or start
                                a new one to begin chatting with your
                                organization members.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <NewChatDialog
                open={isNewChatDialogOpen}
                onOpenChange={setIsNewChatDialogOpen}
                onSelectMember={handleSelectMember}
            />
        </div>
    );
}

export default function ChatsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="text-primary h-8 w-8 animate-spin" />
                </div>
            }
        >
            <ChatsContent />
        </Suspense>
    );
}
