'use client';

import Mathematics from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState, useEffect } from 'react';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { cn } from '@/lib/utils';

interface TiptapViewerProps {
    content: string;
    className?: string;
}

const CustomImage = Image.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            width: {
                default: '100%',
                parseHTML: (element) =>
                    element.getAttribute('data-width') ||
                    element.style.width ||
                    element.getAttribute('width') ||
                    '100%',
                renderHTML: (attrs) => ({
                    style: `width: ${attrs.width}; max-width: 100%;`,
                    'data-width': attrs.width,
                }),
            },
            height: {
                default: 'auto',
                parseHTML: (element) =>
                    element.getAttribute('data-height') ||
                    element.style.height ||
                    element.getAttribute('height') ||
                    'auto',
                renderHTML: (attrs) => ({
                    style: `height: ${attrs.height}; object-fit: contain; max-width: 100%;`,
                    'data-height': attrs.height,
                }),
            },
            align: {
                default: 'center',
                parseHTML: (element) =>
                    element.getAttribute('data-align') || 'center',
                renderHTML: (attrs) => {
                    let style = `width: ${attrs.width}; height: ${attrs.height}; object-fit: contain; max-width: 100%;`;
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

export default function TiptapViewer({
    content,
    className,
}: TiptapViewerProps) {
    // Handle empty or undefined content
    const safeContent = content ? content : '<p></p>';

    // Ensure content is valid HTML, wrap plaintext in paragraph if needed
    const ensureValidHtml = (htmlContent: string): string => {
        if (!htmlContent.trim()) return '<p></p>';

        // If content doesn't start with an HTML tag, wrap it in a paragraph
        if (!htmlContent.trim().startsWith('<')) {
            return `<p>${htmlContent}</p>`;
        }

        return htmlContent;
    };

    const isPreviewMode = className?.includes('preview-only');
    const isDocumentPreview = className?.includes('document-preview');
    const isNoticePreview = className?.includes('notice-preview');
    const isChatMessage = className?.includes('chat-message-content');

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Youtube.configure({
                controls: true,
                nocookie: true,
                modestBranding: true,
                allowFullscreen: true,
            }),
            TableKit,
            CustomImage,
            Link.configure({
                openOnClick: true,
                autolink: true,
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
        ],
        content: ensureValidHtml(safeContent),
        editable: false,
        editorProps: {
            attributes: {
                class: cn(
                    'prose dark:prose-invert',
                    // Different prose sizes based on type
                    isPreviewMode && 'prose-xs max-h-16 line-clamp-1',
                    isDocumentPreview &&
                        'prose-sm text-[0.8rem] leading-normal p-0 border-0 max-w-none',
                    isNoticePreview &&
                        'prose-xs text-[0.75rem] leading-snug text-muted-foreground p-0 border-0 max-w-none',
                    // Chat message mode - compact inline rendering
                    isChatMessage &&
                        'prose-sm p-0 border-0 max-w-none text-inherit',
                    // Normal mode
                    !isPreviewMode &&
                        !isDocumentPreview &&
                        !isNoticePreview &&
                        !isChatMessage &&
                        'prose-sm sm:prose-base lg:prose-lg xl:prose-xl w-full bg-transparent',
                    'focus-visible:outline-none',
                ),
            },
        },
    });

    useEffect(() => {
        if (editor && editor.getHTML() !== ensureValidHtml(safeContent)) {
            editor.commands.setContent(ensureValidHtml(safeContent));
        }
    }, [safeContent, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div
            className={cn(
                'w-full overflow-x-hidden break-words',
                (isPreviewMode || isDocumentPreview || isNoticePreview) &&
                    'overflow-hidden',
                className,
            )}
        >
            <EditorContent editor={editor} />
            <style>{`
                .ProseMirror {
                    overflow-wrap: break-word;
                    word-break: break-word;
                }
                .dark .ProseMirror:not(.text-inherit) {
                    color: var(--foreground);
                }
                .ProseMirror * {
                    max-width: 100%;
                    overflow-wrap: break-word;
                    word-break: break-word;
                }
                .ProseMirror a {
                    color: #2563eb !important;
                    text-decoration: underline;
                    word-break: break-all;
                    overflow: hidden;
                }
                .ProseMirror pre {
                    white-space: pre-wrap;
                    overflow: hidden;
                }
                .ProseMirror table {
                    display: block;
                    width: 100%;
                    max-width: 100%;
                    overflow-x: auto;
                    table-layout: fixed;
                }
                .ProseMirror td,
                .ProseMirror th {
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    word-break: break-word;
                    max-width: 200px;
                    min-width: 80px;
                    white-space: pre-line;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    vertical-align: top;
                }
                .ProseMirror img {
                    max-width: 100% !important;
                    height: auto !important;
                }
            `}</style>
        </div>
    );
}
