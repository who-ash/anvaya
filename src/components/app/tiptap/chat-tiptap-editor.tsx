'use client';

import { EditorContent, useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useImperativeHandle, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ChatTiptapEditorProps {
    placeholder?: string;
    onSubmit?: (html: string) => void;
    disabled?: boolean;
    className?: string;
    initialContent?: string;
    onContentChange?: (html: string) => void;
}

export interface ChatTiptapEditorRef {
    insertContent: (content: string) => void;
    insertLink: (url: string, text: string) => void;
    insertImage: (url: string, alt?: string) => void;
    clear: () => void;
    focus: () => void;
    getHTML: () => string;
    isEmpty: () => boolean;
}

const ChatTiptapEditor = forwardRef<ChatTiptapEditorRef, ChatTiptapEditorProps>(
    (
        {
            placeholder = 'Type a message...',
            onSubmit,
            disabled,
            className,
            initialContent,
            onContentChange,
        },
        ref,
    ) => {
        const editor = useEditor({
            immediatelyRender: false,
            extensions: [
                StarterKit.configure({
                    heading: {
                        levels: [1, 2, 3],
                    },
                }),
                Underline,
                LinkExtension.configure({
                    openOnClick: false,
                    autolink: true,
                    linkOnPaste: true,
                    HTMLAttributes: {
                        class: 'text-primary underline cursor-pointer hover:text-primary/80',
                    },
                }),
                Image.configure({
                    inline: true,
                    HTMLAttributes: {
                        class: 'max-w-full h-auto rounded-md',
                    },
                }),
                Placeholder.configure({
                    placeholder,
                    emptyEditorClass: 'is-editor-empty',
                }),
            ],
            content: initialContent || '<p></p>',
            editorProps: {
                attributes: {
                    class: cn(
                        'prose prose-sm dark:prose-invert max-w-none',
                        'focus:outline-none',
                        'min-h-[40px] max-h-[200px] overflow-y-auto',
                        'px-3 py-2',
                        'text-sm',
                    ),
                },
                handleKeyDown: (view, event) => {
                    // Submit on Enter (without Shift)
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        const html = editor?.getHTML() || '';
                        const isEmpty = editor?.isEmpty || true;

                        if (!isEmpty && onSubmit) {
                            onSubmit(html);
                        }
                        return true;
                    }
                    return false;
                },
            },
            onUpdate: ({ editor }) => {
                if (onContentChange) {
                    onContentChange(editor.getHTML());
                }
            },
            editable: !disabled,
        });

        // Update content when initialContent changes
        useEffect(() => {
            if (editor && initialContent !== undefined) {
                const currentContent = editor.getHTML();
                if (currentContent !== initialContent) {
                    editor.commands.setContent(initialContent);
                }
            }
        }, [initialContent, editor]);

        // Update editable state when disabled changes
        useEffect(() => {
            if (editor) {
                editor.setEditable(!disabled);
            }
        }, [disabled, editor]);

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            insertContent: (content: string) => {
                if (editor) {
                    editor.chain().focus().insertContent(content).run();
                }
            },
            insertLink: (url: string, text: string) => {
                if (editor) {
                    editor
                        .chain()
                        .focus()
                        .insertContent(
                            `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a> `,
                        )
                        .run();
                }
            },
            insertImage: (url: string, alt?: string) => {
                if (editor) {
                    editor
                        .chain()
                        .focus()
                        .setImage({ src: url, alt: alt || 'image' })
                        .run();
                }
            },
            clear: () => {
                if (editor) {
                    editor.commands.clearContent();
                }
            },
            focus: () => {
                if (editor) {
                    editor.commands.focus();
                }
            },
            getHTML: () => {
                return editor?.getHTML() || '<p></p>';
            },
            isEmpty: () => {
                return editor?.isEmpty ?? true;
            },
        }));

        if (!editor) {
            return null;
        }

        return (
            <div
                className={cn(
                    'border-input bg-background rounded-md border',
                    'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2',
                    disabled && 'cursor-not-allowed opacity-50',
                    className,
                )}
            >
                <EditorContent editor={editor} />
                <style jsx global>{`
                    .ProseMirror p.is-editor-empty:first-child::before {
                        color: hsl(var(--muted-foreground));
                        content: attr(data-placeholder);
                        float: left;
                        height: 0;
                        pointer-events: none;
                    }

                    .ProseMirror {
                        scrollbar-width: thin;
                    }

                    .ProseMirror::-webkit-scrollbar {
                        width: 6px;
                    }

                    .ProseMirror::-webkit-scrollbar-track {
                        background: transparent;
                    }

                    .ProseMirror::-webkit-scrollbar-thumb {
                        background: hsl(var(--muted-foreground) / 0.3);
                        border-radius: 3px;
                    }

                    .ProseMirror::-webkit-scrollbar-thumb:hover {
                        background: hsl(var(--muted-foreground) / 0.5);
                    }

                    .ProseMirror p {
                        margin: 0;
                    }

                    .ProseMirror ul,
                    .ProseMirror ol {
                        margin: 0.25rem 0;
                        padding-left: 1.5rem;
                    }

                    .ProseMirror h1,
                    .ProseMirror h2,
                    .ProseMirror h3 {
                        margin: 0.5rem 0 0.25rem 0;
                        line-height: 1.2;
                    }

                    .ProseMirror code {
                        background-color: hsl(var(--muted));
                        padding: 0.125rem 0.25rem;
                        border-radius: 0.25rem;
                        font-size: 0.875em;
                    }

                    .ProseMirror pre {
                        background-color: hsl(var(--muted));
                        padding: 0.5rem;
                        border-radius: 0.375rem;
                        margin: 0.5rem 0;
                        overflow-x: auto;
                    }

                    .ProseMirror pre code {
                        background-color: transparent;
                        padding: 0;
                    }

                    .ProseMirror blockquote {
                        border-left: 3px solid hsl(var(--border));
                        padding-left: 1rem;
                        margin: 0.5rem 0;
                        color: hsl(var(--muted-foreground));
                    }

                    .ProseMirror img {
                        max-height: 200px;
                        margin: 0.25rem 0;
                    }
                `}</style>
            </div>
        );
    },
);

ChatTiptapEditor.displayName = 'ChatTiptapEditor';

export default ChatTiptapEditor;
