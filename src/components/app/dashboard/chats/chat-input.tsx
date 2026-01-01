'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Send,
    Plus,
    Paperclip,
    Smile,
    Clapperboard,
    MoreHorizontal,
    X,
    FileIcon,
    Loader2,
} from 'lucide-react';
import TiptapEditor from '@/components/app/tiptap/tiptap-editor';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Editor } from '@tiptap/react';

interface Attachment {
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
}

interface ChatInputProps {
    onSendMessage: (content: string, attachments?: Attachment[]) => void;
    disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [giphySearch, setGiphySearch] = useState('');
    const [giphyResults, setGiphyResults] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [editor, setEditor] = useState<Editor | null>(null);

    const handleKeyDown = (event: any) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
            return true;
        }
        return false;
    };

    const handleSend = () => {
        if (!editor) return;
        const content = editor.getHTML();
        const textContent = editor.getText().trim();

        if (
            (textContent || attachments.length > 0) &&
            !disabled &&
            !isUploading
        ) {
            onSendMessage(content, attachments);
            editor.commands.clearContent();
            setAttachments([]);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                // Mock upload or use the existing /api/v1/upload
                const res = await fetch('/api/v1/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                    }),
                });

                if (res.ok) {
                    const { presignedUrl, publicUrl } = await res.json();
                    await fetch(presignedUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': file.type },
                        body: file,
                    });

                    setAttachments((prev) => [
                        ...prev,
                        {
                            fileName: file.name,
                            fileUrl: publicUrl,
                            fileType: file.type,
                            fileSize: file.size,
                        },
                    ]);
                }
            }
        } catch (error) {
            console.error('File upload failed', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const searchGiphy = async (query: string) => {
        setGiphySearch(query);
        if (!query) return;

        try {
            const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
            const res = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${query}&limit=12`,
            );
            const data = await res.json();
            setGiphyResults(data.data || []);
        } catch (error) {
            console.error('Giphy search failed', error);
        }
    };

    const selectGiphy = (gif: any) => {
        const gifUrl = gif.images.fixed_height.url;
        onSendMessage(`<img src="${gifUrl}" alt="GIF" />`);
    };

    return (
        <div className="border-border bg-background shrink-0 border-t p-4">
            {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {attachments.map((file, idx) => (
                        <div
                            key={idx}
                            className="bg-muted border-border group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs shadow-sm"
                        >
                            <FileIcon className="text-primary h-3 w-3" />
                            <span className="max-w-[150px] truncate font-medium">
                                {file.fileName}
                            </span>
                            <button
                                onClick={() =>
                                    setAttachments((prev) =>
                                        prev.filter((_, i) => i !== idx),
                                    )
                                }
                                className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                <div className="mb-1 flex items-center gap-1">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-muted h-9 w-9 rounded-full"
                            >
                                <Plus className="text-muted-foreground h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="top"
                            align="start"
                            className="w-48 p-1"
                        >
                            <div className="grid grid-cols-1 gap-1">
                                <Button
                                    variant="ghost"
                                    className="h-9 justify-start gap-2"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    <Paperclip className="h-4 w-4" />
                                    <span>Attachment</span>
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-9 justify-start gap-2"
                                        >
                                            <Clapperboard className="h-4 w-4" />
                                            <span>GIF</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        side="right"
                                        align="end"
                                        className="border-border w-72 overflow-hidden p-0 shadow-xl"
                                    >
                                        <div className="bg-muted/50 border-border border-b p-3">
                                            <h3 className="mb-2 text-xs font-bold tracking-wider uppercase">
                                                Search GIPHY
                                            </h3>
                                            <Input
                                                className="bg-background h-8 text-xs"
                                                placeholder="Search for GIFs..."
                                                value={giphySearch}
                                                onChange={(e) =>
                                                    searchGiphy(e.target.value)
                                                }
                                            />
                                        </div>
                                        <ScrollArea className="h-64 p-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                {giphyResults.map((gif) => (
                                                    <img
                                                        key={gif.id}
                                                        src={
                                                            gif.images
                                                                .preview_gif.url
                                                        }
                                                        alt="GIF"
                                                        className="hover:ring-primary h-24 w-full cursor-pointer rounded object-cover transition-all hover:ring-2"
                                                        onClick={() =>
                                                            selectGiphy(gif)
                                                        }
                                                    />
                                                ))}
                                                {giphyResults.length === 0 && (
                                                    <div className="text-muted-foreground col-span-2 py-8 text-center text-xs">
                                                        Search for something
                                                        awesome!
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    variant="ghost"
                                    className="h-9 justify-start gap-2"
                                >
                                    <Smile className="h-4 w-4" />
                                    <span>Emoji</span>
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="bg-muted/50 border-border focus-within:ring-primary/20 focus-within:bg-background h-fit min-h-[44px] flex-1 overflow-hidden rounded-2xl border pr-2 transition-all focus-within:ring-2">
                    <TiptapEditor
                        hideToolbar
                        placeholder="Type a message..."
                        onEditorCreated={setEditor}
                        onKeyDown={handleKeyDown}
                        editorClassName="min-h-0 border-0 p-3 max-h-[200px] overflow-y-auto"
                        className="border-0 shadow-none"
                    />
                </div>

                <Button
                    size="icon"
                    className="h-10 w-10 rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                    onClick={handleSend}
                    disabled={
                        disabled ||
                        isUploading ||
                        (!editor?.getText().trim() && attachments.length === 0)
                    }
                >
                    {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                multiple
            />
        </div>
    );
}
