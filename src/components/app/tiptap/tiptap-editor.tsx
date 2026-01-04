'use client';

import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import Mathematics, { migrateMathStrings } from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Code,
    Italic,
    Strikethrough,
    Table2,
    Plus,
    Minus,
    Rows,
    Columns,
    Trash2,
    Merge,
    Split,
    ArrowDown,
    ArrowUp,
    ChevronDown,
    UnderlineIcon,
    YoutubeIcon,
    Sigma,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TableKit } from '@tiptap/extension-table';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import FileHandler from '@tiptap/extension-file-handler';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import { Link as LinkIcon } from 'lucide-react';

interface TiptapEditorProps {
    onChange?: (content: string) => void;
    onEditorCreated?: (editor: any) => void;
    onKeyDown?: (event: any) => boolean;
    initialContent?: string;
    placeholder?: string;
    className?: string;
    editorClassName?: string;
    hideToolbar?: boolean;
    autoFocus?: boolean | 'start' | 'end' | 'all' | number | null;
}

export default function TiptapEditor({
    onChange,
    onEditorCreated,
    onKeyDown,
    initialContent = '<p></p>',
    placeholder = 'Type text or add YouTube videos...',
    className,
    editorClassName,
    hideToolbar = false,
    autoFocus = false,
}: TiptapEditorProps) {
    const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');

    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageWidth, setImageWidth] = useState('600');
    const [imageHeight, setImageHeight] = useState('400');
    const [imageAlign, setImageAlign] = useState('center');
    const [imageWrap, setImageWrap] = useState(true);
    const [selectedImagePos, setSelectedImagePos] = useState<number | null>(
        null,
    );

    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [selectedText, setSelectedText] = useState('');

    // Ensure initial content is valid HTML
    const ensureValidHtml = (htmlContent: string): string => {
        if (!htmlContent || !htmlContent.trim()) return '<p></p>';

        // If content doesn't look like HTML, wrap it in paragraph tags
        if (!htmlContent.trim().startsWith('<')) {
            return `<p>${htmlContent}</p>`;
        }

        return htmlContent;
    };

    const uploadImageToR2 = async (file: File): Promise<string | null> => {
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    context: file.type.startsWith('image/') ? 'img' : 'doc',
                }),
            });
            if (!res.ok) return null;
            const { presignedUrl, publicUrl } = await res.json();
            const uploadRes = await fetch(presignedUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            if (!uploadRes.ok) return null;
            return publicUrl;
        } catch {
            return null;
        }
    };

    const CustomImage = Image.extend({
        addAttributes() {
            return {
                ...this.parent?.(),
                width: {
                    default: '600px',
                    parseHTML: (element) =>
                        element.getAttribute('data-width') ||
                        element.style.width ||
                        element.getAttribute('width') ||
                        '600px',
                    renderHTML: (attrs) => ({
                        'data-width': attrs.width,
                    }),
                },
                height: {
                    default: '400px',
                    parseHTML: (element) =>
                        element.getAttribute('data-height') ||
                        element.style.height ||
                        element.getAttribute('height') ||
                        '400px',
                    renderHTML: (attrs) => ({
                        'data-height': attrs.height,
                    }),
                },
                align: {
                    default: 'center',
                    parseHTML: (element) =>
                        element.getAttribute('data-align') || 'center',
                    renderHTML: (attrs) => {
                        const displayHeight = '300px';
                        const aspectRatio = 'auto';

                        let style = `height: ${displayHeight} !important; width: ${aspectRatio} !important; object-fit: contain;`;

                        if (attrs.wrap === false) {
                            style +=
                                ' display: block; clear: both; margin: 1em auto;';
                        } else if (attrs.align === 'left') {
                            style += ' float: left; margin-right: 1em;';
                        } else if (attrs.align === 'right') {
                            style += ' float: right; margin-left: 1em;';
                        } else {
                            style +=
                                ' display: block; margin-left: auto; margin-right: auto;';
                        }

                        return {
                            'data-align': attrs.align,
                            'data-wrap': attrs.wrap,
                            'data-width': attrs.width,
                            'data-height': attrs.height,
                            style,
                        };
                    },
                },
                wrap: {
                    default: true,
                    parseHTML: (element) =>
                        element.getAttribute('data-wrap') !== 'false',
                    renderHTML: (attrs) => ({ 'data-wrap': attrs.wrap }),
                },
            };
        },
    });

    const editor = useEditor({
        immediatelyRender: false,
        autofocus: autoFocus,
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: placeholder,
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right'],
                defaultAlignment: 'left',
            }),
            Youtube.configure({
                controls: true,
                nocookie: true,
                modestBranding: true,
                allowFullscreen: true,
                width: 640,
                height: 360,
                HTMLAttributes: {
                    class: 'w-full',
                },
            }),
            TableKit.configure({
                table: { resizable: true },
            }),
            CustomImage,
            LinkExtension.configure({
                openOnClick: false,
                autolink: false,
                linkOnPaste: true,
            }),
            Mathematics.configure({
                katexOptions: {
                    throwOnError: false,
                    macros: {
                        '\\R': '\\mathbb{R}',
                        '\\N': '\\mathbb{N}',
                    },
                },
            }),
            FileHandler.configure({
                allowedMimeTypes: [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                    'text/csv',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ],
                onPaste: async (editor, files) => {
                    for (const file of files) {
                        const url = await uploadImageToR2(file);
                        if (url) {
                            if (file.type.startsWith('image/')) {
                                editor
                                    .chain()
                                    .focus()
                                    .setImage({ src: url })
                                    .run();
                            } else {
                                editor
                                    .chain()
                                    .focus()
                                    .insertContent(
                                        `<a href="${url}" target="_blank" download>${file.name}</a>`,
                                    )
                                    .run();
                            }
                        }
                    }
                },
                onDrop: async (editor, files, pos) => {
                    for (const file of files) {
                        const url = await uploadImageToR2(file);
                        if (url) {
                            if (file.type.startsWith('image/')) {
                                editor
                                    .chain()
                                    .focus()
                                    .setImage({ src: url })
                                    .run();
                            } else {
                                editor
                                    .chain()
                                    .focus()
                                    .insertContent(
                                        `<a href="${url}" target="_blank" download>${file.name}</a>`,
                                    )
                                    .run();
                            }
                        }
                    }
                },
            }),
        ],
        content: ensureValidHtml(initialContent),
        editorProps: {
            attributes: {
                class: cn(
                    'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none',
                    'dark:text-foreground text-foreground w-full rounded-md border-input bg-transparent focus-visible:outline-none',
                    !editorClassName?.includes('p-') && 'p-4',
                    !editorClassName?.includes('border') && 'border',
                    !editorClassName?.includes('min-h-') && 'min-h-[200px]',
                    editorClassName,
                ),
            },
            handleKeyDown: (view, event) => {
                if (onKeyDown) {
                    return onKeyDown(event);
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            if (onChange) {
                onChange(editor.getHTML());
            }
        },
        onCreate: ({ editor }) => {
            if (onEditorCreated) {
                onEditorCreated(editor);
            }
        },
    });

    useEffect(() => {
        if (editor) {
            const html = ensureValidHtml(initialContent);
            if (editor.getHTML() !== html) {
                editor.commands.setContent(html);
            }
            migrateMathStrings(editor);
        }
    }, [initialContent, editor]);

    useEffect(() => {
        if (!editor) return;
        const handlePaste = () => {
            setTimeout(() => migrateMathStrings(editor), 0);
        };
        editor.view.dom.addEventListener('paste', handlePaste);
        return () => editor.view.dom.removeEventListener('paste', handlePaste);
    }, [editor]);

    const addYoutubeVideo = () => {
        if (editor && youtubeUrl) {
            editor.commands.setYoutubeVideo({
                src: youtubeUrl,
                width: 640,
                height: 360,
            });
            setYoutubeUrl('');
            setYoutubeDialogOpen(false);
        }
    };

    const addLink = () => {
        if (editor && linkUrl) {
            editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: linkUrl })
                .run();
            setLinkDialogOpen(false);
            setLinkUrl('');
        }
    };
    const removeLink = () => {
        if (editor) {
            editor.chain().focus().unsetLink().run();
            setLinkDialogOpen(false);
            setLinkUrl('');
        }
    };

    useEffect(() => {
        if (!editor) return;
        const handleClick = (event: MouseEvent) => {
            if (event.target instanceof HTMLImageElement) {
                const pos = editor.view.posAtDOM(event.target, 0);
                const node = editor.state.doc.nodeAt(pos);
                if (node?.type.name === 'image') {
                    setSelectedImagePos(pos);

                    const imgElement = event.target as HTMLImageElement;
                    let width =
                        imgElement.getAttribute('data-width') ||
                        node.attrs.width ||
                        '600px';
                    let height =
                        imgElement.getAttribute('data-height') ||
                        node.attrs.height ||
                        '400px';

                    width = String(width).replace('px', '');
                    height = String(height).replace('px', '');

                    setImageWidth(width);
                    setImageHeight(height);
                    setImageAlign(node.attrs.align || 'center');
                    setImageWrap(node.attrs.wrap !== false);
                    setImageDialogOpen(true);
                }
            }
        };
        editor.view.dom.addEventListener('click', handleClick);
        return () => editor.view.dom.removeEventListener('click', handleClick);
    }, [editor]);

    const handleImageConfigSet = useCallback(() => {
        if (editor && selectedImagePos !== null) {
            const width = imageWidth ? `${imageWidth}px` : '400px';
            const height = imageHeight ? `${imageHeight}px` : '300px';
            const align = imageAlign || 'center';
            const wrap = imageWrap;

            editor.commands.command(({ tr, state }) => {
                if (selectedImagePos !== null) {
                    const currentAttrs =
                        state.doc.nodeAt(selectedImagePos)?.attrs || {};
                    tr.setNodeMarkup(selectedImagePos, undefined, {
                        ...currentAttrs,
                        width,
                        height,
                        align,
                        wrap,
                    });
                    return true;
                }
                return false;
            });
            setImageDialogOpen(false);
        }
    }, [
        editor,
        selectedImagePos,
        imageWidth,
        imageHeight,
        imageAlign,
        imageWrap,
    ]);

    if (!editor) {
        return null;
    }

    return (
        <div className={cn('text-foreground w-full', className)}>
            {!hideToolbar && (
                <div className="border-input bg-background rounded-t-md border">
                    <div className="scrollbar-thin flex items-center gap-1 overflow-x-auto border-b p-1 whitespace-nowrap">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleBold()
                                            .run()
                                    }
                                    className={
                                        editor.isActive('bold')
                                            ? 'bg-accent'
                                            : ''
                                    }
                                    aria-label="Bold"
                                >
                                    <Bold className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Bold</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleItalic()
                                            .run()
                                    }
                                    className={
                                        editor.isActive('italic')
                                            ? 'bg-accent'
                                            : ''
                                    }
                                    aria-label="Italic"
                                >
                                    <Italic className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Italic</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleUnderline()
                                            .run()
                                    }
                                    className={
                                        editor.isActive('underline')
                                            ? 'bg-accent'
                                            : ''
                                    }
                                    aria-label="Underline"
                                >
                                    <UnderlineIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Underline</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleStrike()
                                            .run()
                                    }
                                    className={
                                        editor.isActive('strike')
                                            ? 'bg-accent'
                                            : ''
                                    }
                                    aria-label="Strikethrough"
                                >
                                    <Strikethrough className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Strikethrough</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .toggleCode()
                                            .run()
                                    }
                                    className={
                                        editor.isActive('code')
                                            ? 'bg-accent'
                                            : ''
                                    }
                                    aria-label="Code"
                                >
                                    <Code className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Code</TooltipContent>
                        </Tooltip>

                        <div className="bg-border mx-1 h-6 w-px" />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setYoutubeDialogOpen(true)}
                                    aria-label="Insert YouTube Video"
                                >
                                    <YoutubeIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Insert YouTube Video
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        const { from, to } =
                                            editor.state.selection;
                                        const selected =
                                            editor.state.doc.textBetween(
                                                from,
                                                to,
                                                ' ',
                                            );
                                        setSelectedText(selected);
                                        let previousUrl = '';
                                        if (editor.isActive('link')) {
                                            previousUrl =
                                                editor.getAttributes('link')
                                                    .href || '';
                                        }
                                        setLinkUrl(previousUrl);
                                        setLinkDialogOpen(true);
                                    }}
                                    className={
                                        editor.isActive('link')
                                            ? 'bg-accent'
                                            : ''
                                    }
                                    aria-label="Insert Link"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Insert Link</TooltipContent>
                        </Tooltip>

                        <div className="bg-border mx-1 h-6 w-px" />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign('left')
                                            .run()
                                    }
                                    className={
                                        editor.isActive({ textAlign: 'left' })
                                            ? 'bg-accent'
                                            : ''
                                    }
                                    aria-label="Align Left"
                                >
                                    <AlignLeft className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Left</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign('center')
                                            .run()
                                    }
                                    className={
                                        editor.isActive({ textAlign: 'center' })
                                            ? 'bg-accent'
                                            : ''
                                    }
                                    aria-label="Align Center"
                                >
                                    <AlignCenter className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Center</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .setTextAlign('right')
                                            .run()
                                    }
                                    className={
                                        editor.isActive({ textAlign: 'right' })
                                            ? 'bg-accent'
                                            : ''
                                    }
                                    aria-label="Align Right"
                                >
                                    <AlignRight className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Align Right</TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Table actions"
                                        >
                                            <Table2 className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>Table actions</TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .insertTable({
                                                rows: 3,
                                                cols: 3,
                                                withHeaderRow: true,
                                            })
                                            .run()
                                    }
                                >
                                    <Table2 className="mr-2 h-4 w-4" />
                                    Insert table
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .addColumnBefore()
                                            .run()
                                    }
                                >
                                    <Columns className="mr-2 h-4 w-4" />
                                    Add column before
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .addColumnAfter()
                                            .run()
                                    }
                                >
                                    <Columns className="mr-2 h-4 w-4" />
                                    Add column after
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .deleteColumn()
                                            .run()
                                    }
                                >
                                    <Columns className="mr-2 h-4 w-4" />
                                    Delete column
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .addRowBefore()
                                            .run()
                                    }
                                >
                                    <Rows className="mr-2 h-4 w-4" />
                                    Add row before
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .addRowAfter()
                                            .run()
                                    }
                                >
                                    <Rows className="mr-2 h-4 w-4" />
                                    Add row after
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        editor.chain().focus().deleteRow().run()
                                    }
                                >
                                    <Rows className="mr-2 h-4 w-4" />
                                    Delete row
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() =>
                                        editor
                                            .chain()
                                            .focus()
                                            .deleteTable()
                                            .run()
                                    }
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete table
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            )}

            <EditorContent
                editor={editor}
                className={cn(
                    'border-input rounded-b-md border border-t-0',
                    hideToolbar && 'rounded-t-md border-t',
                )}
            />

            <AlertDialog
                open={youtubeDialogOpen}
                onOpenChange={setYoutubeDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Insert YouTube Video
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                        <div className="space-y-2">
                            <span className="text-muted-foreground block text-sm">
                                Enter a YouTube video URL (e.g.,
                                https://www.youtube.com/watch?v=dQw4w9WgXcQ)
                            </span>
                            <Input
                                id="youtube-url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addYoutubeVideo();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={addYoutubeVideo}>
                            Embed
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={imageDialogOpen}
                onOpenChange={setImageDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Configure Image</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="1"
                                    value={imageWidth}
                                    onChange={(e) =>
                                        setImageWidth(e.target.value)
                                    }
                                    placeholder="Width (px)"
                                />
                                <span>x</span>
                                <Input
                                    type="number"
                                    min="1"
                                    value={imageHeight}
                                    onChange={(e) =>
                                        setImageHeight(e.target.value)
                                    }
                                    placeholder="Height (px)"
                                />
                                <span>px</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Alignment:</span>
                                <Button
                                    variant={
                                        imageAlign === 'left'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => setImageAlign('left')}
                                >
                                    Left
                                </Button>
                                <Button
                                    variant={
                                        imageAlign === 'center'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => setImageAlign('center')}
                                >
                                    Center
                                </Button>
                                <Button
                                    variant={
                                        imageAlign === 'right'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => setImageAlign('right')}
                                >
                                    Right
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Text Wrap:</span>
                                <Button
                                    variant={imageWrap ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setImageWrap(true)}
                                >
                                    Wrap
                                </Button>
                                <Button
                                    variant={!imageWrap ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setImageWrap(false)}
                                >
                                    Below
                                </Button>
                            </div>
                        </div>
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setImageDialogOpen(false)}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleImageConfigSet}>
                            Set
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Insert Link</AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                        <div className="space-y-2">
                            <span className="text-muted-foreground block text-sm">
                                Enter a URL to link the selected text.
                            </span>
                            <Input
                                id="link-url"
                                placeholder="https://example.com"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addLink();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={removeLink}>
                            Remove Link
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={addLink}>
                            Set Link
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <style jsx global>{`
                .ProseMirror a {
                    color: #2563eb !important;
                }
                /* Placeholder styling */
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: var(--muted-foreground);
                    opacity: 0.6;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror {
                    color: inherit;
                }
                .dark .ProseMirror:not(.text-inherit) {
                    color: var(--foreground);
                }
            `}</style>
        </div>
    );
}
