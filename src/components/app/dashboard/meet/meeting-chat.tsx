'use client';

import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/server/trpc/client';
import { useSession } from '@/server/auth/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import TiptapEditor from '@/components/app/tiptap/tiptap-editor';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';

interface MeetingChatProps {
    meetingId: string;
}

interface ChatMessage {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
    sender: {
        id: string;
        name: string;
        image: string | null;
    };
}

export function MeetingChat({ meetingId }: MeetingChatProps) {
    const { data: session } = useSession();
    const [messageContent, setMessageContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);

    const utils = trpc.useUtils();

    // Fetch messages
    const { data: messages = [], isLoading } = trpc.meet.getMessages.useQuery(
        { meetingId },
        {
            refetchInterval: 2000, // Poll every 2 seconds for new messages
        },
    );

    // Send message mutation
    const sendMessageMutation = trpc.meet.sendMessage.useMutation({
        onSuccess: () => {
            setMessageContent('');
            // Clear the editor
            if (editorRef.current) {
                editorRef.current.commands.setContent('<p></p>');
            }
            utils.meet.getMessages.invalidate({ meetingId });
        },
    });

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        // Check if content has actual text (not just empty HTML)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = messageContent;
        const textContent = tempDiv.textContent || tempDiv.innerText;

        if (!textContent.trim() || sendMessageMutation.isPending) return;

        sendMessageMutation.mutate({
            meetingId,
            content: messageContent.trim(),
        });
    };

    const handleEditorKeyDown = (event: KeyboardEvent) => {
        // Send on Enter (without Shift)
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
            return true;
        }
        return false;
    };

    const currentUserId = session?.user?.id;

    // Group messages to determine when to show avatar
    const shouldShowAvatar = (message: ChatMessage, index: number): boolean => {
        if (index === 0) return true;
        const prevMessage = messages[index - 1];
        return prevMessage.senderId !== message.senderId;
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="bg-background flex h-full flex-col">
            {/* Chat header - minimal, no close button */}
            <div className="border-border flex-shrink-0 border-b px-4 py-3">
                <h3 className="text-foreground text-sm font-medium">Chat</h3>
            </div>

            {/* Messages area */}
            <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-3">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground text-sm">
                            Loading messages...
                        </p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground text-center text-sm">
                            No messages yet.
                            <br />
                            Start the conversation!
                        </p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isOwnMessage = message.senderId === currentUserId;
                        const showAvatar = shouldShowAvatar(message, index);

                        return (
                            <div
                                key={message.id}
                                className={cn(
                                    'flex gap-2',
                                    isOwnMessage
                                        ? 'flex-row-reverse'
                                        : 'flex-row',
                                )}
                            >
                                {/* Avatar - show for first message in group */}
                                {showAvatar ? (
                                    <Avatar className="h-7 w-7 flex-shrink-0">
                                        <AvatarImage
                                            src={
                                                message.sender.image ||
                                                undefined
                                            }
                                        />
                                        <AvatarFallback className="bg-primary/10 text-[10px]">
                                            {getInitials(message.sender.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="w-7 flex-shrink-0" />
                                )}

                                {/* Message content */}
                                <div
                                    className={cn(
                                        'flex max-w-[75%] flex-col',
                                        isOwnMessage
                                            ? 'items-end'
                                            : 'items-start',
                                    )}
                                >
                                    {/* Sender name and time - show for first message in group */}
                                    {showAvatar && (
                                        <div
                                            className={cn(
                                                'mb-0.5 flex items-center gap-2',
                                                isOwnMessage &&
                                                    'flex-row-reverse',
                                            )}
                                        >
                                            <span className="text-xs font-medium">
                                                {isOwnMessage
                                                    ? 'You'
                                                    : message.sender.name}
                                            </span>
                                            <span className="text-muted-foreground text-[10px]">
                                                {new Date(
                                                    message.createdAt,
                                                ).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    )}

                                    <div className="text-sm break-words">
                                        <TiptapViewer
                                            content={message.content}
                                            className="chat-message-content"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input with TiptapEditor */}
            <div className="border-border flex-shrink-0 border-t p-2">
                <div className="flex items-end gap-2">
                    <div className="min-w-0 flex-1">
                        <TiptapEditor
                            onChange={setMessageContent}
                            onEditorCreated={(editor) => {
                                editorRef.current = editor;
                            }}
                            onKeyDown={handleEditorKeyDown}
                            initialContent="<p></p>"
                            placeholder="Type a message..."
                            hideToolbar={true}
                            className="w-full"
                            editorClassName="min-h-[36px] max-h-[120px] overflow-y-auto p-2 text-sm border rounded-lg"
                        />
                    </div>
                    <Button
                        size="icon"
                        className="h-9 w-9 flex-shrink-0"
                        onClick={handleSendMessage}
                        disabled={sendMessageMutation.isPending}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
